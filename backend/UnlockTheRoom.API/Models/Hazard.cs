namespace UnlockTheRoom.API.Models;

public class Hazard : GameObject
{
    public string HazardType { get; set; } = string.Empty;
    
    public override string GetObjectDescription() =>
        $"Hazard (Type: {HazardType})";
}