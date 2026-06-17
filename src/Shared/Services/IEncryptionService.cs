#pragma warning disable CS1591
namespace GoldPC.Shared.Services;

/// <summary>
/// Сервис шифрования конфиденциальных данных (AES-256-GCM).
/// Используется для шифрования PII: телефонов, email, адресов при хранении в БД.
/// </summary>
public interface IEncryptionService
{
    /// <summary>
    /// Зашифровать строку и вернуть Base64-представление.
    /// Формат: Base64(nonce[12] + tag[16] + ciphertext[N])
    /// </summary>
    string Encrypt(string plainText);

    /// <summary>
    /// Расшифровать Base64-строку, зашифрованную методом Encrypt.
    /// </summary>
    string Decrypt(string cipherText);

    /// <summary>
    /// Вычислить SHA256-хеш строки (для поиска по зашифрованным полям).
    /// </summary>
    string ComputeHash(string value);

    /// <summary>
    /// Проверяет, включено ли шифрование (есть ли ключ).
    /// Если false — шифрование отключено (режим разработки).
    /// </summary>
    bool IsEnabled { get; }
}
#pragma warning restore CS1591
