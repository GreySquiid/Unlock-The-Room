using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using UnlockTheRoom.API.Data;
using UnlockTheRoom.API.DTOs;
using UnlockTheRoom.API.Models;

namespace UnlockTheRoom.API.Services;

public class UserService
{
    private readonly AppDbContext _context;
    private readonly IConfiguration _configuration;

    public UserService(AppDbContext context, IConfiguration configuration)
    {
        _context = context;
        _configuration = configuration;
    }

    public async Task<AuthResponseDto?> RegisterAsync(RegisterDto dto, string role = "Player")
    {
        if (await _context.Users.AnyAsync(u => u.Email == dto.Email))
            return null;

        var user = new User
        {
            Username = dto.Username,
            Email = dto.Email.ToLower().Trim(),
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
            Role = role,
            CreatedAt = DateTime.UtcNow
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        return new AuthResponseDto
        {
            Token = GenerateToken(user),
            User = MapToDto(user)
        };
    }

    public async Task<AuthResponseDto?> LoginAsync(LoginDto dto)
    {
        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Email == dto.Email.ToLower().Trim());;

        if (user == null || !BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash))
            return null;

        return new AuthResponseDto
        {
            Token = GenerateToken(user),
            User = MapToDto(user)
        };
    }

    public async Task<List<UserResponseDto>> GetAllUsersAsync()
    {
        return await _context.Users
            .OrderByDescending(u => u.CreatedAt)
            .Select(u => MapToDto(u))
            .ToListAsync();
    }

    public async Task<UserResponseDto?> GetUserByIdAsync(int id)
    {
        var user = await _context.Users.FindAsync(id);
        return user == null ? null : MapToDto(user);
    }

    public async Task<UserResponseDto?> UpdateUserAsync(int id, UpdateUserDto dto)
    {
        var user = await _context.Users.FindAsync(id);
        if (user == null) return null;

        user.Username = dto.Username;
        user.Email = dto.Email;

        await _context.SaveChangesAsync();
        return MapToDto(user);
    }

    public async Task<AuthResponseDto?> DemoLoginAsync()
    {
        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Email == "demo@greysquiid.com");

        if (user == null) return null;

        return new AuthResponseDto
        {
            Token = GenerateToken(user),
            User = MapToDto(user)
        };
    }

    public async Task<bool> DeleteUserAsync(int id)
    {
        var user = await _context.Users.FindAsync(id);
        if (user == null) return false;

        _context.Users.Remove(user);
        await _context.SaveChangesAsync();
        return true;
    }

    private string GenerateToken(User user)
    {
        var key = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(_configuration["Jwt:Key"]!));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim(ClaimTypes.Role, user.Role),
            new Claim(ClaimTypes.Name, user.Username)
        };

        var token = new JwtSecurityToken(
            issuer: _configuration["Jwt:Issuer"],
            audience: _configuration["Jwt:Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddDays(7),
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private static UserResponseDto MapToDto(User user) => new()
    {
        Id = user.Id,
        Username = user.Username,
        Email = user.Email,
        Role = user.Role,
        CreatedAt = user.CreatedAt
    };
}