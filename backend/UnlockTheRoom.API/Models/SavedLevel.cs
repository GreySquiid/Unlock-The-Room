namespace UnlockTheRoom.API.Models;

public class SavedLevel
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public int LevelId { get; set; }
    public DateTime SavedAt { get; set; } = DateTime.UtcNow;

    public virtual User? User { get; set; }
    public virtual Level? Level { get; set; }
}