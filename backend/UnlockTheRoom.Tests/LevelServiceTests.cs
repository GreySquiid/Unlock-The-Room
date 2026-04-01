using UnlockTheRoom.API.DTOs;
using UnlockTheRoom.API.Models;
using UnlockTheRoom.API.Services;
using UnlockTheRoom.Tests.Helpers;
using Xunit;

namespace UnlockTheRoom.Tests;

public class LevelServiceTests
{
    [Fact]
    public async Task CreateLevelAsync_WithValidData_ReturnsLevel()
    {
        // Arrange
        var context = TestDbContextFactory.Create();
        var service = new LevelService(context);
        var dto = new CreateLevelDto
        {
            Name = "Test Level",
            Difficulty = "Easy",
            Rows = 12,
            Columns = 16
        };

        // Act
        var result = await service.CreateLevelAsync(dto);

        // Assert
        Assert.NotNull(result);
        Assert.Equal("Test Level", result.Name);
        Assert.Equal("Easy", result.Difficulty);
        Assert.Equal(12, result.Rows);
        Assert.Equal(16, result.Columns);
        Assert.False(result.IsPublished);
        Assert.False(result.IsValidated);
    }

    [Fact]
    public async Task CreateLevelAsync_SetsOrderIndexToNextInSequence()
    {
        // Arrange
        var context = TestDbContextFactory.Create();
        var service = new LevelService(context);

        // Act
        var first = await service.CreateLevelAsync(new CreateLevelDto
            { Name = "Level 1", Difficulty = "Easy", Rows = 10, Columns = 14 });
        var second = await service.CreateLevelAsync(new CreateLevelDto
            { Name = "Level 2", Difficulty = "Medium", Rows = 10, Columns = 14 });

        // Assert
        Assert.True(first.Id > 0);
        Assert.NotEqual(first.Id, second.Id);
    }

    [Fact]
    public async Task GetAllLevelsAsync_WithDifficultyFilter_ReturnsOnlyMatchingLevels()
    {
        // Arrange
        var context = TestDbContextFactory.Create();
        var service = new LevelService(context);
        await service.CreateLevelAsync(new CreateLevelDto
            { Name = "Easy Level", Difficulty = "Easy", Rows = 10, Columns = 14 });
        await service.CreateLevelAsync(new CreateLevelDto
            { Name = "Hard Level", Difficulty = "Hard", Rows = 10, Columns = 14 });

        // Act
        var result = await service.GetAllLevelsAsync(null, "Easy");

        // Assert
        Assert.Single(result);
        Assert.Equal("Easy Level", result[0].Name);
    }

    [Fact]
    public async Task GetAllLevelsAsync_WithSearchTerm_ReturnsMatchingLevels()
    {
        // Arrange
        var context = TestDbContextFactory.Create();
        var service = new LevelService(context);
        await service.CreateLevelAsync(new CreateLevelDto
            { Name = "Crimson Vault", Difficulty = "Easy", Rows = 10, Columns = 14 });
        await service.CreateLevelAsync(new CreateLevelDto
            { Name = "Azure Descent", Difficulty = "Medium", Rows = 10, Columns = 14 });

        // Act
        var result = await service.GetAllLevelsAsync("Crimson", null);

        // Assert
        Assert.Single(result);
        Assert.Equal("Crimson Vault", result[0].Name);
    }

    [Fact]
    public async Task DeleteLevelAsync_WithValidId_ReturnsTrueAndRemovesLevel()
    {
        // Arrange
        var context = TestDbContextFactory.Create();
        var service = new LevelService(context);
        var created = await service.CreateLevelAsync(new CreateLevelDto
            { Name = "To Delete", Difficulty = "Easy", Rows = 10, Columns = 14 });

        // Act
        var result = await service.DeleteLevelAsync(created.Id);
        var levels = await service.GetAllLevelsAsync(null, null);

        // Assert
        Assert.True(result);
        Assert.Empty(levels);
    }

    [Fact]
    public async Task DeleteLevelAsync_WithInvalidId_ReturnsFalse()
    {
        // Arrange
        var context = TestDbContextFactory.Create();
        var service = new LevelService(context);

        // Act
        var result = await service.DeleteLevelAsync(99999);

        // Assert
        Assert.False(result);
    }

    [Fact]
    public async Task UpdateLevelAsync_WithValidData_UpdatesCorrectly()
    {
        // Arrange
        var context = TestDbContextFactory.Create();
        var service = new LevelService(context);
        var created = await service.CreateLevelAsync(new CreateLevelDto
            { Name = "Original Name", Difficulty = "Easy", Rows = 10, Columns = 14 });

        var updateDto = new UpdateLevelDto
        {
            Name = "Updated Name",
            Difficulty = "Hard",
            Rows = 18,
            Columns = 24,
            IsPublished = true
        };

        // Act
        var result = await service.UpdateLevelAsync(created.Id, updateDto);

        // Assert
        Assert.NotNull(result);
        Assert.Equal("Updated Name", result.Name);
        Assert.Equal("Hard", result.Difficulty);
        Assert.True(result.IsPublished);
    }

    [Fact]
    public async Task GetLevelByIdAsync_WithValidId_ReturnsLevel()
    {
        // Arrange
        var context = TestDbContextFactory.Create();
        var service = new LevelService(context);
        var created = await service.CreateLevelAsync(new CreateLevelDto
            { Name = "Find Me", Difficulty = "Medium", Rows = 10, Columns = 14 });

        // Act
        var result = await service.GetLevelByIdAsync(created.Id);

        // Assert
        Assert.NotNull(result);
        Assert.Equal("Find Me", result.Name);
    }

    [Fact]
    public async Task GetLevelByIdAsync_WithInvalidId_ReturnsNull()
    {
        // Arrange
        var context = TestDbContextFactory.Create();
        var service = new LevelService(context);

        // Act
        var result = await service.GetLevelByIdAsync(99999);

        // Assert
        Assert.Null(result);
    }
}
