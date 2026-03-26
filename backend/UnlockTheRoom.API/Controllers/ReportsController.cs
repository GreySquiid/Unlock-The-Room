using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using UnlockTheRoom.API.DTOs;
using UnlockTheRoom.API.Services;

namespace UnlockTheRoom.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ReportsController : ControllerBase
{
    private readonly ReportService _reportService;

    public ReportsController(ReportService reportService)
    {
        _reportService = reportService;
    }

    [HttpGet("levels")]
    public async Task<IActionResult> GetLevelReport(
        [FromQuery] string? difficulty,
        [FromQuery] bool? isPublished,
        [FromQuery] DateTime? fromDate,
        [FromQuery] DateTime? toDate)
    {
        var query = new ReportQueryDto
        {
            Difficulty = difficulty,
            IsPublished = isPublished,
            FromDate = fromDate,
            ToDate = toDate
        };

        var report = await _reportService.GenerateLevelReportAsync(query);
        return Ok(report);
    }
}