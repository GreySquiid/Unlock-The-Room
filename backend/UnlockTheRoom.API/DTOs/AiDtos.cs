namespace UnlockTheRoom.API.DTOs;

public class GenerateLevelRequestDto
{
    public string Difficulty { get; set; } = "Medium";
    public int Rows { get; set; } = 12;
    public int Columns { get; set; } = 16;
    public int KeyCount { get; set; } = 3;
    public bool IncludeHazards { get; set; } = true;
    public string? LevelName { get; set; }

    // Design system — all optional; defaults are resolved by AiService
    public string? LayoutArchetype { get; set; }   // ExitTower | LongBaseRoute | ChamberPuzzle | SnakeCorridor | OpenMinimalist | SplitVerticalGates
    public string LayoutDensity { get; set; } = "Moderate";   // Sparse | Moderate | Dense
    public string? CampaignRole { get; set; }      // Tutorial | Early | Mid | Late | Challenge (inferred from Difficulty if null)
}

public class GeneratedGameObjectDto
{
    public string ObjectType { get; set; } = string.Empty;
    public int PositionX { get; set; }
    public int PositionY { get; set; }
    public int Width { get; set; } = 1;
    public int Height { get; set; } = 1;
    public string? Color { get; set; }
    public string? HazardType { get; set; }
}

public class GeneratedRoutePlatformDto
{
    public string PlatformId { get; set; } = string.Empty;
    public bool IsRequiredRoute { get; set; }
    public int PositionX { get; set; }
    public int PositionY { get; set; }
    public int Width { get; set; } = 1;
    public int Height { get; set; } = 1;
}

public class GeneratedGatePlanEntryDto
{
    public string Color { get; set; } = string.Empty;
    public string KeyPlatformId { get; set; } = string.Empty;
    public string BarrierPlatformId { get; set; } = string.Empty;
}

public class GeneratedLevelDto
{
    public string Name { get; set; } = string.Empty;
    public string Difficulty { get; set; } = string.Empty;
    public int Rows { get; set; }
    public int Columns { get; set; }
    public List<string> KeyOrder { get; set; } = new();
    public List<GeneratedRoutePlatformDto> RoutePlatforms { get; set; } = new();
    public List<GeneratedGatePlanEntryDto> GatePlan { get; set; } = new();
    public List<GeneratedGameObjectDto> GameObjects { get; set; } = new();
    public string AiReasoning { get; set; } = string.Empty;
    // Set by AiService after generation — not part of the AI response
    public string Archetype { get; set; } = string.Empty;
    public List<string> ValidationWarnings { get; set; } = new();
}