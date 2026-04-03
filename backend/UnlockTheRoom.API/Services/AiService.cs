using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using UnlockTheRoom.API.Data;
using UnlockTheRoom.API.DTOs;
using UnlockTheRoom.API.Models;
using Barrier = UnlockTheRoom.API.Models.Barrier;
using Microsoft.EntityFrameworkCore;

namespace UnlockTheRoom.API.Services;

public class AiService
{
    private readonly HttpClient _httpClient;
    private readonly IConfiguration _configuration;
    private readonly AppDbContext _context;

    public AiService(HttpClient httpClient, IConfiguration configuration, AppDbContext context)
    {
        _httpClient = httpClient;
        _configuration = configuration;
        _context = context;
    }

    public async Task<GeneratedLevelDto> GenerateLevelAsync(GenerateLevelRequestDto request)
    {
        if (string.IsNullOrWhiteSpace(request.LevelName))
            request.LevelName = await GenerateUniqueLevelName();

        // Resolve design system values once so both the prompt and the validator use
        // identical archetype/density/token decisions for the same request.
        request.LayoutArchetype = ResolveArchetype(request);
        request.LayoutDensity   = ResolveDensity(request);
        if (string.IsNullOrWhiteSpace(request.CampaignRole))
            request.CampaignRole = ResolveCampaignRole(request);
        var activeTokens = SelectDesignTokens(request.LayoutArchetype, request.LayoutDensity);

        var prompt = BuildPrompt(request);
        var apiKey = _configuration["Anthropic:ApiKey"];
        var model = _configuration["Anthropic:Model"] ?? "claude-3-5-haiku-20241022";

        var requestBody = new
        {
            model,
            max_tokens = 4096,
            messages = new[]
            {
                new { role = "user", content = prompt }
            }
        };

        var json = JsonSerializer.Serialize(requestBody);
        var content = new StringContent(json, Encoding.UTF8, "application/json");

        _httpClient.DefaultRequestHeaders.Clear();
        _httpClient.DefaultRequestHeaders.Add("x-api-key", apiKey);
        _httpClient.DefaultRequestHeaders.Add("anthropic-version", "2023-06-01");

        var response = await _httpClient.PostAsync(
            "https://api.anthropic.com/v1/messages", content);

        if (!response.IsSuccessStatusCode)
        {
            var errorBody = await response.Content.ReadAsStringAsync();
            throw new Exception($"Anthropic API error {(int)response.StatusCode}: {errorBody}");
        }
        
        var responseJson = await response.Content.ReadAsStringAsync();
        var anthropicResponse = JsonSerializer.Deserialize<AnthropicResponse>(responseJson,
            new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

        var textContent = anthropicResponse?.Content?.FirstOrDefault()?.Text
            ?? throw new Exception("No response from Anthropic API");

        var cleanJson = ExtractJson(textContent);
        var generated = JsonSerializer.Deserialize<GeneratedLevelDto>(cleanJson,
            new JsonSerializerOptions { PropertyNameCaseInsensitive = true })
            ?? throw new Exception("Failed to parse AI response");

        generated.Archetype          = request.LayoutArchetype;
        generated.ValidationWarnings = ValidateDesignTokens(generated, activeTokens, request.Rows, request.Columns);

        return generated;
    }

    public async Task<LevelResponseDto> GenerateAndSaveLevelAsync(GenerateLevelRequestDto request)
    {
        var generated = await GenerateLevelAsync(request);

        var maxOrder = await _context.Levels.AnyAsync()
            ? await _context.Levels.MaxAsync(l => l.OrderIndex)
            : -1;

        var level = new Level
        {
            Name = generated.Name,
            Difficulty = generated.Difficulty,
            Rows = generated.Rows,
            Columns = generated.Columns,
            OrderIndex = maxOrder + 1,
            IsValidated = false,
            IsPublished = false,
            GeneratedArchetype = generated.Archetype,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Levels.Add(level);
        await _context.SaveChangesAsync();

        foreach (var platform in generated.RoutePlatforms)
        {
            var go = new Hazard { HazardType = "Platform" };
            go.Level = level;
            go.X = platform.PositionX;
            go.Y = platform.PositionY;
            go.Width = platform.Width;
            go.Height = platform.Height;
            go.ObjectType = "Hazard";
            _context.GameObjects.Add(go);
        }

        foreach (var obj in generated.GameObjects)
        {
            if (obj.ObjectType == "SpawnPoint") continue;

            GameObject gameObject = obj.ObjectType switch
            {
                "Key" => new Key { Color = obj.Color ?? "Red", IsCollected = false },
                "Barrier" => new Barrier { RequiredKeyColor = obj.Color ?? "Red", IsUnlocked = false },
                "Button" => new Models.Button { IsActivated = false, TargetObjectType = "Barrier" },
                "Hazard" => new Hazard { HazardType = obj.HazardType ?? "Spike" },
                "Platform" => new Hazard { HazardType = "Platform" },
                "ExitDoor" => new ExitDoor { IsUnlocked = false },
                _ => new Hazard { HazardType = "Generic" }
            };

            gameObject.Level = level;
            gameObject.X = obj.PositionX;
            gameObject.Y = obj.PositionY;
            gameObject.Width = obj.Width;
            gameObject.Height = obj.Height;
            gameObject.ObjectType = obj.ObjectType == "Platform" ? "Hazard" : obj.ObjectType;

            _context.GameObjects.Add(gameObject);
        }

        await _context.SaveChangesAsync();

        return new LevelResponseDto
        {
            Id = level.Id,
            Name = level.Name,
            Difficulty = level.Difficulty,
            Rows = level.Rows,
            Columns = level.Columns,
            IsValidated = level.IsValidated,
            IsPublished = level.IsPublished,
            GeneratedArchetype = level.GeneratedArchetype,
            CreatedAt = level.CreatedAt,
            UpdatedAt = level.UpdatedAt
        };
    }
    public async Task<LevelResponseDto> SaveGeneratedLevelAsync(GeneratedLevelDto generated)
{
    var maxOrder = await _context.Levels.AnyAsync()
        ? await _context.Levels.MaxAsync(l => l.OrderIndex)
        : -1;

    var level = new Level
    {
        Name = generated.Name,
        Difficulty = generated.Difficulty,
        Rows = generated.Rows,
        Columns = generated.Columns,
        OrderIndex = maxOrder + 1,
        IsValidated = false,
        IsPublished = false,
        GeneratedArchetype = generated.Archetype,
        CreatedAt = DateTime.UtcNow,
        UpdatedAt = DateTime.UtcNow
    };

    _context.Levels.Add(level);
    await _context.SaveChangesAsync();

    foreach (var obj in generated.GameObjects)
    {
        if (obj.ObjectType == "SpawnPoint") continue;

        GameObject gameObject = obj.ObjectType switch
        {
            "Key" => new Key { Color = obj.Color ?? "Red", IsCollected = false },
            "Barrier" => new Barrier { RequiredKeyColor = obj.Color ?? "Red", IsUnlocked = false },
            "Button" => new Models.Button { IsActivated = false, TargetObjectType = "Barrier" },
            "Hazard" => new Hazard { HazardType = obj.HazardType ?? "Spike" },
            "Platform" => new Hazard { HazardType = "Platform" },
            "ExitDoor" => new ExitDoor { IsUnlocked = false },
            _ => new Hazard { HazardType = "Generic" }
        };

        gameObject.Level = level;
        gameObject.X = obj.PositionX;
        gameObject.Y = obj.PositionY;
        gameObject.Width = obj.Width;
        gameObject.Height = obj.Height;
        gameObject.ObjectType = obj.ObjectType == "Platform" ? "Hazard" : obj.ObjectType;

        _context.GameObjects.Add(gameObject);
    }

    await _context.SaveChangesAsync();

    return new LevelResponseDto
    {
        Id = level.Id,
        Name = level.Name,
        Difficulty = level.Difficulty,
        Rows = level.Rows,
        Columns = level.Columns,
        IsValidated = level.IsValidated,
        IsPublished = level.IsPublished,
        GeneratedArchetype = level.GeneratedArchetype,
        CreatedAt = level.CreatedAt,
        UpdatedAt = level.UpdatedAt
    };
}

    private static List<string> GetRegularColors(int keyCount)
    {
        var allColors = new List<string> { "Red", "Blue", "Green", "Yellow", "Purple" };
        return allColors.Take(keyCount).ToList();
    }

    private async Task<string> GenerateUniqueLevelName()
    {
        var count = await _context.Levels.CountAsync();
        return $"Level {(count + 1):D2}";
    }

    // ── Design system constants ────────────────────────────────────────────────

    private static readonly string[] ValidArchetypes =
        ["ExitTower", "LongBaseRoute", "ChamberPuzzle", "SnakeCorridor", "OpenMinimalist", "SplitVerticalGates"];

    // ── Design system resolvers ────────────────────────────────────────────────

    private static string ResolveArchetype(GenerateLevelRequestDto req) =>
        !string.IsNullOrWhiteSpace(req.LayoutArchetype) &&
        ValidArchetypes.Contains(req.LayoutArchetype, StringComparer.OrdinalIgnoreCase)
            ? req.LayoutArchetype
            : ValidArchetypes[Random.Shared.Next(ValidArchetypes.Length)];

    private static string ResolveDensity(GenerateLevelRequestDto req) =>
        req.LayoutDensity switch
        {
            "Sparse" or "Moderate" or "Dense" => req.LayoutDensity,
            _ => "Moderate"
        };

    private static string ResolveCampaignRole(GenerateLevelRequestDto req)
    {
        if (!string.IsNullOrWhiteSpace(req.CampaignRole)) return req.CampaignRole;
        return req.Difficulty switch
        {
            "Easy" => "Early",
            "Hard" => "Late",
            _      => "Mid"
        };
    }

    private static List<string> SelectDesignTokens(string archetype, string density) =>
        archetype switch
        {
            "ExitTower"          => density == "Dense"
                                    ? ["RightExitTower", "VerticalGateColumn", "HazardFloorStrip"]
                                    : ["RightExitTower", "VerticalGateColumn", "TopBridge"],
            "LongBaseRoute"      => ["LongBottomRoute", "HazardFloorStrip", "FloatingMidAnchor"],
            "ChamberPuzzle"      => ["KeyChamber", "SplitRouteRegion", "VerticalGateColumn"],
            "SnakeCorridor"      => density == "Sparse"
                                    ? ["SplitRouteRegion", "FloatingMidAnchor"]
                                    : ["SplitRouteRegion", "FloatingMidAnchor", "HazardFloorStrip"],
            "OpenMinimalist"     => ["FloatingMidAnchor", "TopBridge"],
            "SplitVerticalGates" => ["VerticalGateColumn", "SplitRouteRegion", "KeyChamber"],
            _                    => ["FloatingMidAnchor"]
        };

    // ── Prompt section builders ────────────────────────────────────────────────

    private static string BuildStyleSection(string archetype, string density, string role, List<string> tokens)
    {
        var tokenList = string.Join(", ", tokens);
        return
            $"LEVEL STYLE\n" +
            $"- Layout archetype: {archetype}\n" +
            $"- Layout density:   {density}\n" +
            $"- Campaign role:    {role}\n" +
            $"- Design tokens:    {tokenList}\n\n" +
            "Every spatial decision — where platforms sit, how barriers divide space, where hazards fall — " +
            "must express this design language. The level must feel intentional and handcrafted, not randomly assembled.";
    }

    private static string BuildCampaignRoleSection(string role, int keyCount) => role switch
    {
        "Tutorial" =>
            "CAMPAIGN ROLE: TUTORIAL\n" +
            "- Platform widths: 6-8 tiles (wide, forgiving landings)\n" +
            "- Maximum vertical gap between platforms: 3 rows\n" +
            "- Do NOT include hazards regardless of includeHazards\n" +
            "- Limit to 1 active key/barrier gate even if keyCount is higher\n" +
            "- One simple, clearly visible barrier — no tall columns or chamber seals\n" +
            "- One obvious, unambiguous route from spawn to exit",

        "Early" =>
            $"CAMPAIGN ROLE: EARLY\n" +
            $"- Platform widths: 5-6 tiles\n" +
            $"- Generous gaps — maximum 3 rows vertical\n" +
            $"- At most 1 hazard even if density is Dense\n" +
            $"- {keyCount} key(s) — spacing between key pickups is generous\n" +
            $"- Good for teaching the basic barrier/key mechanic",

        "Mid" =>
            $"CAMPAIGN ROLE: MID\n" +
            $"- Platform widths: 4-6 tiles\n" +
            $"- Standard gaps — up to 4 rows vertical\n" +
            $"- Hazard count follows density rules\n" +
            $"- {keyCount} key(s) — the player should need to plan their route\n" +
            $"- Introduce one architectural barrier concept (taller gate or mid-platform barrier)",

        "Late" =>
            $"CAMPAIGN ROLE: LATE\n" +
            $"- Platform widths: 3-5 tiles acceptable\n" +
            $"- Tighter gaps — 3-4 rows vertical\n" +
            $"- Higher hazard counts are appropriate\n" +
            $"- {keyCount} key(s) — requires careful planning and route memory\n" +
            $"- Barriers may use height=3 and non-edge positions",

        "Challenge" =>
            $"CAMPAIGN ROLE: CHALLENGE\n" +
            $"- Platform widths: 3-4 tiles acceptable\n" +
            $"- Tight gaps — 2-3 rows vertical\n" +
            $"- Maximum hazard count for this difficulty\n" +
            $"- {keyCount} key(s) — dense, demanding, unforgiving\n" +
            $"- Barriers should use architectural placements: tall columns, chamber seals, zone dividers\n" +
            $"- The level should demand mastery of movement and route memory",

        _ => ""
    };

    private static string BuildArchetypeSection(string archetype, int rows, int cols, int groundRow, int rightWall, int spawnX)
    {
        int topZone     = rows / 4;
        int rightZone   = (int)(cols * 0.65);
        int midRow      = rows / 2;
        int thirdCol    = cols / 3;
        int twoThirdCol = cols * 2 / 3;

        return archetype switch
        {
            "ExitTower" =>
                $"MACRO SHAPE: EXIT TOWER\n" +
                $"The defining feature is a tall vertical tower in the upper-right zone (columns {rightZone} to {rightWall - 1}).\n" +
                $"- The final two required route platforms form the tower: a base platform and a top platform directly above it\n" +
                $"- Tower base: approximately row {groundRow - 3} to {groundRow - 4}\n" +
                $"- Tower top (exit platform, P-last): approximately row {topZone} to {topZone + 2}\n" +
                $"- The approach route (P1 through second-to-last) occupies the LEFT two-thirds of the grid\n" +
                $"- Approach platforms rise gradually left-to-right before the jump to the tower base\n" +
                $"- The final barrier seals the base of the tower — without the key the player cannot enter\n" +
                $"- The tower creates a clear visual landmark: reach the top-right to win",

            "LongBaseRoute" =>
                $"MACRO SHAPE: LONG BASE ROUTE\n" +
                $"A long horizontal route runs across the LOWER THIRD of the grid before the level rises sharply.\n" +
                $"- At least 3 platforms must be in the bottom third of the grid (rows {groundRow - 4} to {groundRow - 1})\n" +
                $"- These bottom platforms span left to right, creating a readable horizontal base\n" +
                $"- After clearing the base, the route rises sharply — remaining platforms climb to the upper zone\n" +
                $"- The exit platform is in the upper-right, reachable only after the full base route\n" +
                $"- Barriers in the base gate horizontal transitions; the player cannot skip ahead\n" +
                $"- Overall shape: long horizontal base → sharp vertical ascent (L-shape or hockey-stick)",

            "ChamberPuzzle" =>
                $"MACRO SHAPE: CHAMBER PUZZLE\n" +
                $"The grid is divided into 2-3 enclosed spatial regions (chambers) separated by barrier walls.\n" +
                $"- Divide the grid into thirds by column: left zone (cols 1-{thirdCol}), mid zone (cols {thirdCol}-{twoThirdCol}), right zone (cols {twoThirdCol}-{rightWall})\n" +
                $"- Each zone is a chamber: the player enters, finds the key, and unlocks the barrier to exit\n" +
                $"- Barriers act as chamber seals — they span passages between zones, not just platform edges\n" +
                $"- Use barrier height=3 to create prominent architectural walls between zones\n" +
                $"- The exit is in the rightmost chamber or atop the final chamber\n" +
                $"- Overall shape: left chamber → collect key → pass barrier → mid chamber → repeat → exit",

            "SnakeCorridor" =>
                $"MACRO SHAPE: SNAKE CORRIDOR\n" +
                $"The route alternates direction between tiers, creating a snake/zigzag traversal across the full grid width.\n" +
                $"- Bottom tier (rows {groundRow - 1} to {groundRow - 4}): platforms run LEFT to RIGHT — P1 near col {spawnX - 1}, P2 near col {rightWall - 6}\n" +
                $"- Middle tier (rows {midRow - 2} to {midRow + 2}): platforms run RIGHT to LEFT (player doubles back)\n" +
                $"- Top tier (rows {topZone} to {topZone + 3}): platforms run LEFT to RIGHT again toward the exit\n" +
                $"- Barriers gate the far end of each horizontal run, forcing the player to earn each directional turn\n" +
                $"- No platform should allow a shortcut between tiers via direct vertical drop",

            "OpenMinimalist" =>
                $"MACRO SHAPE: OPEN MINIMALIST\n" +
                $"Very few platforms, wide open space. Every platform placement must be deliberate.\n" +
                $"- Use the minimum platform count — required platforms only, or 1 optional at most\n" +
                $"- Platform widths: 6-8 tiles each — wide, stable, immediately readable\n" +
                $"- Platforms spread across the full grid area with generous space between them\n" +
                $"- No two platforms at exactly the same height — each is a distinct spatial landmark\n" +
                $"- Barriers are singular, prominent gates — not clusters of walls\n" +
                $"- Hazards (if any) form one deliberate strip, not scattered decoration\n" +
                $"- Overall silhouette: clean, airy, readable at a glance",

            "SplitVerticalGates" =>
                $"MACRO SHAPE: SPLIT VERTICAL GATES\n" +
                $"The grid is divided into vertical zones by tall barrier columns. The player passes through each gate in sequence.\n" +
                $"- Place 2-3 vertical gate barriers at approximately columns {thirdCol} and {twoThirdCol}\n" +
                $"- Each gate barrier: height=3 or height=4 — a clear vertical wall, not a decorative ornament\n" +
                $"- Platforms are arranged in horizontal bands within each zone\n" +
                $"- Each zone contains exactly one key (the key that opens the NEXT zone's gate)\n" +
                $"- Route: Zone A (left) → Gate 1 → Zone B (mid) → Gate 2 → Zone C (right, exit)\n" +
                $"- Platforms within each zone may vary in height; zone boundaries are defined by gate columns",

            _ => ""
        };
    }

    private static string BuildPlatformDensitySection(string density, int requiredPlatforms) =>
        density switch
        {
            "Sparse" =>
                $"PLATFORM COUNT AND DENSITY (SPARSE)\n" +
                $"- Required platforms: {requiredPlatforms} (P1 through P{requiredPlatforms})\n" +
                $"- Optional platforms: 0-1 (add only if essential for reachability)\n" +
                $"- Total: {requiredPlatforms} to {requiredPlatforms + 1} platforms\n" +
                $"- Platform width: 5-7 tiles — wide, stable landings\n" +
                $"- Vertical gap between consecutive platforms: 2-4 rows\n" +
                $"- Spread platforms across the full grid width — open space is intentional",

            "Dense" =>
                $"PLATFORM COUNT AND DENSITY (DENSE)\n" +
                $"- Required platforms: {requiredPlatforms} (P1 through P{requiredPlatforms})\n" +
                $"- Optional platforms: 2-3 (must never enable barrier bypasses)\n" +
                $"- Total: {requiredPlatforms + 2} to {requiredPlatforms + 3} platforms\n" +
                $"- Platform width: 3-5 tiles — narrower, requiring more precise movement\n" +
                $"- Vertical gap between consecutive platforms: 2-3 rows — tighter spacing",

            _ =>
                $"PLATFORM COUNT AND DENSITY (MODERATE)\n" +
                $"- Required platforms: {requiredPlatforms} (P1 through P{requiredPlatforms})\n" +
                $"- Optional platforms: 0-2\n" +
                $"- Total: {requiredPlatforms} to {requiredPlatforms + 2} platforms\n" +
                $"- Platform width: 4-6 tiles\n" +
                $"- Vertical gap between consecutive platforms: 2-4 rows\n" +
                $"- Spread platforms across most of the grid width"
        };

    private static string BuildBarrierSection(string archetype)
    {
        var archetypeRule = archetype switch
        {
            "ExitTower" =>
                "- The final barrier seals the base of the exit tower — placed so a player approaching from the left is blocked from entering the lower tower platform\n" +
                "- Intermediate barriers act as standard horizontal edge gates (height=2)\n" +
                "- Tower seal barrier: height=2 or 3",

            "LongBaseRoute" =>
                "- At least one barrier should span a horizontal floor gap in the base route, acting as a vertical wall column that blocks forward progress along the ground\n" +
                "- The player must collect the key and approach from the correct side\n" +
                "- Height=2 for standard edge gates; height=3 for floor-gap wall columns",

            "ChamberPuzzle" =>
                "- Barriers act as chamber seals between enclosed regions\n" +
                "- Position each barrier where it closes a passage between two zones — NOT just decoratively on a platform edge\n" +
                "- Use height=3 for chamber-sealing barriers to create prominent, architecturally significant walls\n" +
                "- The player must feel locked out of the next chamber until they have the correct key",

            "SnakeCorridor" =>
                "- Each barrier gates the far end of a horizontal corridor run, blocking the transition to the next tier\n" +
                "- Place each barrier at the far end of its horizontal corridor (not mid-platform)\n" +
                "- Height=2 is sufficient for corridor gates",

            "OpenMinimalist" =>
                "- Each barrier is a standalone, clearly visible gate — the focal point of its platform\n" +
                "- Use height=2 only — tall barriers would visually overwhelm the sparse layout\n" +
                "- Ensure generous open space around each barrier so it reads clearly from a distance",

            "SplitVerticalGates" =>
                "- Barriers are tall vertical columns dividing the grid into horizontal zones\n" +
                "- Use height=3 or height=4 for all zone-dividing barriers\n" +
                "- Position each barrier at the zone boundary column on a platform that spans that column\n" +
                "- The player must approach each gate from the correct horizontal direction",

            _ =>
                "- Barriers should divide space meaningfully — not sit decoratively on platform edges"
        };

        return
            "BARRIER PLACEMENT RULES\n" +
            "- Each regular barrier: width=1\n" +
            "- Default barrier height: 2; archetype rules below may require taller\n" +
            "- barrier.positionY = platform.positionY - barrier.height (stands directly on the platform surface)\n" +
            "- Every barrier must physically block the main route — without the key the player cannot pass\n" +
            "- Barrier color order must match key collection order\n" +
            archetypeRule;
    }

    private static string BuildHazardSection(bool includeHazards, string density, string role, string difficulty, int groundRow, int spawnX)
    {
        if (role == "Tutorial" || !includeHazards)
            return
                "HAZARDS\n" +
                (role == "Tutorial"
                    ? "- Do NOT place any hazards (overridden by Tutorial campaign role)"
                    : "- Do NOT place any hazards (includeHazards = false)");

        var maxSpikes = density switch
        {
            "Sparse" => 1,
            "Dense"  => difficulty == "Hard" ? 4 : 3,
            _        => difficulty switch { "Easy" => 1, "Hard" => 3, _ => 2 }
        };

        var hazardStyle = density switch
        {
            "Dense"  => "Hazards should form a deliberate strip of 2-3 consecutive spikes in an open ground section (HazardFloorStrip pattern)",
            "Sparse" => "A single hazard acts as a notable landmark — one deliberate spike in a key open ground gap",
            _        => "Hazards mark the dangerous gaps along the main route — placed to punish falling into key areas"
        };

        return
            $"HAZARDS\n" +
            $"- includeHazards = true\n" +
            $"- objectType = Hazard, hazardType = Spike\n" +
            $"- Place spikes only at row {groundRow - 1} (one row above the ground)\n" +
            $"- Maximum spike count (density={density}, difficulty={difficulty}): {maxSpikes}\n" +
            $"- {hazardStyle}\n" +
            $"- NEVER place spikes directly below any platform tile\n" +
            $"- NEVER place spikes directly below any key\n" +
            $"- NEVER place spikes near the spawn platform (columns {spawnX - 1} to {spawnX + 4})\n" +
            $"- NEVER place spikes in a required landing zone\n" +
            $"- Every spike must be avoidable by a player following the intended route";
    }

    private static string BuildDesignTokenSection(List<string> tokens)
    {
        var descriptions = new Dictionary<string, string>
        {
            ["RightExitTower"]     = "Build the exit as a recognizable multi-tier tower in the upper-right. Stack 2-3 platforms vertically. The exit door sits at the very top. This tower is the visual climax of the level.",
            ["LongBottomRoute"]    = "At least 3 platforms sit in the lower 35% of grid height, forming a readable horizontal base route that the player traverses left-to-right before climbing.",
            ["VerticalGateColumn"] = "At least one barrier is height=3 or taller, forming a prominent vertical column that reads as architecture — a wall the player walks up to and unlocks, not a decorative ornament.",
            ["KeyChamber"]         = "One region functions as an enclosed key chamber: a defined area where a key lives, surrounded by platforms and at least one barrier wall that locks the player in or out until the puzzle is solved.",
            ["FloatingMidAnchor"]  = "A platform cluster anchors the visual midpoint of the map — approximately 50% of grid height and 40-60% of grid width. At least one key or barrier lives here.",
            ["HazardFloorStrip"]   = "Hazards form a deliberate strip of 2-3 consecutive spikes across an open ground section — a visible danger zone the player must jump over. NOT scattered randomly.",
            ["TopBridge"]          = "A wide platform (width 6+) spans the upper portion of the grid at near-ceiling height, connecting approaches from left and right as a recognizable upper landmark.",
            ["SplitRouteRegion"]   = "The grid is visibly divided into 2-3 distinct spatial zones by platform arrangement and barrier placement. A player looking at the level should clearly see distinct zones."
        };

        var lines = tokens
            .Where(t => descriptions.ContainsKey(t))
            .Select(t => $"- {t}: {descriptions[t]}");

        return
            "ACTIVE DESIGN TOKENS (REQUIRED FEATURES)\n" +
            "The following design features MUST appear in this level. These are not suggestions:\n" +
            string.Join("\n", lines);
    }

    // ── Token validator ────────────────────────────────────────────────────────

    private static List<string> ValidateDesignTokens(
        GeneratedLevelDto level, List<string> tokens, int rows, int cols)
    {
        var warnings  = new List<string>();
        int groundRow = rows - 1;

        var barriers  = level.GameObjects.Where(o => o.ObjectType == "Barrier").ToList();
        var keys      = level.GameObjects.Where(o => o.ObjectType == "Key").ToList();
        var hazards   = level.GameObjects.Where(o => o.ObjectType == "Hazard" && o.HazardType == "Spike").ToList();
        var exitDoors = level.GameObjects.Where(o => o.ObjectType == "ExitDoor").ToList();
        var platforms = level.RoutePlatforms;

        foreach (var token in tokens)
        {
            switch (token)
            {
                case "VerticalGateColumn":
                    if (!barriers.Any(b => b.Height >= 3))
                        warnings.Add($"Token '{token}': no Barrier with height >= 3 found — tall vertical gate column not implemented.");
                    break;

                case "LongBottomRoute":
                    // Bottom 35% of the playable area (above ground row)
                    int bottomThreshold = (int)(groundRow * 0.65);
                    int bottomCount = platforms.Count(p => p.PositionY >= bottomThreshold);
                    if (bottomCount < 3)
                        warnings.Add($"Token '{token}': only {bottomCount} platform(s) in the bottom 35% of the grid (need >= 3) — long base route not implemented.");
                    break;

                case "RightExitTower":
                    var exitDoor = exitDoors.FirstOrDefault();
                    if (exitDoor == null || exitDoor.PositionX < (int)(cols * 0.6))
                        warnings.Add($"Token '{token}': ExitDoor is not in the right 40% of the grid — right exit tower not implemented.");
                    break;

                case "HazardFloorStrip":
                    if (hazards.Count < 2)
                    {
                        warnings.Add($"Token '{token}': fewer than 2 hazard spikes placed — hazard floor strip not implemented.");
                    }
                    else
                    {
                        var sortedX  = hazards.Select(h => h.PositionX).OrderBy(x => x).ToList();
                        bool hasStrip = false;
                        for (int i = 1; i < sortedX.Count; i++)
                            if (sortedX[i] - sortedX[i - 1] <= 2) { hasStrip = true; break; }
                        if (!hasStrip)
                            warnings.Add($"Token '{token}': hazard spikes are spread apart (none within 2 columns of each other) — floor strip not implemented.");
                    }
                    break;

                case "TopBridge":
                    int topRowLimit = (int)(rows * 0.3);
                    if (!platforms.Any(p => p.Width >= 6 && p.PositionY <= topRowLimit))
                        warnings.Add($"Token '{token}': no platform with width >= 6 in the upper 30% of the grid — top bridge not implemented.");
                    break;

                case "FloatingMidAnchor":
                    int midColMin = (int)(cols * 0.3);
                    int midColMax = (int)(cols * 0.7);
                    int midRowMin = (int)(rows * 0.3);
                    int midRowMax = (int)(rows * 0.7);
                    bool hasMidAnchor =
                        keys.Any(k => k.PositionX >= midColMin && k.PositionX <= midColMax &&
                                      k.PositionY >= midRowMin && k.PositionY <= midRowMax) ||
                        barriers.Any(b => b.PositionX >= midColMin && b.PositionX <= midColMax &&
                                          b.PositionY >= midRowMin && b.PositionY <= midRowMax) ||
                        platforms.Any(p =>
                        {
                            int cx = p.PositionX + p.Width / 2;
                            return cx >= midColMin && cx <= midColMax &&
                                   p.PositionY >= midRowMin && p.PositionY <= midRowMax;
                        });
                    if (!hasMidAnchor)
                        warnings.Add($"Token '{token}': no key, barrier, or platform centred in the middle 30-70% of the grid — floating mid-anchor not implemented.");
                    break;

                case "KeyChamber":
                    if (keys.Count == 0 || barriers.Count == 0)
                    {
                        warnings.Add($"Token '{token}': key chamber requires at least one key and one barrier.");
                    }
                    else
                    {
                        bool hasChamber = keys.Any(k =>
                            barriers.Any(b =>
                                Math.Abs(b.PositionX - k.PositionX) <= 5 &&
                                Math.Abs(b.PositionY - k.PositionY) <= 5));
                        if (!hasChamber)
                            warnings.Add($"Token '{token}': no key found within 5 tiles of a barrier — key chamber layout not implemented.");
                    }
                    break;

                case "SplitRouteRegion":
                    if (barriers.Count < 2)
                        warnings.Add($"Token '{token}': fewer than 2 barriers placed (need >= 2 to create visually distinct route regions).");
                    break;
            }
        }

        return warnings;
    }

    // ── Main prompt builder ────────────────────────────────────────────────────

    private static string BuildPrompt(GenerateLevelRequestDto request)
    {
        var archetype = ResolveArchetype(request);
        var density   = ResolveDensity(request);
        var role      = ResolveCampaignRole(request);
        var tokens    = SelectDesignTokens(archetype, density);

        var levelName = request.LevelName ?? "Level";
        int groundRow = request.Rows - 1;
        int rightWall = request.Columns - 1;
        int spawnX    = 2;
        int spawnY    = groundRow - 2;

        var regularColors          = GetRegularColors(request.KeyCount);
        var keyOrder               = regularColors.Concat(new[] { "White" }).ToList();
        var keyOrderJson           = string.Join(", ", keyOrder.Select(c => $"\"{c}\""));
        int requiredRoutePlatforms = request.KeyCount + 2;

        var styleSection    = BuildStyleSection(archetype, density, role, tokens);
        var campaignSection = BuildCampaignRoleSection(role, request.KeyCount);
        var macroSection    = BuildArchetypeSection(archetype, request.Rows, request.Columns, groundRow, rightWall, spawnX);
        var platformSection = BuildPlatformDensitySection(density, requiredRoutePlatforms);
        var barrierSection  = BuildBarrierSection(archetype);
        var hazardSection   = BuildHazardSection(request.IncludeHazards, density, role, request.Difficulty, groundRow, spawnX);
        var tokenSection    = BuildDesignTokenSection(tokens);
        var tokenSummary    = string.Join(", ", tokens);

        return $@"You are a level designer for a 2D puzzle platformer called Unlock The Room.
Your goal is to create one VALID, BEATABLE, and VISUALLY DISTINCT level based on the design brief below.
The player must:
1. Spawn at the starting platform
2. Follow the intended route — collecting keys and unlocking barriers in the correct order
3. Collect the White key before reaching the final platform
4. Pass the White barrier and reach the exit

{styleSection}

{campaignSection}

{macroSection}

IMPORTANT OUTPUT RULES
- Output ONLY valid JSON
- No markdown, no comments, no text outside the JSON
- All coordinates must be integers
- Think through the macro layout and archetype shape first, then place objects to express it

GRID
- Grid size: {request.Rows} rows x {request.Columns} columns
- positionX = column, positionY = row
- Top-left is (0,0)
- Bottom row is {groundRow}

BORDERS
- Row {groundRow} is solid ground
- Column 0 and column {rightWall} are solid walls
- NEVER place any object on row {groundRow}, column 0, or column {rightWall}
- All objects must remain fully inside the grid

SPAWN
- Place exactly one SpawnPoint at: positionX={spawnX}, positionY={spawnY}, width=1, height=1

{platformSection}

EXIT PLATFORM
- P{requiredRoutePlatforms} is the exit platform
- It must be the HIGHEST (smallest positionY) and FURTHEST-RIGHT required route platform
- Its position must match the macro shape's intended exit location

EXIT DOOR AND WHITE BARRIER
- Let exitPlatformRight = P{requiredRoutePlatforms}.positionX + P{requiredRoutePlatforms}.width - 1
- ExitDoor: positionX = exitPlatformRight, positionY = P{requiredRoutePlatforms}.positionY - 2, width=1, height=2
- White Barrier: positionX = exitPlatformRight - 1, positionY = P{requiredRoutePlatforms}.positionY - 2, width=1, height=2
- Both stand directly on P{requiredRoutePlatforms}
- There must be no way to reach the ExitDoor without passing the White Barrier

REGULAR KEY/BARRIER COLORS
- Use exactly {request.KeyCount} regular colors in this order: Red, Blue, Green, Yellow, Purple
- Only use the first {request.KeyCount} from that list

KEY RULES
- Each regular key must be on a REQUIRED route platform
- key.positionY = platform.positionY - 1 (key sits directly above its platform surface)
- Each key must appear BEFORE its matching barrier in the intended route order
- Never place a key on the same platform as its matching barrier

{barrierSection}

GATE PLAN
- Create one gate plan entry for each regular color plus White
- For regular colors: keyPlatformId must be an earlier required platform than barrierPlatformId
- For White: barrierPlatformId must be P{requiredRoutePlatforms}

WHITE KEY
- Exactly one White key on a REQUIRED route platform
- Must be in the lower half of the level
- Must NOT be on the exit platform or the platform directly before it
- Must be reachable before the final two required route platforms

{hazardSection}

{tokenSection}

SPACING AND OVERLAP
- No overlapping objects
- No key may overlap another key, barrier, exit, or spike
- No barrier may overlap another barrier, key, exit, or spike
- Do not place barriers adjacent to each other
- Maintain readable visual spacing between all objects

PLAYABILITY
The intended route is: P1 → P2 → ... → P{requiredRoutePlatforms}
- Every regular barrier blocks exactly one required step of that route
- Every key is collectible before its matching barrier
- White key is collected before the final platform
- White barrier is the last obstacle before the ExitDoor
- The level is beatable by following the intended route

SELF-CHECK BEFORE OUTPUT
Verify ALL of the following are true:
- Exactly one SpawnPoint at ({spawnX},{spawnY})
- Exactly {requiredRoutePlatforms} required route platforms (P1-P{requiredRoutePlatforms})
- Platform count matches the {density} density range
- P1 is the spawn platform; P{requiredRoutePlatforms} is highest and furthest-right
- ExitDoor and White Barrier stand on P{requiredRoutePlatforms}
- Exactly {request.KeyCount} regular keys and {request.KeyCount} matching barriers
- Exactly one White key and one White barrier
- Every barrier blocks the main route, not an optional area
- No object on border row or wall columns
- Hazards (if any) only in legal open ground gaps
- The level is beatable end-to-end
- Gate plan matches actual object placement
- The macro shape matches the {archetype} archetype
- All active design tokens ({tokenSummary}) are implemented in the level geometry

Respond with ONLY this JSON shape:
{{
  ""name"": ""{levelName}"",
  ""difficulty"": ""{request.Difficulty}"",
  ""rows"": {request.Rows},
  ""columns"": {request.Columns},
  ""keyOrder"": [{keyOrderJson}],
  ""routePlatforms"": [
    {{
      ""platformId"": ""P1"",
      ""isRequiredRoute"": true,
      ""positionX"": {spawnX - 1},
      ""positionY"": {spawnY},
      ""width"": 5,
      ""height"": 1
    }}
  ],
  ""gatePlan"": [
    {{
      ""color"": ""{(regularColors.Count > 0 ? regularColors[0] : "Red")}"",
      ""keyPlatformId"": ""P1"",
      ""barrierPlatformId"": ""P2""
    }},
    {{
      ""color"": ""White"",
      ""keyPlatformId"": ""P2"",
      ""barrierPlatformId"": ""P{requiredRoutePlatforms}""
    }}
  ],
  ""gameObjects"": [
    {{
      ""objectType"": ""SpawnPoint|Platform|Key|Barrier|ExitDoor|Hazard"",
      ""positionX"": 0,
      ""positionY"": 0,
      ""width"": 1,
      ""height"": 1,
      ""color"": null,
      ""hazardType"": null
    }}
  ],
  ""aiReasoning"": ""Describe: (1) which archetype was used and how the macro shape is implemented, (2) how barriers divide space architecturally rather than decoratively, (3) how hazards support the route shape, (4) which design tokens were implemented and where.""
}}";
    }

    private static string ExtractJson(string text)
    {
        var start = text.IndexOf('{');
        var end = text.LastIndexOf('}');
        if (start == -1 || end == -1)
            throw new Exception("No JSON found in AI response");
        return text[start..(end + 1)];
    }
}

public class AnthropicResponse
{
    public List<AnthropicContent>? Content { get; set; }
}

public class AnthropicContent
{
    public string? Text { get; set; }
    public string? Type { get; set; }
}