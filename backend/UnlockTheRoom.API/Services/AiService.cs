using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using UnlockTheRoom.API.Data;
using UnlockTheRoom.API.DTOs;
using UnlockTheRoom.API.Models;
using Barrier = UnlockTheRoom.API.Models.Barrier;

namespace UnlockTheRoom.API.Services;

public class AiService
{
    private readonly HttpClient _httpClient;
    private readonly IConfiguration _configuration;
    private readonly AppDbContext _context;

    public AiService(HttpClient httpClient, IConfiguration configuration, AppDbContext context)
    {
        _httpClient = httpClient;
        _configuration = configuration;
        _context = context;
    }

    public async Task<GeneratedLevelDto> GenerateLevelAsync(GenerateLevelRequestDto request)
    {
        var prompt = BuildPrompt(request);
        var apiKey = _configuration["Anthropic:ApiKey"];
        var model = _configuration["Anthropic:Model"] ?? "claude-3-5-haiku-20241022";

        var requestBody = new
        {
            model,
            max_tokens = 2048,
            messages = new[]
            {
                new { role = "user", content = prompt }
            }
        };

        var json = JsonSerializer.Serialize(requestBody);
        var content = new StringContent(json, Encoding.UTF8, "application/json");

        _httpClient.DefaultRequestHeaders.Clear();
        _httpClient.DefaultRequestHeaders.Add("x-api-key", apiKey);
        _httpClient.DefaultRequestHeaders.Add("anthropic-version", "2023-06-01");

        var response = await _httpClient.PostAsync(
            "https://api.anthropic.com/v1/messages", content);

        if (!response.IsSuccessStatusCode)
        {
            var errorBody = await response.Content.ReadAsStringAsync();
            throw new Exception($"Anthropic API error {(int)response.StatusCode}: {errorBody}");
        }
        
        var responseJson = await response.Content.ReadAsStringAsync();
        var anthropicResponse = JsonSerializer.Deserialize<AnthropicResponse>(responseJson,
            new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

        var textContent = anthropicResponse?.Content?.FirstOrDefault()?.Text
            ?? throw new Exception("No response from Anthropic API");

        var cleanJson = ExtractJson(textContent);
        var generated = JsonSerializer.Deserialize<GeneratedLevelDto>(cleanJson,
            new JsonSerializerOptions { PropertyNameCaseInsensitive = true })
            ?? throw new Exception("Failed to parse AI response");

        return generated;
    }

    public async Task<LevelResponseDto> GenerateAndSaveLevelAsync(GenerateLevelRequestDto request)
    {
        var generated = await GenerateLevelAsync(request);

        var level = new Level
        {
            Name = generated.Name,
            Difficulty = generated.Difficulty,
            Rows = generated.Rows,
            Columns = generated.Columns,
            IsValidated = false,
            IsPublished = false,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Levels.Add(level);
        await _context.SaveChangesAsync();

        foreach (var obj in generated.GameObjects)
        {
            GameObject gameObject = obj.ObjectType switch
            {
                "Key" => new Key { Color = obj.Color ?? "Red", IsCollected = false },
                "Barrier" => new Barrier { RequiredKeyColor = obj.Color ?? "Red", IsUnlocked = false },
                "Button" => new Models.Button { IsActivated = false, TargetObjectType = "Barrier" },
                "Hazard" => new Hazard { HazardType = obj.HazardType ?? "Spike" },
                "ExitDoor" => new ExitDoor { IsUnlocked = false },
                _ => new Hazard { HazardType = "Generic" }
            };

            gameObject.Level = level;
            gameObject.X = obj.PositionX;
            gameObject.Y = obj.PositionY;
            gameObject.Width = obj.Width;
            gameObject.Height = obj.Height;
            gameObject.ObjectType = obj.ObjectType;

            _context.GameObjects.Add(gameObject);
        }

        await _context.SaveChangesAsync();

        return new LevelResponseDto
        {
            Id = level.Id,
            Name = level.Name,
            Difficulty = level.Difficulty,
            Rows = level.Rows,
            Columns = level.Columns,
            IsValidated = level.IsValidated,
            IsPublished = level.IsPublished,
            CreatedAt = level.CreatedAt,
            UpdatedAt = level.UpdatedAt
        };
    }

    private static string BuildPrompt(GenerateLevelRequestDto request)
{
    var levelName = request.LevelName ?? $"AI Level - {request.Difficulty}";
    
    return "You are a puzzle platformer level designer for a game called Unlock The Room.\n" +
           "Generate a level layout based on these constraints:\n" +
           $"- Difficulty: {request.Difficulty}\n" +
           $"- Grid size: {request.Rows} rows x {request.Columns} columns\n" +
           $"- Number of color-coded keys: {request.KeyCount}\n" +
           $"- Include hazards (spikes/kill bricks): {request.IncludeHazards}\n" +
           $"- Include moving platforms: {request.IncludeMovingPlatforms}\n\n" +
           "Rules:\n" +
           "1. Each key must have a matching barrier of the same color\n" +
           "2. Keys must be reachable by the player\n" +
           "3. The exit door must only be reachable after all keys are collected\n" +
           "4. Use colors: Red, Blue, Green, Yellow, Purple for keys and their matching barriers\n" +
           "5. Position (0,0) is top-left. PositionX is column, PositionY is row\n" +
           "6. Hazards make sections more challenging but must not make keys unreachable\n" +
           "7. There must be exactly one ExitDoor\n\n" +
           "Respond with ONLY valid JSON in this exact format, no other text:\n" +
           "{\n" +
           $"  \"name\": \"{levelName}\",\n" +
           $"  \"difficulty\": \"{request.Difficulty}\",\n" +
           $"  \"rows\": {request.Rows},\n" +
           $"  \"columns\": {request.Columns},\n" +
           "  \"gameObjects\": [\n" +
           "    {\"objectType\": \"Key\", \"positionX\": 3, \"positionY\": 2, \"width\": 1, \"height\": 1, \"color\": \"Red\"},\n" +
           "    {\"objectType\": \"Barrier\", \"positionX\": 8, \"positionY\": 5, \"width\": 1, \"height\": 3, \"color\": \"Red\"},\n" +
           "    {\"objectType\": \"Button\", \"positionX\": 5, \"positionY\": 8, \"width\": 1, \"height\": 1},\n" +
           "    {\"objectType\": \"Hazard\", \"positionX\": 6, \"positionY\": 10, \"width\": 2, \"height\": 1, \"hazardType\": \"Spike\"},\n" +
           "    {\"objectType\": \"ExitDoor\", \"positionX\": 14, \"positionY\": 1, \"width\": 2, \"height\": 3}\n" +
           "  ],\n" +
           "  \"aiReasoning\": \"Brief explanation of the level design choices\"\n" +
           "}";
}

    private static string ExtractJson(string text)
    {
        var start = text.IndexOf('{');
        var end = text.LastIndexOf('}');
        if (start == -1 || end == -1)
            throw new Exception("No JSON found in AI response");
        return text[start..(end + 1)];
    }
}

public class AnthropicResponse
{
    public List<AnthropicContent>? Content { get; set; }
}

public class AnthropicContent
{
    public string? Text { get; set; }
    public string? Type { get; set; }
}