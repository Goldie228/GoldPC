using GoldPC.Api.Models;

namespace GoldPC.Api.Services;

/// <summary>In-memory реализация IFileService с сохранением на диск</summary>
public class FileService : IFileService
{
    private readonly IWebHostEnvironment _env;
    private readonly ILogger<FileService> _logger;
    private static readonly List<ProductImageDto> _images = new();
    private static readonly object _lock = new();

    private static readonly HashSet<string> _allowedExtensions = new(StringComparer.OrdinalIgnoreCase)
    {
        ".jpg", ".jpeg", ".png", ".webp"
    };

    private const long MaxFileSize = 5 * 1024 * 1024; // 5 MB

    public FileService(IWebHostEnvironment env, ILogger<FileService> logger)
    {
        _env = env;
        _logger = logger;
    }

    /// <inheritdoc/>
    public async Task<FileUploadResult> SaveAsync(IFormFile file, string productId)
    {
        // 1. Validate extension
        var ext = Path.GetExtension(file.FileName);
        if (string.IsNullOrEmpty(ext) || !_allowedExtensions.Contains(ext))
        {
            _logger.LogWarning("Rejected file {Name} with invalid extension {Ext}", file.FileName, ext);
            return new FileUploadResult { Success = false, Error = "Допустимы только .jpg, .jpeg, .png, .webp" };
        }

        // 2. Validate size
        if (file.Length > MaxFileSize)
        {
            _logger.LogWarning("Rejected file {Name} — size {Size} exceeds limit", file.FileName, file.Length);
            return new FileUploadResult { Success = false, Error = "Максимальный размер файла — 5 МБ" };
        }

        // 3. Ensure directory exists
        var uploadDir = Path.Combine(_env.WebRootPath, "uploads", productId);
        Directory.CreateDirectory(uploadDir);

        // 4. Generate unique filename
        var fileName = $"{Guid.NewGuid()}{ext}";
        var filePath = Path.Combine(uploadDir, fileName);

        // 5. Save to disk
        await using (var stream = new FileStream(filePath, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }

        // 6. Create DTO
        var image = new ProductImageDto
        {
            Id = Guid.NewGuid().ToString(),
            ProductId = productId,
            Url = $"/uploads/{productId}/{fileName}",
            IsPrimary = !_images.Any(i =>
                i.ProductId == productId && i.IsActive && i.IsPrimary),
            IsActive = true,
            SortOrder = _images.Count(i => i.ProductId == productId && i.IsActive) + 1,
            CreatedAt = DateTime.UtcNow
        };

        lock (_lock)
        {
            _images.Add(image);
        }

        _logger.LogInformation("Image saved: {Url} for product {ProductId}", image.Url, productId);
        return new FileUploadResult { Success = true, Image = image };
    }

    /// <inheritdoc/>
    public Task<bool> DeleteAsync(string imageId)
    {
        var index = _images.FindIndex(i => i.Id == imageId);
        if (index == -1) return Task.FromResult(false);

        var image = _images[index];

        // Soft delete
        _images[index] = image with { IsActive = false };

        // Physically delete file from disk
        DeleteFileFromDisk(image.Url);

        _logger.LogInformation("Image {ImageId} soft-deleted (file removed)", imageId);
        return Task.FromResult(true);
    }

    /// <inheritdoc/>
    public Task DeleteAllForProductAsync(string productId)
    {
        var toDelete = _images
            .Select((img, idx) => new { img, idx })
            .Where(x => x.img.ProductId == productId && x.img.IsActive)
            .ToList();

        foreach (var item in toDelete)
        {
            _images[item.idx] = item.img with { IsActive = false };
            DeleteFileFromDisk(item.img.Url);
        }

        // Remove directory
        var dir = Path.Combine(_env.WebRootPath, "uploads", productId);
        if (Directory.Exists(dir))
        {
            try { Directory.Delete(dir, recursive: true); }
            catch (Exception ex) { _logger.LogWarning(ex, "Failed to delete directory {Dir}", dir); }
        }

        _logger.LogInformation("All images deleted for product {ProductId}", productId);
        return Task.CompletedTask;
    }

    /// <inheritdoc/>
    public Task<List<ProductImageDto>> GetImagesForProductAsync(string productId)
    {
        var result = _images
            .Where(i => i.ProductId == productId && i.IsActive)
            .OrderBy(i => i.SortOrder)
            .ToList();

        return Task.FromResult(result);
    }

    /// <inheritdoc/>
    public Task<ProductImageDto?> SetPrimaryAsync(string productId, string imageId)
    {
        ProductImageDto? result = null;

        for (var i = 0; i < _images.Count; i++)
        {
            var img = _images[i];
            if (img.ProductId != productId || !img.IsActive) continue;

            if (img.Id == imageId)
            {
                var updated = img with { IsPrimary = true };
                _images[i] = updated;
                result = updated;
            }
            else if (img.IsPrimary)
            {
                _images[i] = img with { IsPrimary = false };
            }
        }

        _logger.LogInformation("Primary image set to {ImageId} for product {ProductId}", imageId, productId);
        return Task.FromResult(result);
    }

    /// <inheritdoc/>
    public Task<List<ProductImageDto>> ReorderAsync(string productId, List<string> imageIds)
    {
        var updated = new List<ProductImageDto>();

        for (var order = 0; order < imageIds.Count; order++)
        {
            var imageId = imageIds[order];
            var index = _images.FindIndex(i => i.Id == imageId && i.ProductId == productId);
            if (index == -1) continue;

            var img = _images[index] with { SortOrder = order + 1 };
            _images[index] = img;
            updated.Add(img);
        }

        var sorted = updated.OrderBy(i => i.SortOrder).ToList();
        _logger.LogInformation("Images reordered for product {ProductId}", productId);
        return Task.FromResult(sorted);
    }

    // ====================================================================
    // Helpers
    // ====================================================================
    private void DeleteFileFromDisk(string url)
    {
        var relativePath = url.TrimStart('/');
        var fullPath = Path.Combine(_env.WebRootPath, relativePath);

        if (File.Exists(fullPath))
        {
            try { File.Delete(fullPath); }
            catch (Exception ex) { _logger.LogWarning(ex, "Failed to delete file {Path}", fullPath); }
        }
    }
}
