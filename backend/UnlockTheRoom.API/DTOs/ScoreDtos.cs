namespace UnlockTheRoom.API.DTOs;

public class CreateScoreDto
{
    public int LevelId { get; set; }
    public int CompletionTimeSeconds { get; set; }
}

public class ScoreResponseDto
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public string Username { get; set; } = string.Empty;
    public int LevelId { get; set; }
    public string LevelName { get; set; } = string.Empty;
    public int CompletionTimeSeconds { get; set; }
    public string FormattedTime { get; set; } = string.Empty;
    public DateTime AchievedAt { get; set; }
}