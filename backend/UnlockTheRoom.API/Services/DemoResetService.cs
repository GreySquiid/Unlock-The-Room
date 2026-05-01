using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using UnlockTheRoom.API.Data;
using UnlockTheRoom.API.Models;
using Barrier = UnlockTheRoom.API.Models.Barrier;

namespace UnlockTheRoom.API.Services;

public class DemoResetService : BackgroundService
{
    public static DateTime? LastResetUtc { get; private set; }

    private readonly IServiceScopeFactory _scopeFactory;
    private readonly IConfiguration _configuration;
    private readonly ILogger<DemoResetService> _logger;

    public DemoResetService(
        IServiceScopeFactory scopeFactory,
        IConfiguration configuration,
        ILogger<DemoResetService> logger)
    {
        _scopeFactory = scopeFactory;
        _configuration = configuration;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        // Brief startup delay lets migrations and seeding finish first.
        await Task.Delay(TimeSpan.FromSeconds(10), stoppingToken);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await PerformResetAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Demo data reset failed");
            }

            var intervalHours = _configuration.GetValue<int>("DemoReset:IntervalHours", 24);
            await Task.Delay(TimeSpan.FromHours(intervalHours), stoppingToken);
        }
    }

    private async Task PerformResetAsync()
    {
        var canonical = LoadCanonicalLevels();
        if (canonical == null || canonical.Count == 0)
        {
            _logger.LogWarning("Demo reset: canonical-levels.json not found or empty, skipping.");
            return;
        }

        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var canonicalNames = canonical.Select(l => l.Name).ToHashSet();

        // Delete visitor-created levels (cascades to GameObjects and Scores).
        var toDelete = await db.Levels
            .Where(l => !canonicalNames.Contains(l.Name))
            .ToListAsync();

        db.Levels.RemoveRange(toDelete);
        await db.SaveChangesAsync();

        int deleted = toDelete.Count;
        int restored = 0;

        foreach (var spec in canonical)
        {
            var existing = await db.Levels
                .Include(l => l.GameObjects)
                .FirstOrDefaultAsync(l => l.Name == spec.Name);

            if (existing != null)
            {
                // Restore level fields.
                existing.Difficulty  = spec.Difficulty;
                existing.Rows        = spec.Rows;
                existing.Columns     = spec.Columns;
                existing.OrderIndex  = spec.OrderIndex;
                existing.IsPublished = spec.IsPublished;
                existing.IsValidated = spec.IsValidated;
                existing.UpdatedAt   = DateTime.UtcNow;

                // Replace game objects.
                db.GameObjects.RemoveRange(existing.GameObjects);
                await db.SaveChangesAsync();

                foreach (var obj in spec.GameObjects)
                    db.GameObjects.Add(BuildGameObject(obj, existing));

                restored++;
            }
            else
            {
                var level = new Level
                {
                    Name        = spec.Name,
                    Difficulty  = spec.Difficulty,
                    Rows        = spec.Rows,
                    Columns     = spec.Columns,
                    OrderIndex  = spec.OrderIndex,
                    IsPublished = spec.IsPublished,
                    IsValidated = spec.IsValidated,
                    CreatedAt   = DateTime.UtcNow,
                    UpdatedAt   = DateTime.UtcNow
                };
                db.Levels.Add(level);
                await db.SaveChangesAsync();

                foreach (var obj in spec.GameObjects)
                    db.GameObjects.Add(BuildGameObject(obj, level));

                restored++;
            }

            await db.SaveChangesAsync();
        }

        LastResetUtc = DateTime.UtcNow;

        _logger.LogInformation(
            "Demo reset complete — deleted {Deleted} visitor levels, restored {Restored} canonical levels at {Time}",
            deleted, restored, DateTime.UtcNow);
    }

    private static GameObject BuildGameObject(CanonicalGameObject obj, Level level)
    {
        GameObject go = obj.ObjectType switch
        {
            "Key"      => new Key      { Color = obj.Color ?? "White", IsCollected = false },
            "Barrier"  => new Barrier  { RequiredKeyColor = obj.RequiredKeyColor ?? "White", IsUnlocked = false },
            "ExitDoor" => new ExitDoor { IsUnlocked = false },
            _          => new Hazard   { HazardType = obj.HazardType ?? "Platform" }
        };

        go.Level      = level;
        go.X          = obj.X;
        go.Y          = obj.Y;
        go.Width      = obj.Width;
        go.Height     = obj.Height;
        go.ObjectType = obj.ObjectType;
        go.Rotation   = obj.Rotation;

        return go;
    }

    // ── Canonical data loading ────────────────────────────────────────────────

    private List<CanonicalLevel>? LoadCanonicalLevels()
    {
        var path = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "SeedData", "canonical-levels.json");
        if (!File.Exists(path))
        {
            _logger.LogWarning("Demo reset: canonical file not found at {Path}", path);
            return null;
        }

        var json = File.ReadAllText(path);
        var root = JsonSerializer.Deserialize<CanonicalRoot>(json,
            new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
        return root?.Levels;
    }

    // ── Local DTO types ───────────────────────────────────────────────────────

    private record CanonicalRoot(List<CanonicalLevel> Levels);

    private record CanonicalLevel(
        string Name,
        string Difficulty,
        int Rows,
        int Columns,
        int OrderIndex,
        bool IsPublished,
        bool IsValidated,
        List<CanonicalGameObject> GameObjects);

    private record CanonicalGameObject(
        string ObjectType,
        float X,
        float Y,
        float Width,
        float Height,
        string? RequiredKeyColor,
        string? HazardType,
        string? Color,
        int Rotation);
}
