using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using UnlockTheRoom.API.DTOs;
using UnlockTheRoom.API.Services;

namespace UnlockTheRoom.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UsersController : ControllerBase
{
    private readonly UserService _userService;

    public UsersController(UserService userService)
    {
        _userService = userService;
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