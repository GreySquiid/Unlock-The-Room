using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.Extensions.Configuration;
using UnlockTheRoom.API.DTOs;
using UnlockTheRoom.API.Services;
using UnlockTheRoom.Tests.Helpers;
using Xunit;

namespace UnlockTheRoom.Tests;

public class UserServiceTests
{
    private readonly IConfiguration _configuration;

    public UserServiceTests()
    {
        var config = new Dictionary<string, string?>
        {
            { "Jwt:Key", "TestSuperSecretKeyThatIsAtLeast32CharactersLong!" },
            { "Jwt:Issuer", "UnlockTheRoom" },
            { "Jwt:Audience", "UnlockTheRoom" }
        };
        _configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(config)
            .Build();
    }

    [Fact]
    public async Task RegisterAsync_WithValidData_ReturnsAuthResponse()
    {
        // Arrange
        var context = TestDbContextFactory.Create();
        var service = new UserService(context, _configuration);
        var dto = new RegisterDto
        {
            Username = "testuser",
            Email = "test@example.com",
            Password = "password123"
        };

        // Act
        var result = await service.RegisterAsync(dto);

        // Assert
        Assert.NotNull(result);
        Assert.NotEmpty(result.Token);
        Assert.Equal("testuser", result.User.Username);
        Assert.Equal("test@example.com", result.User.Email);
    }

    [Fact]
    public async Task RegisterAsync_WithDuplicateEmail_ReturnsNull()
    {
        // Arrange
        var context = TestDbContextFactory.Create();
        var service = new UserService(context, _configuration);
        var dto = new RegisterDto
        {
            Username = "testuser",
            Email = "test@example.com",
            Password = "password123"
        };

        // Act
        await service.RegisterAsync(dto);
        var result = await service.RegisterAsync(new RegisterDto
        {
            Username = "testuser2",
            Email = "test@example.com",
            Password = "password456"
        });

        // Assert
        Assert.Null(result);
    }

    [Fact]
    public async Task LoginAsync_WithCorrectCredentials_ReturnsAuthResponse()
    {
        // Arrange
        var context = TestDbContextFactory.Create();
        var service = new UserService(context, _configuration);
        var registerDto = new RegisterDto
        {
            Username = "testuser",
            Email = "login@example.com",
            Password = "password123"
        };
        await service.RegisterAsync(registerDto);

        var loginDto = new LoginDto
        {
            Email = "login@example.com",
            Password = "password123"
        };

        // Act
        var result = await service.LoginAsync(loginDto);

        // Assert
        Assert.NotNull(result);
        Assert.NotEmpty(result.Token);
    }

    [Fact]
    public async Task LoginAsync_WithWrongPassword_ReturnsNull()
    {
        // Arrange
        var context = TestDbContextFactory.Create();
        var service = new UserService(context, _configuration);
        await service.RegisterAsync(new RegisterDto
        {
            Username = "testuser",
            Email = "wrong@example.com",
            Password = "correctpassword"
        });

        var loginDto = new LoginDto
        {
            Email = "wrong@example.com",
            Password = "wrongpassword"
        };

        // Act
        var result = await service.LoginAsync(loginDto);

        // Assert
        Assert.Null(result);
    }

    [Fact]
    public async Task LoginAsync_WithNonExistentEmail_ReturnsNull()
    {
        // Arrange
        var context = TestDbContextFactory.Create();
        var service = new UserService(context, _configuration);

        var loginDto = new LoginDto
        {
            Email = "nobody@example.com",
            Password = "password123"
        };

        // Act
        var result = await service.LoginAsync(loginDto);

        // Assert
        Assert.Null(result);
    }

    [Fact]
    public async Task RegisterAsync_NormalizesEmailToLowercase()
    {
        // Arrange
        var context = TestDbContextFactory.Create();
        var service = new UserService(context, _configuration);
        var dto = new RegisterDto
        {
            Username = "testuser",
            Email = "TEST@EXAMPLE.COM",
            Password = "password123"
        };

        // Act
        var result = await service.RegisterAsync(dto);

        // Assert
        Assert.NotNull(result);
        Assert.Equal("test@example.com", result.User.Email);
    }

    [Fact]
    public async Task LoginAsync_WithUppercaseEmail_SucceedsAfterLowercaseRegistration()
    {
        // Arrange
        var context = TestDbContextFactory.Create();
        var service = new UserService(context, _configuration);
        await service.RegisterAsync(new RegisterDto
        {
            Username = "testuser",
            Email = "case@example.com",
            Password = "password123"
        });

        // Act - login with uppercase email
        var result = await service.LoginAsync(new LoginDto
        {
            Email = "CASE@EXAMPLE.COM",
            Password = "password123"
        });

        // Assert
        Assert.NotNull(result);
    }

    [Fact]
    public async Task DemoLoginAsync_WhenDemoUserExists_ReturnsValidJwtWithDeveloperRole()
    {
        // Arrange
        var context = TestDbContextFactory.Create();
        var service = new UserService(context, _configuration);
        await service.RegisterAsync(new RegisterDto
        {
            Username = "Demo Developer",
            Email = "demo@greysquiid.com",
            Password = "Demo@2026!"
        }, "Developer");

        // Act
        var result = await service.DemoLoginAsync();

        // Assert
        Assert.NotNull(result);
        Assert.NotEmpty(result.Token);

        var handler = new JwtSecurityTokenHandler();
        var jwt = handler.ReadJwtToken(result.Token);
        var role = jwt.Claims.FirstOrDefault(c => c.Type == ClaimTypes.Role)?.Value;
        Assert.Equal("Developer", role);
    }

    [Fact]
    public async Task DemoLoginAsync_WhenDemoUserDoesNotExist_ReturnsNull()
    {
        // Arrange - empty DB, no demo user
        var context = TestDbContextFactory.Create();
        var service = new UserService(context, _configuration);

        // Act
        var result = await service.DemoLoginAsync();

        // Assert
        Assert.Null(result);
    }
}
