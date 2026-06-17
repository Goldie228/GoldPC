#pragma warning disable CA1031, CS1591, SA1600
using System.Net.Http.Json;
using System.Text.Json;
using GoldPC.SharedKernel.DTOs;
using Microsoft.Extensions.Logging;

namespace GoldPC.Api.Services;

/// <summary>
/// HTTP-клиент для микросервиса AuthService (port 5002).
/// Реализует административные операции с пользователями.
/// </summary>
public class AuthServiceClient : IAuthServiceClient
{
    private readonly HttpClient _http;
    private readonly ILogger<AuthServiceClient> _logger;

    private static readonly JsonSerializerOptions _jsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        Converters = { new System.Text.Json.Serialization.JsonStringEnumConverter() }
    };

    public AuthServiceClient(HttpClient http, ILogger<AuthServiceClient> logger)
    {
        _http = http;
        _logger = logger;
    }

    /// <inheritdoc />
    public async Task<Guid> CreateUserAsync(string firstName, string lastName, string email, string password, string role)
    {
        try
        {
            _logger.LogInformation("AuthService CreateUser: {Email}, role={Role}", email, role);

            var request = new
            {
                FirstName = firstName,
                LastName = lastName,
                Email = email,
                Password = password,
                Role = role
            };

            var response = await _http.PostAsJsonAsync(new Uri("api/v1/auth/admin/users", UriKind.Relative), request, _jsonOptions);
            response.EnsureSuccessStatusCode();

            var user = await response.Content.ReadFromJsonAsync<UserDto>(_jsonOptions);
            return user?.Id ?? throw new InvalidOperationException("Пустой ответ при создании пользователя в AuthService");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error calling AuthService CreateUser {Email}", email);
            throw;
        }
    }

    /// <inheritdoc />
    public async Task<bool> ResetUserPasswordAsync(Guid userId, string newPassword)
    {
        try
        {
            _logger.LogInformation("AuthService ResetUserPassword: {UserId}", userId);

            var request = new { NewPassword = newPassword };
            var response = await _http.PostAsJsonAsync(new Uri($"api/v1/auth/admin/users/{userId}/reset-password", UriKind.Relative), request, _jsonOptions);

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning("AuthService ResetUserPassword failed: {StatusCode} for user {UserId}",
                    response.StatusCode, userId);
                return false;
            }

            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error calling AuthService ResetUserPassword {UserId}", userId);
            return false;
        }
    }

    /// <inheritdoc />
    public async Task<bool> DeactivateUserAsync(Guid userId)
    {
        try
        {
            _logger.LogInformation("AuthService DeactivateUser: {UserId}", userId);

            var response = await _http.PostAsync(new Uri($"api/v1/auth/admin/users/{userId}/deactivate", UriKind.Relative), null);
            return response.IsSuccessStatusCode;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error calling AuthService DeactivateUser {UserId}", userId);
            return false;
        }
    }

    /// <inheritdoc />
    public async Task<bool> ActivateUserAsync(Guid userId)
    {
        try
        {
            _logger.LogInformation("AuthService ActivateUser: {UserId}", userId);

            var response = await _http.PostAsync(new Uri($"api/v1/auth/admin/users/{userId}/activate", UriKind.Relative), null);
            return response.IsSuccessStatusCode;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error calling AuthService ActivateUser {UserId}", userId);
            return false;
        }
    }

    /// <inheritdoc />
    public async Task<bool> DeleteUserAsync(Guid userId)
    {
        try
        {
            _logger.LogInformation("AuthService DeleteUser: {UserId}", userId);

            var response = await _http.DeleteAsync(new Uri($"api/v1/auth/admin/users/{userId}", UriKind.Relative));
            return response.IsSuccessStatusCode;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error calling AuthService DeleteUser {UserId}", userId);
            return false;
        }
    }

    /// <inheritdoc />
    public async Task<bool> SetTwoFactorRequiredAsync(bool enabled)
    {
        try
        {
            _logger.LogInformation("AuthService SetTwoFactorRequired: {Enabled}", enabled);

            var request = new { Enabled = enabled };
            var response = await _http.PostAsJsonAsync(new Uri("api/v1/auth/admin/settings/two-factor", UriKind.Relative), request, _jsonOptions);
            return response.IsSuccessStatusCode;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error calling AuthService SetTwoFactorRequired");
            return false;
        }
    }
}
#pragma warning restore CA1031, CS1591, SA1600
