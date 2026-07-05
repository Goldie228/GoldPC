using GoldPC.AuthService.Data;
using GoldPC.AuthService.Entities;
using GoldPC.AuthService.Services;
using GoldPC.AuthService.Infrastructure;
using GoldPC.SharedKernel.DTOs;
using GoldPC.SharedKernel.Enums;
using Microsoft.EntityFrameworkCore;
using Moq;
using FluentAssertions;
using Xunit;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Configuration;
using GoldPC.Shared.Services.Implementations;
using GoldPC.Shared.Services;

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

        // Моки для зависимостей AuthService
        var configurationMock = new Mock<IConfiguration>();
        var loggerMock = new Mock<ILogger<AuthService.Services.AuthService>>();
        var emailServiceMock = new Mock<SmtpEmailService>(
            Mock.Of<ILogger<SmtpEmailService>>(),
            configurationMock.Object);
        var tokenCacheMock = new Mock<ITokenCache>();
        var twoFactorSettings = new TwoFactorSettingsService();
        var encryptionMock = new Mock<IEncryptionService>();
        encryptionMock.Setup(x => x.Encrypt(It.IsAny<string>())).Returns((string s) => $"enc_{s}");
        encryptionMock.Setup(x => x.Decrypt(It.IsAny<string>())).Returns((string s) => s.StartsWith("enc_") ? s[4..] : s);
        encryptionMock.Setup(x => x.ComputeHash(It.IsAny<string>())).Returns((string s) => $"hash_{s}");

        var totpService = new TOTPService(
            _context,
            encryptionMock.Object,
            tokenCacheMock.Object,
            Mock.Of<ILogger<TOTPService>>());
        var passwordService = new PasswordService(
            _context,
            tokenCacheMock.Object,
            encryptionMock.Object,
            configurationMock.Object,
            emailServiceMock.Object,
            Mock.Of<ILogger<PasswordService>>());
        var avatarService = new AvatarService(
            _context,
            Mock.Of<ILogger<AvatarService>>());

        _authService = new AuthService.Services.AuthService(
            _context,
            _jwtServiceMock.Object,
            configurationMock.Object,
            loggerMock.Object,
            emailServiceMock.Object,
            tokenCacheMock.Object,
            twoFactorSettings,
            encryptionMock.Object,
            totpService,
            passwordService,
            avatarService);
    }

    [Fact]
    public async Task Register_ValidRequest_ShouldCreateUser()
    {
        // Подготовка
        var request = new RegisterRequest
        {
            Email = "test@example.com",
            Password = "Test123!",
            FirstName = "Test",
            LastName = "User",
            Phone = "+375291234567"
        };

        // Действие
        var (response, error) = await _authService.RegisterAsync(request);

        // Проверка
        error.Should().BeNull();
        response.Should().NotBeNull();
        response!.User.Email.Should().Be(request.Email);
        response.User.FirstName.Should().Be(request.FirstName);
        response.User.Role.Should().Be(UserRole.Client);
        response.AccessToken.Should().NotBeNullOrEmpty();
    }

    [Fact]
    public async Task Register_DuplicateEmail_ShouldReturnError()
    {
        // Подготовка
        var request = new RegisterRequest
        {
            Email = "duplicate@example.com",
            Password = "Test123!",
            FirstName = "Test",
            LastName = "User",
            Phone = "+375291234567"
        };
        await _authService.RegisterAsync(request);

        // Действие
        var (response, error) = await _authService.RegisterAsync(request);

        // Проверка
        error.Should().NotBeNull();
        error.Should().Contain("уже существует");
        response.Should().BeNull();
    }

    [Fact]
    public async Task Login_ValidCredentials_ShouldReturnTokens()
    {
        // Подготовка
        var registerRequest = new RegisterRequest
        {
            Email = "login@example.com",
            Password = "Test123!",
            FirstName = "Test",
            LastName = "User",
            Phone = "+375291234567"
        };
        await _authService.RegisterAsync(registerRequest);

        var loginRequest = new LoginRequest
        {
            Email = "login@example.com",
            Password = "Test123!"
        };

        // Действие
        var (response, error) = await _authService.LoginAsync(loginRequest, "127.0.0.1", "test-agent");

        // Проверка
        error.Should().BeNull();
        response.Should().NotBeNull();
        response!.AccessToken.Should().NotBeNullOrEmpty();
        response.RefreshToken.Should().NotBeNullOrEmpty();
    }

    [Fact]
    public async Task Login_InvalidPassword_ShouldReturnError()
    {
        // Подготовка
        var registerRequest = new RegisterRequest
        {
            Email = "wrongpass@example.com",
            Password = "Correct123!",
            FirstName = "Test",
            LastName = "User",
            Phone = "+375291234567"
        };
        await _authService.RegisterAsync(registerRequest);

        var loginRequest = new LoginRequest
        {
            Email = "wrongpass@example.com",
            Password = "Wrong123!"
        };

        // Действие
        var (response, error) = await _authService.LoginAsync(loginRequest, "127.0.0.1", "test-agent");

        // Проверка
        error.Should().NotBeNull();
        response.Should().BeNull();
    }

    [Fact]
    public async Task GetUserById_ExistingUser_ShouldReturnUser()
    {
        // Подготовка
        var registerRequest = new RegisterRequest
        {
            Email = "getuser@example.com",
            Password = "Test123!",
            FirstName = "Test",
            LastName = "User",
            Phone = "+375291234567"
        };
        var (regResponse, _) = await _authService.RegisterAsync(registerRequest);

        // Действие
        var user = await _authService.GetUserByIdAsync(regResponse!.User.Id);

        // Проверка
        user.Should().NotBeNull();
        user!.Email.Should().Be(registerRequest.Email);
    }

    [Fact]
    public async Task ChangePassword_CorrectOldPassword_ShouldChange()
    {
        // Подготовка
        var registerRequest = new RegisterRequest
        {
            Email = "changepass@example.com",
            Password = "Old123!",
            FirstName = "Test",
            LastName = "User",
            Phone = "+375291234567"
        };
        var (regResponse, _) = await _authService.RegisterAsync(registerRequest);

        var changeRequest = new ChangePasswordRequest
        {
            CurrentPassword = "Old123!",
            NewPassword = "New123!"
        };

        // Действие
        var (success, error) = await _authService.ChangePasswordAsync(regResponse!.User.Id, changeRequest);

        // Проверка
        success.Should().BeTrue();
        error.Should().BeNull();

        // Проверяем возможность входа с новым паролем
        var loginRequest = new LoginRequest { Email = "changepass@example.com", Password = "New123!" };
        var (loginResponse, loginError) = await _authService.LoginAsync(loginRequest, "127.0.0.1", "test-agent");
        loginError.Should().BeNull();
        loginResponse.Should().NotBeNull();
    }
}
