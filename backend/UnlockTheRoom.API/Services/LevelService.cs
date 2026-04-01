using Microsoft.EntityFrameworkCore;
using UnlockTheRoom.API.Data;
using UnlockTheRoom.API.DTOs;
using UnlockTheRoom.API.Models;

namespace UnlockTheRoom.API.Services;

public class LevelService
{
    private readonly AppDbContext _context;

    public LevelService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<LevelResponseDto>> GetAllLevelsAsync(string? search, string? difficulty)
    {
        var query = _context.Levels.AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
            query = query.Where(l => l.Name.ToLower().Contains(search.ToLower()));

        if (!string.IsNullOrWhiteSpace(difficulty))
            query = query.Where(l => l.Difficulty.ToLower() == difficulty.ToLower());

        return await query
            .OrderBy(l => l.OrderIndex)
            .ThenByDescending(l => l.CreatedAt)
            .Select(l => MapToDto(l))
            .ToListAsync();
    }

    public async Task<LevelResponseDto?> GetLevelByIdAsync(int id)
    {
        var level = await _context.Levels.FindAsync(id);
        return level == null ? null : MapToDto(level);
    }

    public async Task<LevelResponseDto> CreateLevelAsync(CreateLevelDto dto)
    {
        var maxOrder = await _context.Levels.AnyAsync()
            ? await _context.Levels.MaxAsync(l => l.OrderIndex)
            : -1;

        var level = new Level
        {
            Name = dto.Name,
            Difficulty = dto.Difficulty,
            Rows = dto.Rows,
            Columns = dto.Columns,
            OrderIndex = maxOrder + 1,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Levels.Add(level);
        await _context.SaveChangesAsync();
        return MapToDto(level);
    }

    public async Task<LevelResponseDto?> UpdateLevelAsync(int id, UpdateLevelDto dto)
    {
        var level = await _context.Levels.FindAsync(id);
        if (level == null) return null;

        level.Name = dto.Name;
        level.Difficulty = dto.Difficulty;
        level.Rows = dto.Rows;
        level.Columns = dto.Columns;
        level.IsPublished = dto.IsPublished;
        level.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return MapToDto(level);
    }

    public async Task<bool> DeleteLevelAsync(int id)
    {
        var level = await _context.Levels
            .Include(l => l.GameObjects)
            .Include(l => l.Scores)
            .Include(l => l.SavedLevels)
            .FirstOrDefaultAsync(l => l.Id == id);

        if (level == null) return false;

        _context.GameObjects.RemoveRange(level.GameObjects);
        _context.Scores.RemoveRange(level.Scores);
        _context.SavedLevels.RemoveRange(level.SavedLevels);
        _context.Levels.Remove(level);

        await _context.SaveChangesAsync();
        return true;
    }

    private static LevelResponseDto MapToDto(Level level) => new()
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
    public async Task ReorderLevelsAsync(ReorderLevelsDto dto)
    {
        for (int i = 0; i < dto.LevelIds.Count; i++)
        {
            var level = await _context.Levels.FindAsync(dto.LevelIds[i]);
            if (level != null)
            {
                level.OrderIndex = i;
                level.UpdatedAt = DateTime.UtcNow;
            }
        }
        await _context.SaveChangesAsync();
    }
    public async Task<bool> UpdateLevelObjectsAsync(int id, List<GameObjectDto> objects)
    {
        var level = await _context.Levels
            .Include(l => l.GameObjects)
            .FirstOrDefaultAsync(l => l.Id == id);

        if (level == null) return false;

        _context.GameObjects.RemoveRange(level.GameObjects);

        foreach (var obj in objects)
        {
            GameObject gameObject = obj.ObjectType switch
            {
                "Key" => new Key { Color = obj.Color ?? "Red", IsCollected = false },
                "Barrier" => new UnlockTheRoom.API.Models.Barrier { RequiredKeyColor = obj.Color ?? "Red", IsUnlocked = false },
                "Button" => new Models.Button { IsActivated = false, TargetObjectType = "Barrier" },
                "Hazard" => new Hazard { HazardType = obj.HazardType ?? "Spike" },
                "Platform" => new Hazard { HazardType = "Platform" },
                "KillBrick" => new Hazard { HazardType = "KillBrick" },
                "SpawnPoint" => new Hazard { HazardType = "SpawnPoint" },
                "ExitDoor" => new ExitDoor { IsUnlocked = false },
                _ => new Hazard { HazardType = "Generic" }
            };

            gameObject.Level = level;
            gameObject.X = obj.PositionX;
            gameObject.Y = obj.PositionY;
            gameObject.Width = obj.Width;
            gameObject.Height = obj.Height;
            gameObject.ObjectType = (obj.ObjectType == "Platform" || obj.ObjectType == "KillBrick" || obj.ObjectType == "SpawnPoint") ? "Hazard" : obj.ObjectType;
            gameObject.Rotation = obj.Rotation;

            _context.GameObjects.Add(gameObject);
        }

        level.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<LevelDetailDto?> GetLevelDetailAsync(int id)
    {
        var level = await _context.Levels
            .Include(l => l.GameObjects)
            .FirstOrDefaultAsync(l => l.Id == id);

        if (level == null) return null;

        return new LevelDetailDto
        {
            Id = level.Id,
            Name = level.Name,
            Difficulty = level.Difficulty,
            Rows = level.Rows,
            Columns = level.Columns,
            IsValidated = level.IsValidated,
            IsPublished = level.IsPublished,
            CreatedAt = level.CreatedAt,
            UpdatedAt = level.UpdatedAt,
            GameObjects = level.GameObjects.Select(g => new GameObjectDto
            {
                Id = g.Id,
                ObjectType = (g is Hazard spH && spH.HazardType == "SpawnPoint") ? "SpawnPoint" : g.ObjectType,
                PositionX = (int)g.X,
                PositionY = (int)g.Y,
                Width = (int)g.Width,
                Height = (int)g.Height,
                Color = g is Key k ? k.Color : g is Models.Barrier b ? b.RequiredKeyColor : null,
                HazardType = g is Hazard h ? h.HazardType : null,
                Rotation = g.Rotation
            }).ToList()
        };
    }
}