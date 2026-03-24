namespace UnlockTheRoom.API.Models;

public class Level
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Difficulty { get; set; } = string.Empty;
    public int Rows { get; set; }
    public int Columns { get; set; }
    public bool IsValidated { get; set; } = false;
    public bool IsPublished { get; set; } = false;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public virtual ICollection<GameObject> GameObjects { get; set; } = new List<GameObject>();
    public virtual ICollection<Score> Scores { get; set; } = new List<Score>();
    public virtual ICollection<SavedLevel> SavedLevels { get; set; } = new List<SavedLevel>();
}