namespace UnlockTheRoom.API.Models;

public class User
{
    public int Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string Role { get; set; } = "Player";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public virtual ICollection<Score> Scores { get; set; } = new List<Score>();
    public virtual ICollection<SavedLevel> SavedLevels { get; set; } = new List<SavedLevel>();
}