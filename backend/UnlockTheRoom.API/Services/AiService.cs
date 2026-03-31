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
        CreatedAt = level.CreatedAt,
        UpdatedAt = level.UpdatedAt
    };
}

    private static List<string> GetRegularColors(int keyCount)
    {
        var allColors = new List<string> { "Red", "Blue", "Green", "Yellow", "Purple" };
        return allColors.Take(keyCount).ToList();
    }

    private static string BuildPrompt(GenerateLevelRequestDto request)
    {
        var levelName = request.LevelName ?? $"AI Level - {request.Difficulty}";
        int groundRow = request.Rows - 1;
        int rightWall = request.Columns - 1;
        int spawnX = 2;
        int spawnY = groundRow - 2;

        var regularColors = GetRegularColors(request.KeyCount);
        var keyOrder = regularColors.Concat(new[] { "White" }).ToList();
        var keyOrderJson = string.Join(", ", keyOrder.Select(color => $"\"{color}\""));

        int requiredRoutePlatforms = request.KeyCount + 2;

        return
    $@"You are a level designer for a 2D puzzle platformer called Unlock The Room.

Your goal is to create one VALID, BEATABLE level with a clear intended solution path.
The player must:
1. Spawn at the starting platform
2. Progress through the route from left to right and upward
3. Collect keys in the intended order
4. Unlock barriers that block route progression
5. Collect the White key before the final platform
6. Pass the White barrier
7. Reach the exit

IMPORTANT OUTPUT RULES
- Output ONLY valid JSON
- No markdown
- No comments
- No explanation outside the JSON
- All coordinates must be integers
- Think through the route plan first, then output the final JSON

GRID
- Grid size: {request.Rows} rows x {request.Columns} columns
- positionX = column
- positionY = row
- Top-left is 0,0
- Bottom row is {groundRow}

BORDERS
- Row {groundRow} is solid ground
- Column 0 and column {rightWall} are solid walls
- NEVER place any object on row {groundRow}
- NEVER place any object in column 0
- NEVER place any object in column {rightWall}
- All objects must remain fully inside the grid

SPAWN
- Place exactly one SpawnPoint at:
  positionX={spawnX}, positionY={spawnY}, width=1, height=1

PLATFORM RULES
- Create exactly {requiredRoutePlatforms} REQUIRED route platforms
- You may also create up to 2 OPTIONAL support platforms
- Total platform count must be between 6 and 8
- Every platform must have height=1
- Every platform width must be between 4 and 6
- The REQUIRED route platforms must be named in order:
  P1, P2, P3 ... P{requiredRoutePlatforms}
- P1 is the spawn platform
- P{requiredRoutePlatforms} is the exit platform
- Required route platforms must form one main path from left to right
- Required route platforms must generally rise upward as the player progresses
- Each required route platform must be reachable from the previous required route platform
- Maximum vertical gap between consecutive required route platforms: 4 rows
- Maximum horizontal gap between consecutive required route platforms: 6 columns
- Optional support platforms may help jumps but may NOT contain keys, barriers, or exit
- Optional support platforms may NOT allow the player to bypass any barrier

EXIT PLATFORM
- The exit platform must be the highest required route platform
- 'Highest' means smallest positionY
- The exit platform must also be the furthest-right required route platform

EXIT DOOR AND WHITE BARRIER
- Let the exit platform be P{requiredRoutePlatforms}
- Let exitPlatformRight = P{requiredRoutePlatforms}.positionX + P{requiredRoutePlatforms}.width - 1
- Place ExitDoor at:
  positionX = exitPlatformRight
  positionY = P{requiredRoutePlatforms}.positionY - 2
  width = 1
  height = 2
- The ExitDoor must stand directly on the exit platform
- Place White Barrier immediately LEFT of the ExitDoor at:
  positionX = exitPlatformRight - 1
  positionY = P{requiredRoutePlatforms}.positionY - 2
  width = 1
  height = 2
- The White Barrier must stand directly on the exit platform
- The White Barrier must be the FINAL gate before the exit
- There must be no alternate way to reach the ExitDoor without passing the White Barrier

REGULAR KEY/BARRIER COLORS
- Use exactly {request.KeyCount} regular colors from this order:
  Red, Blue, Green, Yellow, Purple
- Only use the first {request.KeyCount} colors from that list

KEY RULES
- Each regular key must be placed on a REQUIRED route platform
- A key must sit directly above its platform:
  key.positionY = platform.positionY - 1
- Each regular key must appear BEFORE its matching barrier in the intended route order
- Keys must be collected in the same order as the intended progression
- Never place a key on the same platform as its matching barrier

REGULAR BARRIER RULES
- Each regular barrier must be placed on a REQUIRED route platform
- Each regular barrier must be width=1 and height=2
- Each regular barrier must stand directly on its platform:
  barrier.positionY = platform.positionY - 2
- Each regular barrier must be at the RIGHT EDGE of its platform
- Each regular barrier must block progression to the next required route segment
- Each regular barrier must matter: it must gate the main route, not an optional side area
- The player must need that barrier's key before progressing beyond it
- Barrier order must match key order

GATE PLAN
- Create one gate plan entry for each regular color plus White
- Each gate plan entry must include:
  color
  keyPlatformId
  barrierPlatformId
  blockedTransitionFromPlatformId
  blockedTransitionToPlatformId
- For regular colors:
  - keyPlatformId must be an earlier required platform than barrierPlatformId
  - blockedTransitionFromPlatformId and blockedTransitionToPlatformId must be consecutive required route platforms
  - the barrier must block that transition in the intended solution path
- For White:
  - keyPlatformId must be in the lower half of the level
  - keyPlatformId must be before the final two required route platforms
  - barrierPlatformId must be P{requiredRoutePlatforms}
  - blockedTransitionToPlatformId must be P{requiredRoutePlatforms}

WHITE KEY
- Place exactly one White key
- The White key must be on a REQUIRED route platform
- The White key must be in the lower half of the level
- The White key must not be on the exit platform
- The White key must not be on the platform directly before the exit platform
- The White key must be reachable before the player reaches the final two required route platforms

HAZARDS
- includeHazards = {request.IncludeHazards.ToString().ToLower()}
- Only place hazards if includeHazards is true
- Hazards must be objectType = Hazard with hazardType = Spike
- Place spikes only at row {groundRow - 1}
- Maximum spike count:
  - Easy: 1
  - Medium: 2
  - Hard: 3
- Spikes may only be placed in open ground gaps
- NEVER place spikes directly below any platform tile
- NEVER place spikes directly below any key
- NEVER place spikes below the spawn platform
- NEVER place spikes in a required landing zone
- Spikes are punishment for falling, not unavoidable damage

SPACING AND OVERLAP
- No overlapping objects
- No key may overlap another key, barrier, exit, or spike
- No barrier may overlap another barrier, key, exit, or spike
- Do not place barriers adjacent to each other
- Avoid cluttered layouts

PLAYABILITY
The intended route must be clear:
- P1 -> P2 -> P3 ... -> P{requiredRoutePlatforms}
- Every regular barrier must block one required step of that route
- Every regular key must be collectible before its matching barrier
- White key must be collected before the final platform
- White barrier must be the last obstacle before the ExitDoor

SELF-CHECK BEFORE OUTPUT
Make sure ALL are true:
- Exactly one SpawnPoint exists at {spawnX},{spawnY}
- There are exactly {requiredRoutePlatforms} required route platforms
- Total platform count is between 6 and 8
- P1 is the spawn platform
- P{requiredRoutePlatforms} is the highest and rightmost required route platform
- ExitDoor stands on P{requiredRoutePlatforms}
- White Barrier is immediately left of ExitDoor on P{requiredRoutePlatforms}
- Exactly {request.KeyCount} regular keys exist
- Exactly {request.KeyCount} regular matching barriers exist
- Exactly one White key exists
- Exactly one White barrier exists
- Every regular key is on an earlier required route platform than its matching barrier
- Every barrier blocks the main route, not an optional area
- No object is on the border row or wall columns
- Spikes, if any, are only in legal ground gaps
- The level is beatable
- The gate plan matches the actual object placement

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
      ""barrierPlatformId"": ""P2"",
      ""blockedTransitionFromPlatformId"": ""P1"",
      ""blockedTransitionToPlatformId"": ""P2""
    }},
    {{
      ""color"": ""White"",
      ""keyPlatformId"": ""P2"",
      ""barrierPlatformId"": ""P{requiredRoutePlatforms}"",
      ""blockedTransitionFromPlatformId"": ""P{requiredRoutePlatforms - 1}"",
      ""blockedTransitionToPlatformId"": ""P{requiredRoutePlatforms}""
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
  ""aiReasoning"": ""Brief summary of the intended route and key order.""
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