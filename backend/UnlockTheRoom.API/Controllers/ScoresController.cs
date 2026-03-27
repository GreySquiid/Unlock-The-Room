using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using UnlockTheRoom.API.DTOs;
using UnlockTheRoom.API.Services;

namespace UnlockTheRoom.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ScoresController : ControllerBase
{
    private readonly ScoreService _scoreService;

    public ScoresController(ScoreService scoreService)
    {
        _scoreService = scoreService;
    }

    [HttpGet("leaderboard")]
    public async Task<IActionResult> GetLeaderboard(
        [FromQuery] int? levelId,
        [FromQuery] int take = 10)
    {
        var scores = await _scoreService.GetLeaderboardAsync(levelId, take);
        return Ok(scores);
    }

    [HttpGet("mine")]
    [Authorize]
    public async Task<IActionResult> GetMyScores()
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var scores = await _scoreService.GetUserScoresAsync(userId);
        return Ok(scores);
    }

    [HttpPost]
    [Authorize]
    public async Task<IActionResult> SubmitScore([FromBody] CreateScoreDto dto)
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var score = await _scoreService.SubmitScoreAsync(userId, dto);
        return CreatedAtAction(nameof(GetLeaderboard), score);
    }

    [HttpDelete("{id}")]
    [Authorize]
    public async Task<IActionResult> DeleteScore(int id)
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var success = await _scoreService.DeleteScoreAsync(id, userId);
        return success ? NoContent() : NotFound();
    }
}