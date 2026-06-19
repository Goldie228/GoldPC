#pragma warning disable CS1591
// Copyright (c) GoldPC. All rights reserved.

using GoldPC.AuthService.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace GoldPC.AuthService.Services;

/// <summary>
/// Сервис управления аватарами пользователей: загрузка, удаление.
/// </summary>
public class AvatarService
{
    private readonly AuthDbContext _context;
    private readonly ILogger<AvatarService> _logger;
    private const long MaxFileSize = 5 * 1024 * 1024; // 5 МБ
    private static readonly string[] AllowedTypes = ["image/jpeg", "image/png", "image/webp"];

    public AvatarService(AuthDbContext context, ILogger<AvatarService> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// Загружает аватар пользователя. Старый файл удаляется.
    /// </summary>
    public async Task<(string? AvatarUrl, string? Error)> UploadAvatarAsync(Guid userId, IFormFile file)
    {
        var user = await _context.Users.FindAsync(userId);
        if (user == null)
            return (null, "Пользователь не найден");

        if (!AllowedTypes.Contains(file.ContentType.ToLower()))
            return (null, "Допустимы только JPG, PNG, WebP");

        if (file.Length > MaxFileSize)
            return (null, "Размер файла не должен превышать 5 МБ");

        if (!string.IsNullOrEmpty(user.AvatarUrl))
        {
            DeleteAvatarFile(user.AvatarUrl);
        }

        var uploadsDir = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads", "avatars");
        Directory.CreateDirectory(uploadsDir);

        var ext = Path.GetExtension(file.FileName).ToLower();
        var fileName = $"{userId}{ext}";
        var filePath = Path.Combine(uploadsDir, fileName);

        await using (var stream = new FileStream(filePath, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }

        var avatarUrl = $"/uploads/avatars/{fileName}";
        user.AvatarUrl = avatarUrl;
        await _context.SaveChangesAsync();

        _logger.LogInformation("Avatar uploaded for user {UserId}", userId);
        return (avatarUrl, null);
    }

    /// <summary>
    /// Удаляет аватар пользователя.
    /// </summary>
    public async Task<(bool Success, string? Error)> DeleteAvatarAsync(Guid userId)
    {
        var user = await _context.Users.FindAsync(userId);
        if (user == null)
            return (false, "Пользователь не найден");

        if (string.IsNullOrEmpty(user.AvatarUrl))
            return (false, "Аватар не установлен");

        DeleteAvatarFile(user.AvatarUrl);
        user.AvatarUrl = null;
        await _context.SaveChangesAsync();

        _logger.LogInformation("Avatar deleted for user {UserId}", userId);
        return (true, null);
    }

    private void DeleteAvatarFile(string avatarUrl)
    {
        var relativePath = avatarUrl.TrimStart('/');
        var fullPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", relativePath);
        if (File.Exists(fullPath))
        {
            try { File.Delete(fullPath); }
            catch (IOException ex) { _logger.LogWarning(ex, "Failed to delete avatar file {Path}", fullPath); }
        }
    }
}
#pragma warning restore CS1591
