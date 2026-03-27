using Microsoft.EntityFrameworkCore;
using UnlockTheRoom.API.Data;
using UnlockTheRoom.API.DTOs;
using UnlockTheRoom.API.Models;

namespace UnlockTheRoom.API.Services;

public class SavedLevelService
{
    private readonly AppDbContext _context;

    public SavedLevelService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<SavedLevelResponseDto>> GetSavedLevelsAsync(int userId)
    {
        return await _context.SavedLevels
            .Include(sl => sl.Level)
            .Where(sl => sl.UserId == userId)
            .OrderByDescending(sl => sl.SavedAt)
            .Select(sl => MapToDto(sl))
            .ToListAsync();
    }

    public async Task<SavedLevelResponseDto?> SaveLevelAsync(int userId, int levelId)
    {
        var exists = await _context.SavedLevels
            .AnyAsync(sl => sl.UserId == userId && sl.LevelId == levelId);
        if (exists) return null;

        var level = await _context.Levels.FindAsync(levelId);
        if (level == null) return null;

        var savedLevel = new SavedLevel
        {
            UserId = userId,
            LevelId = levelId,
            SavedAt = DateTime.UtcNow
        };

        _context.SavedLevels.Add(savedLevel);
        await _context.SaveChangesAsync();

        savedLevel.Level = level;
        return MapToDto(savedLevel);
    }

    public async Task<bool> UnsaveLevelAsync(int userId, int levelId)
    {
        var savedLevel = await _context.SavedLevels
            .FirstOrDefaultAsync(sl => sl.UserId == userId && sl.LevelId == levelId);
        if (savedLevel == null) return false;

        _context.SavedLevels.Remove(savedLevel);
        await _context.SaveChangesAsync();
        return true;
    }

    private static SavedLevelResponseDto MapToDto(SavedLevel sl) => new()
    {
        Id = sl.Id,
        UserId = sl.UserId,
        LevelId = sl.LevelId,
        LevelName = sl.Level?.Name ?? string.Empty,
        Difficulty = sl.Level?.Difficulty ?? string.Empty,
        Rows = sl.Level?.Rows ?? 0,
        Columns = sl.Level?.Columns ?? 0,
        SavedAt = sl.SavedAt
    };
}