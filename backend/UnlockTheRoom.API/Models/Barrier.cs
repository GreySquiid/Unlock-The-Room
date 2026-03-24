namespace UnlockTheRoom.API.Models;

public class Barrier : GameObject
{
    public string RequiredKeyColor { get; set; } = string.Empty;
    public bool IsUnlocked { get; set; }  = false;
    
    public override string GetObjectDescription() =>
        $"Barrier (Requires: {RequiredKeyColor} key, Unlocked: {IsUnlocked})";
}