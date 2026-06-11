using GoldPC.Api.Models;

namespace GoldPC.Api.Services;

/// <summary>Сервис для загрузки/управления файлами изображений товаров</summary>
public interface IFileService
{
    /// <summary>Сохранить файл изображения товара</summary>
    /// <param name="file">Файл изображения для загрузки.</param>
    /// <param name="productId">Идентификатор товара.</param>
    /// <returns>Результат загрузки файла с метаданными.</returns>
    Task<FileUploadResult> SaveAsync(IFormFile file, string productId);

    /// <summary>Удалить изображение (soft delete + физическое удаление файла)</summary>
    /// <param name="imageId">Идентификатор изображения.</param>
    /// <returns><c>true</c>, если изображение успешно удалено; иначе <c>false</c>.</returns>
    Task<bool> DeleteAsync(string imageId);

    /// <summary>Удалить все изображения товара</summary>
    /// <param name="productId">Идентификатор товара.</param>
    /// <returns>Задачу, представляющую асинхронную операцию.</returns>
    Task DeleteAllForProductAsync(string productId);

    /// <summary>Получить все активные изображения товара</summary>
    /// <param name="productId">Идентификатор товара.</param>
    /// <returns>Список активных изображений товара.</returns>
    Task<List<ProductImageDto>> GetImagesForProductAsync(string productId);

    /// <summary>Установить изображение как главное</summary>
    /// <param name="productId">Идентификатор товара.</param>
    /// <param name="imageId">Идентификатор изображения.</param>
    /// <returns>Обновлённое изображение или <c>null</c>, если изображение не найдено.</returns>
    Task<ProductImageDto?> SetPrimaryAsync(string productId, string imageId);

    /// <summary>Пересортировать изображения</summary>
    /// <param name="productId">Идентификатор товара.</param>
    /// <param name="imageIds">Новый порядок идентификаторов изображений.</param>
    /// <returns>Отсортированный список изображений.</returns>
    Task<List<ProductImageDto>> ReorderAsync(string productId, List<string> imageIds);
}
