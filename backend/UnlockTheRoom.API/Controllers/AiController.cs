using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using UnlockTheRoom.API.DTOs;
using UnlockTheRoom.API.Services;

namespace UnlockTheRoom.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AiController : ControllerBase
{
    private readonly AiService _aiService;

    public AiController(AiService aiService)
    {
        _aiService = aiService;
    }

    [HttpPost("generate-preview")]
    [EnableRateLimiting("ai-generate")]
    public async Task<IActionResult> GeneratePreview([FromBody] GenerateLevelRequestDto request)
    {
        try
        {
            var generated = await _aiService.GenerateLevelAsync(request);
            return Ok(generated);
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"AI generation failed: {ex.Message}");
        }
    }

    [HttpPost("generate-and-save")]
    [EnableRateLimiting("ai-generate")]
    public async Task<IActionResult> GenerateAndSave([FromBody] GenerateLevelRequestDto request)
    {
        try
        {
            var level = await _aiService.GenerateAndSaveLevelAsync(request);
            return CreatedAtAction("GetById", "Levels", new { id = level.Id }, level);
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"AI generation failed: {ex.Message}");
        }
    }
    [HttpPost("save-preview")]
    [Authorize]
    public async Task<IActionResult> SavePreview([FromBody] GeneratedLevelDto preview)
    {
        try
        {
            var level = await _aiService.SaveGeneratedLevelAsync(preview);
            return CreatedAtAction("GetById", "Levels", new { id = level.Id }, level);
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Failed to save level: {ex.Message}");
        }
    }
}