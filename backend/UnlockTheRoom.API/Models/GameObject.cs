namespace UnlockTheRoom.API.Models;

public abstract class GameObject
{
    public int Id { get; set; }
    public float X { get; set; }
    public float Y { get; set; }
    public float Width { get; set; }
    public float Height { get; set; }
    public string ObjectType { get; set; } = string.Empty;
    
    public virtual Level? Level { get; set; }
    
    public abstract string GetObjectDescription();
}