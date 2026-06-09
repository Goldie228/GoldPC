using GoldPC.Api.Models;

namespace GoldPC.Api.Services;

/// <summary>Сервис для загрузки/управления файлами изображений товаров</summary>
public interface IFileService
{
    /// <summary>Сохранить файл изображения товара</summary>
    Task<FileUploadResult> SaveAsync(IFormFile file, string productId);

    /// <summary>Удалить изображение (soft delete + физическое удаление файла)</summary>
    Task<bool> DeleteAsync(string imageId);

    /// <summary>Удалить все изображения товара</summary>
    Task DeleteAllForProductAsync(string productId);

    /// <summary>Получить все активные изображения товара</summary>
    Task<List<ProductImageDto>> GetImagesForProductAsync(string productId);

    /// <summary>Установить изображение как главное</summary>
    Task<ProductImageDto?> SetPrimaryAsync(string productId, string imageId);

    /// <summary>Пересортировать изображения</summary>
    Task<List<ProductImageDto>> ReorderAsync(string productId, List<string> imageIds);
}
