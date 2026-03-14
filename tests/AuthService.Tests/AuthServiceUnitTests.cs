using GoldPC.AuthService.Data;
using GoldPC.AuthService.Entities;
using GoldPC.AuthService.Services;
using GoldPC.SharedKernel.Enums;
using Microsoft.EntityFrameworkCore;
using Moq;
using FluentAssertions;
using Xunit;

namespace GoldPC.AuthService.Tests;

public class AuthServiceUnitTests
{
    private readonly AuthDbContext _context;
    private readonly Mock<IJwtService> _jwtServiceMock;
    private readonly AuthService.Services.AuthService _authService;

    public AuthServiceUnitTests()
    {
        var options = new DbContextOptionsBuilder<AuthDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        _context = new AuthDbContext(options);
        
        _jwtServiceMock = new Mock<IJwtService>();
        _jwtServiceMock.Setup(x => x.GenerateAccessToken(It.IsAny<User>()))
            .Returns("test-access-token");
        _jwtServiceMock.Setup(x => x.GenerateRefreshToken())
            .Returns("test-refresh-token");
        
        _authService = new AuthService.Services.AuthService(_context, _jwtServiceMock.Object, Mock.Of<ILogger<AuthService.Services.AuthService>>());
    }

    [Fact]
    public async Task Register_ValidRequest_ShouldCreateUser()
    {
        // Arrange
        var request = new RegisterRequest
        {
            Email = "test@example.com",
            Password = "Test123!",
            FirstName = "Test",
            LastName = "User",
            Phone = "+375291234567"
        };

        // Act
        var (response, error) = await _authService.RegisterAsync(request);

        // Assert
        error.Should().BeNull();
        response.Should().NotBeNull();
        response!.User.Email.Should().Be(request.Email);
        response.User.FirstName.Should().Be(request.FirstName);
        response.User.Role.Should().Be(UserRole.User);
        response.AccessToken.Should().NotBeNullOrEmpty();
    }

    [Fact]
    public async Task Register_DuplicateEmail_ShouldReturnError()
    {
        // Arrange
        var request = new RegisterRequest
        {
            Email = "duplicate@example.com",
            Password = "Test123!",
            FirstName = "Test",
            LastName = "User"
        };
        await _authService.RegisterAsync(request);

        // Act
        var (response, error) = await _authService.RegisterAsync(request);

        // Assert
        error.Should().NotBeNull();
        error.Should().Contain("уже существует");
        response.Should().BeNull();
    }

    [Fact]
    public async Task Login_ValidCredentials_ShouldReturnTokens()
    {
        // Arrange
        var registerRequest = new RegisterRequest
        {
            Email = "login@example.com",
            Password = "Test123!",
            FirstName = "Test",
            LastName = "User"
        };
        await _authService.RegisterAsync(registerRequest);

        var loginRequest = new LoginRequest
        {
            Email = "login@example.com",
            Password = "Test123!"
        };

        // Act
        var (response, error) = await _authService.LoginAsync(loginRequest, "127.0.0.1");

        // Assert
        error.Should().BeNull();
        response.Should().NotBeNull();
        response!.AccessToken.Should().NotBeNullOrEmpty();
        response.RefreshToken.Should().NotBeNullOrEmpty();
    }

    [Fact]
    public async Task Login_InvalidPassword_ShouldReturnError()
    {
        // Arrange
        var registerRequest = new RegisterRequest
        {
            Email = "wrongpass@example.com",
            Password = "Correct123!",
            FirstName = "Test",
            LastName = "User"
        };
        await _authService.RegisterAsync(registerRequest);

        var loginRequest = new LoginRequest
        {
            Email = "wrongpass@example.com",
            Password = "Wrong123!"
        };

        // Act
        var (response, error) = await _authService.LoginAsync(loginRequest, "127.0.0.1");

        // Assert
        error.Should().NotBeNull();
        response.Should().BeNull();
    }

    [Fact]
    public async Task GetUserById_ExistingUser_ShouldReturnUser()
    {
        // Arrange
        var registerRequest = new RegisterRequest
        {
            Email = "getuser@example.com",
            Password = "Test123!",
            FirstName = "Test",
            LastName = "User"
        };
        var (regResponse, _) = await _authService.RegisterAsync(registerRequest);

        // Act
        var user = await _authService.GetUserByIdAsync(regResponse!.User.Id);

        // Assert
        user.Should().NotBeNull();
        user!.Email.Should().Be(registerRequest.Email);
    }

    [Fact]
    public async Task ChangePassword_CorrectOldPassword_ShouldChange()
    {
        // Arrange
        var registerRequest = new RegisterRequest
        {
            Email = "changepass@example.com",
            Password = "Old123!",
            FirstName = "Test",
            LastName = "User"
        };
        var (regResponse, _) = await _authService.RegisterAsync(registerRequest);

        var changeRequest = new ChangePasswordRequest
        {
            OldPassword = "Old123!",
            NewPassword = "New123!"
        };

        // Act
        var (success, error) = await _authService.ChangePasswordAsync(regResponse!.User.Id, changeRequest);

        // Assert
        success.Should().BeTrue();
        error.Should().BeNull();

        // Verify can login with new password
        var loginRequest = new LoginRequest { Email = "changepass@example.com", Password = "New123!" };
        var (loginResponse, loginError) = await _authService.LoginAsync(loginRequest, "127.0.0.1");
        loginError.Should().BeNull();
        loginResponse.Should().NotBeNull();
    }
}