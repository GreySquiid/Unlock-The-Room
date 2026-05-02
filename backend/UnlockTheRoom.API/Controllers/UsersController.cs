using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using UnlockTheRoom.API.DTOs;
using UnlockTheRoom.API.Services;
using System.Security.Claims;

namespace UnlockTheRoom.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UsersController : ControllerBase
{
    private readonly UserService _userService;
    private readonly IConfiguration _configuration;

    public UsersController(UserService userService, IConfiguration configuration)
    {
        _userService = userService;
        _configuration = configuration;
    }

    [HttpGet("demo-reset-status")]
    [Authorize]
    public IActionResult DemoResetStatus()
    {
        var email = User.FindFirstValue(ClaimTypes.Email);
        var demoEmail = _configuration.GetValue<string>("Features:DemoEmail") ?? "demo@greysquiid.com";
        if (email != demoEmail) return Forbid();

        var last = DemoResetService.LastResetUtc;
        return Ok(new { lastResetUtc = last?.ToString("o") });
    }

    [HttpPost("demo-login")]
    [EnableRateLimiting("demo-login")]
    public async Task<IActionResult> DemoLogin()
    {
        var enabled = _configuration.GetValue<bool>("Features:DemoLogin");
        if (!enabled) return NotFound();

        var result = await _userService.DemoLoginAsync();
        if (result == null) return NotFound();

        return Ok(result);
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterDto dto)
    {
        var result = await _userService.RegisterAsync(dto);
        if (result == null)
            return Conflict("A user with that email already exists.");
        return CreatedAtAction(nameof(GetById), new { id = result.User.Id }, result);
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginDto dto)
    {
        var result = await _userService.LoginAsync(dto);
        if (result == null)
            return Unauthorized("Invalid email or password.");
        return Ok(result);
    }

    [HttpGet]
    [Authorize(Roles = "Developer")]
    public async Task<IActionResult> GetAll()
    {
        var users = await _userService.GetAllUsersAsync();
        return Ok(users);
    }

    [HttpGet("{id}")]
    [Authorize]
    public async Task<IActionResult> GetById(int id)
    {
        var user = await _userService.GetUserByIdAsync(id);
        return user == null ? NotFound() : Ok(user);
    }

    [HttpPut("{id}")]
    [Authorize]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateUserDto dto)
    {
        var user = await _userService.UpdateUserAsync(id, dto);
        return user == null ? NotFound() : Ok(user);
    }

    [HttpDelete("{id}")]
    [Authorize]
    public async Task<IActionResult> Delete(int id)
    {
        var success = await _userService.DeleteUserAsync(id);
        return success ? NoContent() : NotFound();
    }
}