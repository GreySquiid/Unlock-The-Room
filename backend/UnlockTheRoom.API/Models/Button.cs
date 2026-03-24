namespace UnlockTheRoom.API.Models;

public class Button : GameObject
{
    public bool IsActivated { get; set; }  = false;
    public string TargetObjectType {get; set; } = string.Empty;
    
    public override string GetObjectDescription() =>
        $"Button (Activated: {IsActivated}, Controls: {TargetObjectType})";
}