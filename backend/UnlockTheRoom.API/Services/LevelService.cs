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
            .OrderByDescending(l => l.CreatedAt)
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
        var level = new Level
        {
            Name = dto.Name,
            Difficulty = dto.Difficulty,
            Rows = dto.Rows,
            Columns = dto.Columns,
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
        var level = await _context.Levels.FindAsync(id);
        if (level == null) return false;

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
}