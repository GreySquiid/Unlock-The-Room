using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using UnlockTheRoom.API.Data;
using UnlockTheRoom.API.DTOs;
using UnlockTheRoom.API.Models;

namespace UnlockTheRoom.API.Services;

public class ScoreService
{
    private readonly AppDbContext _context;

    public ScoreService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<ScoreResponseDto>> GetLeaderboardAsync(int? levelId, int take = 10)
    {
        var query = _context.Scores
            .Include(s => s.User)
            .Include(s => s.Level)
            .AsQueryable();

        if (levelId.HasValue)
            query = query.Where(s => s.LevelId == levelId.Value);

        return await query
            .OrderBy(s => s.CompletionTimeSeconds)
            .Take(take)
            .Select(s => MapToDto(s))
            .ToListAsync();
    }

    public async Task<List<ScoreResponseDto>> GetUserScoresAsync(int userId)
    {
        return await _context.Scores
            .Include(s => s.User)
            .Include(s => s.Level)
            .Where(s => s.UserId == userId)
            .OrderByDescending(s => s.AchievedAt)
            .Select(s => MapToDto(s))
            .ToListAsync();
    }

    public async Task<ScoreResponseDto> SubmitScoreAsync(int userId, CreateScoreDto dto)
    {
        var score = new Score
        {
            UserId = userId,
            LevelId = dto.LevelId,
            CompletionTimeSeconds = dto.CompletionTimeSeconds,
            AchievedAt = DateTime.UtcNow
        };

        _context.Scores.Add(score);
        await _context.SaveChangesAsync();

        await _context.Entry(score).Reference(s => s.User).LoadAsync();
        await _context.Entry(score).Reference(s => s.Level).LoadAsync();

        return MapToDto(score);
    }

    public async Task<bool> DeleteScoreAsync(int scoreId, int userId)
    {
        var score = await _context.Scores
            .FirstOrDefaultAsync(s => s.Id == scoreId && s.UserId == userId);
        if (score == null) return false;

        _context.Scores.Remove(score);
        await _context.SaveChangesAsync();
        return true;
    }

    private static ScoreResponseDto MapToDto(Score score) => new()
    {
        Id = score.Id,
        UserId = score.UserId,
        Username = score.User?.Username ?? string.Empty,
        LevelId = score.LevelId,
        LevelName = score.Level?.Name ?? string.Empty,
        CompletionTimeSeconds = score.CompletionTimeSeconds,
        FormattedTime = FormatTime(score.CompletionTimeSeconds),
        AchievedAt = score.AchievedAt
    };

    private static string FormatTime(int seconds)
    {
        var minutes = seconds / 60;
        var secs = seconds % 60;
        return $"{minutes:D2}:{secs:D2}";
    }
}