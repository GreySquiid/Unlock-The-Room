using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using UnlockTheRoom.API.Services;

namespace UnlockTheRoom.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class SavedLevelsController : ControllerBase
{
    private readonly SavedLevelService _savedLevelService;

    public SavedLevelsController(SavedLevelService savedLevelService)
    {
        _savedLevelService = savedLevelService;
    }

    [HttpGet]
    public async Task<IActionResult> GetSavedLevels()
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var saved = await _savedLevelService.GetSavedLevelsAsync(userId);
        return Ok(saved);
    }

    [HttpPost("{levelId}")]
    public async Task<IActionResult> SaveLevel(int levelId)
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var result = await _savedLevelService.SaveLevelAsync(userId, levelId);
        if (result == null)
            return Conflict("Level is already saved or does not exist.");
        return CreatedAtAction(nameof(GetSavedLevels), result);
    }

    [HttpDelete("{levelId}")]
    public async Task<IActionResult> UnsaveLevel(int levelId)
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var success = await _savedLevelService.UnsaveLevelAsync(userId, levelId);
        return success ? NoContent() : NotFound();
    }
}