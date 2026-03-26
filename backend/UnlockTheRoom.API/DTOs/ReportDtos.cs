namespace UnlockTheRoom.API.DTOs;

public class LevelReportItemDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Difficulty { get; set; } = string.Empty;
    public int Rows { get; set; }
    public int Columns { get; set; }
    public bool IsValidated { get; set; }
    public bool IsPublished { get; set; }
    public int GameObjectCount { get; set; }
    public int ScoreCount { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class LevelReportDto
{
    public string ReportTitle { get; set; } = string.Empty;
    public DateTime GeneratedAt { get; set; }
    public int TotalLevels { get; set; }
    public int PublishedCount { get; set; }
    public int ValidatedCount { get; set; }
    public int EasyCount { get; set; }
    public int MediumCount { get; set; }
    public int HardCount { get; set; }
    public List<LevelReportItemDto> Levels { get; set; } = new();
}

public class ReportQueryDto
{
    public string? Difficulty { get; set; }
    public bool? IsPublished { get; set; }
    public DateTime? FromDate { get; set; }
    public DateTime? ToDate { get; set; }
}