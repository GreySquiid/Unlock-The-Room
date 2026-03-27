namespace UnlockTheRoom.API.DTOs;

public class SavedLevelResponseDto
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public int LevelId { get; set; }
    public string LevelName { get; set; } = string.Empty;
    public string Difficulty { get; set; } = string.Empty;
    public int Rows { get; set; }
    public int Columns { get; set; }
    public DateTime SavedAt { get; set; }
}