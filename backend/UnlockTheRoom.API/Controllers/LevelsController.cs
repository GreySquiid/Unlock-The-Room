using Microsoft.AspNetCore.Mvc;
using UnlockTheRoom.API.DTOs;
using UnlockTheRoom.API.Services;
using Microsoft.AspNetCore.Authorization;

namespace UnlockTheRoom.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class LevelsController : ControllerBase
{
    private readonly LevelService _levelService;

    public LevelsController(LevelService levelService)
    {
        _levelService = levelService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] string? search,
        [FromQuery] string? difficulty)
    {
        var levels = await _levelService.GetAllLevelsAsync(search, difficulty);
        return Ok(levels);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var level = await _levelService.GetLevelByIdAsync(id);
        return level == null ? NotFound() : Ok(level);
    }

    [HttpPost]
    [Authorize(Roles = "Developer")]
    public async Task<IActionResult> Create([FromBody] CreateLevelDto dto)
    {
        var level = await _levelService.CreateLevelAsync(dto);
        return CreatedAtAction(nameof(GetById), new { id = level.Id }, level);
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = "Developer")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateLevelDto dto)
    {
        var level = await _levelService.UpdateLevelAsync(id, dto);
        return level == null ? NotFound() : Ok(level);
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = "Developer")]

    public async Task<IActionResult> Delete(int id)
    {
        var success = await _levelService.DeleteLevelAsync(id);
        return success ? NoContent() : NotFound();
    }
    [HttpPut("reorder")]
    [Authorize(Roles = "Developer")]
    public async Task<IActionResult> Reorder([FromBody] ReorderLevelsDto dto)
    {
        await _levelService.ReorderLevelsAsync(dto);
        return NoContent();
    }
    [HttpGet("{id:int}/detail")]
    public async Task<IActionResult> GetDetail(int id)
    {
        var level = await _levelService.GetLevelDetailAsync(id);
        return level == null ? NotFound() : Ok(level);
    }

    [HttpPut("{id:int}/objects")]
    [Authorize(Roles = "Developer")]
    public async Task<IActionResult> UpdateObjects(int id, [FromBody] List<GameObjectDto> objects)
    {
        var success = await _levelService.UpdateLevelObjectsAsync(id, objects);
        return success ? NoContent() : NotFound();
    }
}