using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
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
}