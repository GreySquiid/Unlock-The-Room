namespace UnlockTheRoom.API.Models;

public class Score
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public int LevelId { get; set; }
    public int CompletionTimeSeconds { get; set; }
    public DateTime AchievedAt { get; set; } = DateTime.UtcNow;

    public virtual User? User { get; set; }
    public virtual Level? Level { get; set; }
}