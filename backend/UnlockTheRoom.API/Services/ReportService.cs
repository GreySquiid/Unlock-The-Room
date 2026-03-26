using Microsoft.EntityFrameworkCore;
using UnlockTheRoom.API.Data;
using UnlockTheRoom.API.DTOs;

namespace UnlockTheRoom.API.Services;

public class ReportService
{
    private readonly AppDbContext _context;

    public ReportService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<LevelReportDto> GenerateLevelReportAsync(ReportQueryDto query)
    {
        var levelQuery = _context.Levels
            .Include(l => l.GameObjects)
            .Include(l => l.Scores)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(query.Difficulty))
            levelQuery = levelQuery.Where(l => l.Difficulty.ToLower() == query.Difficulty.ToLower());

        if (query.IsPublished.HasValue)
            levelQuery = levelQuery.Where(l => l.IsPublished == query.IsPublished.Value);

        if (query.FromDate.HasValue)
            levelQuery = levelQuery.Where(l => l.CreatedAt >= query.FromDate.Value);

        if (query.ToDate.HasValue)
            levelQuery = levelQuery.Where(l => l.CreatedAt <= query.ToDate.Value);

        var levels = await levelQuery.OrderByDescending(l => l.CreatedAt).ToListAsync();
        var allLevels = await _context.Levels.ToListAsync();

        return new LevelReportDto
        {
            ReportTitle = "Level Inventory Report",
            GeneratedAt = DateTime.UtcNow,
            TotalLevels = levels.Count,
            PublishedCount = levels.Count(l => l.IsPublished),
            ValidatedCount = levels.Count(l => l.IsValidated),
            EasyCount = allLevels.Count(l => l.Difficulty.ToLower() == "easy"),
            MediumCount = allLevels.Count(l => l.Difficulty.ToLower() == "medium"),
            HardCount = allLevels.Count(l => l.Difficulty.ToLower() == "hard"),
            Levels = levels.Select(l => new LevelReportItemDto
            {
                Id = l.Id,
                Name = l.Name,
                Difficulty = l.Difficulty,
                Rows = l.Rows,
                Columns = l.Columns,
                IsValidated = l.IsValidated,
                IsPublished = l.IsPublished,
                GameObjectCount = l.GameObjects?.Count ?? 0,
                ScoreCount = l.Scores?.Count ?? 0,
                CreatedAt = l.CreatedAt,
                UpdatedAt = l.UpdatedAt
            }).ToList()
        };
    }
}