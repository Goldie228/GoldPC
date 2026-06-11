namespace GoldPC.AuthService.Services;

/// <summary>
/// Синглтон-сервис, хранящий состояние настройки TwoFactorRequired.
/// Значение устанавливается:
/// 1. Из appsettings.json при старте (Force2FA:Enabled)
/// 2. Через POST /api/v1/auth/admin/settings/two-factor при изменении в админке
/// </summary>
public sealed class TwoFactorSettingsService
{
    private readonly object _lock = new();
    private bool _twoFactorRequired;

    /// <summary>
    /// Текущее значение флага — требуется ли 2FA для привилегированных ролей.
    /// </summary>
    public bool IsTwoFactorRequired
    {
        get { lock (_lock) return _twoFactorRequired; }
    }

    /// <summary>
    /// Установить значение флага TwoFactorRequired.
    /// </summary>
    public void SetTwoFactorRequired(bool value)
    {
        lock (_lock) _twoFactorRequired = value;
    }
}
