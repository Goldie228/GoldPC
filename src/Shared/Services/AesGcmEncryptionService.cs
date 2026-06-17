#pragma warning disable CA1031, CS1591, SA1600
using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace GoldPC.Shared.Services;

/// <summary>
/// Реализация шифрования AES-256-GCM для конфиденциальных данных.
/// Формат хранения: Base64(nonce[12] + tag[16] + ciphertext[N])
/// Ключ загружается из переменной окружения ENCRYPTION_KEY (Base64, 32 байта).
/// При отсутствии ключа работает без шифрования (fallback для dev-окружения).
/// </summary>
public sealed class AesGcmEncryptionService : IEncryptionService, IDisposable
{
    private readonly ILogger<AesGcmEncryptionService> _logger;
    private readonly byte[]? _key;
    private readonly object _lock = new();
    private AesGcm? _aesGcm;
    private bool _disposed;

    /// <summary>Размер nonce для AES-GCM (12 байт)</summary>
    private static readonly int NonceSize = AesGcm.NonceByteSizes.MinSize; // 12

    /// <summary>Размер тега для AES-GCM (16 байт)</summary>
    private static readonly int TagSize = AesGcm.TagByteSizes.MinSize; // 16

    public bool IsEnabled => _key != null;

    public AesGcmEncryptionService(ILogger<AesGcmEncryptionService> logger, IConfiguration configuration)
    {
        _logger = logger;

        var keyBase64 = configuration["Encryption:Key"]
            ?? configuration["ENCRYPTION_KEY"];

        if (string.IsNullOrEmpty(keyBase64))
        {
            _logger.LogWarning(
                "Encryption key not configured (ENCRYPTION_KEY). " +
                "Field encryption is DISABLED — data will be stored in plain text. " +
                "Set ENCRYPTION_KEY env var (Base64, 32 bytes) to enable encryption.");
            return;
        }

        try
        {
            _key = Convert.FromBase64String(keyBase64);

            if (_key.Length != 32)
            {
                _logger.LogError(
                    "Encryption key must be exactly 32 bytes (256-bit). " +
                    "Got {KeyLength} bytes. Field encryption DISABLED.", _key.Length);
                _key = null;
                return;
            }

            _aesGcm = new AesGcm(_key, TagSize);
            _logger.LogInformation("AES-256-GCM encryption service initialized successfully.");
        }
        catch (FormatException)
        {
            _logger.LogError(
                "Encryption key is not valid Base64. Field encryption DISABLED.");
            _key = null;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to initialize AES-GCM encryption. Field encryption DISABLED.");
            _key = null;
        }
    }

    /// <inheritdoc />
    public string Encrypt(string plainText)
    {
        if (!IsEnabled || string.IsNullOrEmpty(plainText))
            return plainText;

        var plaintextBytes = Encoding.UTF8.GetBytes(plainText);
        var nonce = new byte[NonceSize];
        var ciphertext = new byte[plaintextBytes.Length];
        var tag = new byte[TagSize];

        // Генерируем уникальный nonce для каждого шифрования
        RandomNumberGenerator.Fill(nonce);

        lock (_lock)
        {
            _aesGcm!.Encrypt(nonce, plaintextBytes, ciphertext, tag);
        }

        // Формат: nonce[12] + tag[16] + ciphertext[N]
        var result = new byte[NonceSize + TagSize + ciphertext.Length];
        Buffer.BlockCopy(nonce, 0, result, 0, NonceSize);
        Buffer.BlockCopy(tag, 0, result, NonceSize, TagSize);
        Buffer.BlockCopy(ciphertext, 0, result, NonceSize + TagSize, ciphertext.Length);

        return Convert.ToBase64String(result);
    }

    /// <inheritdoc />
    public string Decrypt(string cipherText)
    {
        if (!IsEnabled || string.IsNullOrEmpty(cipherText))
            return cipherText;

        try
        {
            var data = Convert.FromBase64String(cipherText);

            // Минимальный размер: nonce(12) + tag(16) = 28 байт
            if (data.Length < NonceSize + TagSize)
            {
                _logger.LogWarning("Encrypted data too short ({Length} bytes), returning as-is.", data.Length);
                return cipherText;
            }

            var nonce = new byte[NonceSize];
            var tag = new byte[TagSize];
            var ciphertext = new byte[data.Length - NonceSize - TagSize];

            Buffer.BlockCopy(data, 0, nonce, 0, NonceSize);
            Buffer.BlockCopy(data, NonceSize, tag, 0, TagSize);
            Buffer.BlockCopy(data, NonceSize + TagSize, ciphertext, 0, ciphertext.Length);

            var plaintext = new byte[ciphertext.Length];

            lock (_lock)
            {
                _aesGcm!.Decrypt(nonce, ciphertext, tag, plaintext);
            }

            return Encoding.UTF8.GetString(plaintext);
        }
        catch (FormatException)
        {
            _logger.LogWarning("Data is not valid Base64, returning as-is.");
            return cipherText;
        }
        catch (AuthenticationTagMismatchException)
        {
            _logger.LogWarning("Decryption failed: authentication tag mismatch (data may be corrupted or wrong key).");
            return cipherText;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Decryption failed unexpectedly.");
            return cipherText;
        }
    }

    /// <inheritdoc />
    public string ComputeHash(string value)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(value));
        return Convert.ToHexString(bytes).ToLowerInvariant();
    }

    public void Dispose()
    {
        if (_disposed) return;
        _aesGcm?.Dispose();
        _disposed = true;
    }
}
#pragma warning restore CA1031, CS1591, SA1600
