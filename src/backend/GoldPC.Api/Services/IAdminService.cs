using GoldPC.Api.Controllers;

namespace GoldPC.Api.Services;

/// <summary>Сервис административной панели</summary>
public interface IAdminService
{
    // Пользователи
    Task<PagedResult<UserDto>> GetUsersAsync(int page, int pageSize, string? search, string? role, bool? isActive);
    Task<UserDto?> GetUserByIdAsync(Guid id);
    Task<UserDto?> UpdateUserAsync(Guid id, UpdateUserDto update);
    Task<UserDto?> UpdateUserRoleAsync(Guid id, string role);
    Task<UserDto?> DeactivateUserAsync(Guid id);
    Task<UserDto?> ActivateUserAsync(Guid id);
    Task<bool> DeleteUserAsync(Guid id);
    Task<int> GetTotalUsersCountAsync();
    Task<UserDto> CreateUserAsync(CreateUserDto create);
    Task<bool> ResetUserPasswordAsync(Guid id, ResetPasswordDto reset);

    // Справочники (только атрибуты — категории/производители через CatalogService)
    Task<List<DictionaryItemDto>> GetDictionaryAsync(string type);
    Task<DictionaryItemDto> CreateDictionaryItemAsync(string type, CreateDictionaryItemRequest request);
    Task<DictionaryItemDto?> UpdateDictionaryItemAsync(string type, string id, UpdateDictionaryItemRequest request);
    Task<bool> DeleteDictionaryItemAsync(string type, string id);

    // Настройки
    Task<SiteSettingsDto> GetSettingsAsync();
    Task<SiteSettingsDto> UpdateSettingsAsync(UpdateSiteSettingsDto update);
    Task<SiteSettingsDto> ResetSettingsAsync();

    // Аудит-логи
    Task<PagedResult<AuditLogDto>> GetAuditLogsAsync(int page, int pageSize, string? actionType, string? severity, DateTime? startDate, DateTime? endDate);
    Task AddAuditLogAsync(string actionType, string userId, string userName, string userEmail, string description, string severity = "INFO", string? additionalData = null, string? ipAddress = null);
}
