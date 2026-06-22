#pragma warning disable CS1591
using GoldPC.SharedKernel.DTOs;

namespace GoldPC.Api.Services;

/// <summary>
/// HTTP-клиент для взаимодействия с AuthService (управление пользователями).
/// </summary>
public interface IAuthServiceClient
{
    /// <summary>Создать пользователя (администратором)</summary>
    /// <returns>A <see cref="Task"/> representing the asynchronous operation.</returns>
    Task<Guid> CreateUserAsync(string firstName, string lastName, string email, string password, string role);

    /// <summary>Сбросить пароль пользователя (администратором)</summary>
    /// <returns>A <see cref="Task"/> representing the asynchronous operation.</returns>
    Task<bool> ResetUserPasswordAsync(Guid userId, string newPassword);

    /// <summary>Деактивировать пользователя</summary>
    /// <returns>A <see cref="Task"/> representing the asynchronous operation.</returns>
    Task<bool> DeactivateUserAsync(Guid userId);

    /// <summary>Активировать пользователя</summary>
    /// <returns>A <see cref="Task"/> representing the asynchronous operation.</returns>
    Task<bool> ActivateUserAsync(Guid userId);

    /// <summary>Удалить пользователя</summary>
    /// <returns>A <see cref="Task"/> representing the asynchronous operation.</returns>
    Task<bool> DeleteUserAsync(Guid userId);

    /// <summary>Обновить данные пользователя (имя, фамилия, телефон)</summary>
    /// <returns>A <see cref="Task"/> representing the asynchronous operation.</returns>
    Task<bool> UpdateUserAsync(Guid userId, string? firstName, string? lastName, string? phone);

    /// <summary>Изменить роль пользователя</summary>
    /// <returns>A <see cref="Task"/> representing the asynchronous operation.</returns>
    Task<bool> UpdateUserRoleAsync(Guid userId, string role);

    /// <summary>Синхронизировать настройку TwoFactorRequired с AuthService.</summary>
    /// <returns>A <see cref="Task"/> representing the asynchronous operation.</returns>
    Task<bool> SetTwoFactorRequiredAsync(bool enabled);
}
#pragma warning restore CS1591
