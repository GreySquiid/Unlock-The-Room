using UnlockTheRoom.API.Data;
using UnlockTheRoom.API.DTOs;
using UnlockTheRoom.API.Models;
using UnlockTheRoom.API.Services;
using UnlockTheRoom.Tests.Helpers;
using Xunit;

namespace UnlockTheRoom.Tests;

public class ScoreServiceTests
{
    private async Task<(AppDbContext context, int userId, int levelId)> SetupAsync()
    {
        var context = TestDbContextFactory.Create();

        var user = new User
        {
            Username = "testplayer",
            Email = "player@example.com",
            PasswordHash = "hash",
            Role = "Player",
            CreatedAt = DateTime.UtcNow
        };
        context.Users.Add(user);

        var level = new Level
        {
            Name = "Test Level",
            Difficulty = "Easy",
            Rows = 10,
            Columns = 14,
            IsPublished = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        context.Levels.Add(level);
        await context.SaveChangesAsync();

        return (context, user.Id, level.Id);
    }

    [Fact]
    public async Task SubmitScoreAsync_WithValidData_ReturnsScore()
    {
        // Arrange
        var (context, userId, levelId) = await SetupAsync();
        var service = new ScoreService(context);
        var dto = new CreateScoreDto
        {
            LevelId = levelId,
            CompletionTimeSeconds = 95
        };

        // Act
        var result = await service.SubmitScoreAsync(userId, dto);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(userId, result.UserId);
        Assert.Equal(levelId, result.LevelId);
        Assert.Equal(95, result.CompletionTimeSeconds);
        Assert.Equal("01:35", result.FormattedTime);
    }

    [Fact]
    public async Task GetLeaderboardAsync_ReturnsScoresOrderedByTime()
    {
        // Arrange
        var (context, userId, levelId) = await SetupAsync();
        var service = new ScoreService(context);

        await service.SubmitScoreAsync(userId, new CreateScoreDto
            { LevelId = levelId, CompletionTimeSeconds = 120 });
        await service.SubmitScoreAsync(userId, new CreateScoreDto
            { LevelId = levelId, CompletionTimeSeconds = 45 });
        await service.SubmitScoreAsync(userId, new CreateScoreDto
            { LevelId = levelId, CompletionTimeSeconds = 80 });

        // Act
        var result = await service.GetLeaderboardAsync(null, 10);

        // Assert
        Assert.Equal(3, result.Count);
        Assert.Equal(45, result[0].CompletionTimeSeconds);
        Assert.Equal(80, result[1].CompletionTimeSeconds);
        Assert.Equal(120, result[2].CompletionTimeSeconds);
    }

    [Fact]
    public async Task GetLeaderboardAsync_FilteredByLevel_ReturnsOnlyThatLevel()
    {
        // Arrange
        var (context, userId, levelId) = await SetupAsync();

        var level2 = new Level
        {
            Name = "Level 2", Difficulty = "Hard",
            Rows = 10, Columns = 14,
            IsPublished = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        context.Levels.Add(level2);
        await context.SaveChangesAsync();

        var service = new ScoreService(context);
        await service.SubmitScoreAsync(userId, new CreateScoreDto
            { LevelId = levelId, CompletionTimeSeconds = 60 });
        await service.SubmitScoreAsync(userId, new CreateScoreDto
            { LevelId = level2.Id, CompletionTimeSeconds = 30 });

        // Act
        var result = await service.GetLeaderboardAsync(levelId, 10);

        // Assert
        Assert.Single(result);
        Assert.Equal(levelId, result[0].LevelId);
    }

    [Fact]
    public async Task GetUserScoresAsync_ReturnsOnlyThatUsersScores()
    {
        // Arrange
        var (context, userId, levelId) = await SetupAsync();

        var user2 = new User
        {
            Username = "player2", Email = "p2@example.com",
            PasswordHash = "hash", Role = "Player",
            CreatedAt = DateTime.UtcNow
        };
        context.Users.Add(user2);
        await context.SaveChangesAsync();

        var service = new ScoreService(context);
        await service.SubmitScoreAsync(userId, new CreateScoreDto
            { LevelId = levelId, CompletionTimeSeconds = 60 });
        await service.SubmitScoreAsync(user2.Id, new CreateScoreDto
            { LevelId = levelId, CompletionTimeSeconds = 45 });

        // Act
        var result = await service.GetUserScoresAsync(userId);

        // Assert
        Assert.Single(result);
        Assert.Equal(userId, result[0].UserId);
    }

    [Fact]
    public async Task DeleteScoreAsync_WithValidUserAndScore_ReturnsTrueAndRemoves()
    {
        // Arrange
        var (context, userId, levelId) = await SetupAsync();
        var service = new ScoreService(context);
        var score = await service.SubmitScoreAsync(userId, new CreateScoreDto
            { LevelId = levelId, CompletionTimeSeconds = 60 });

        // Act
        var result = await service.DeleteScoreAsync(score.Id, userId);
        var scores = await service.GetUserScoresAsync(userId);

        // Assert
        Assert.True(result);
        Assert.Empty(scores);
    }

    [Fact]
    public async Task DeleteScoreAsync_WithWrongUserId_ReturnsFalse()
    {
        // Arrange
        var (context, userId, levelId) = await SetupAsync();
        var service = new ScoreService(context);
        var score = await service.SubmitScoreAsync(userId, new CreateScoreDto
            { LevelId = levelId, CompletionTimeSeconds = 60 });

        // Act
        var result = await service.DeleteScoreAsync(score.Id, 99999);

        // Assert
        Assert.False(result);
    }
}
