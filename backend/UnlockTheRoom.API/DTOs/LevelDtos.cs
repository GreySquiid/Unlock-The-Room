namespace UnlockTheRoom.API.DTOs;

public class CreateLevelDto
{
    public string Name { get; set; } = string.Empty;
    public string Difficulty { get; set; } = string.Empty;
    public int Rows { get; set; }
    public int Columns { get; set; }
}

public class UpdateLevelDto
{
    public string Name { get; set; } = string.Empty;
    public string Difficulty { get; set; } = string.Empty;
    public int Rows { get; set; }
    public int Columns { get; set; }
    public bool IsPublished { get; set; }
}

public class LevelResponseDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Difficulty { get; set; } = string.Empty;
    public int Rows { get; set; }
    public int Columns { get; set; }
    public bool IsValidated { get; set; }
    public bool IsPublished { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
public class ReorderLevelsDto
{
    public List<int> LevelIds { get; set; } = new();
}
public class GameObjectDto
{
    public int Id { get; set; }
    public string ObjectType { get; set; } = string.Empty;
    public int PositionX { get; set; }
    public int PositionY { get; set; }
    public int Width { get; set; }
    public int Height { get; set; }
    public string? Color { get; set; }
    public string? HazardType { get; set; }
}

public class LevelDetailDto : LevelResponseDto
{
    public List<GameObjectDto> GameObjects { get; set; } = new();
}