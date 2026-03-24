namespace UnlockTheRoom.API.Models;

public class ExitDoor : GameObject
{
    public bool IsUnlocked { get; set; }  = false;
    
    public override string GetObjectDescription() =>
        $"Exit Door (Unlocked: {IsUnlocked})";
}