namespace UnlockTheRoom.API.Models;

public class Key : GameObject
{
    public string Color { get; set; } = string.Empty;
    public bool IsCollected { get; set; } = false;

    public override string GetObjectDescription() => $"Key (Color: {Color}, Collected: {IsCollected})";

}