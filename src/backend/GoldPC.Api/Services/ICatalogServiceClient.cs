#pragma warning disable CS1591
using GoldPC.SharedKernel.DTOs;

namespace GoldPC.Api.Services;

/// <summary>
/// HTTP-клиент для взаимодействия с CatalogService.
/// Предоставляет методы для CRUD-операций с товарами, категориями и производителями.
/// </summary>
public interface ICatalogServiceClient
{
    // Товары

    /// <summary>
    /// Получает постраничный список товаров с фильтрацией по категории, статусу и поисковому запросу.
    /// </summary>
    /// <param name="page">Номер страницы (начиная с 1).</param>
    /// <param name="pageSize">Размер страницы.</param>
    /// <param name="category">Slug категории для фильтрации (или <c>null</c> для всех).</param>
    /// <param name="isActive">Фильтр по статусу активности (или <c>null</c> для всех).</param>
    /// <param name="search">Поисковый запрос по названию товара.</param>
    /// <returns>Постраничный результат со списком товаров.</returns>
    Task<PagedResult<ProductListDto>> GetProductsAsync(int page, int pageSize, string? category, bool? isActive, string? search = null);

    /// <summary>
    /// Получает детальную информацию о товаре по идентификатору.
    /// </summary>
    /// <param name="id">Идентификатор товара.</param>
    /// <returns>Детали товара или <c>null</c>, если товар не найден.</returns>
    Task<ProductDetailDto?> GetProductByIdAsync(Guid id);

    /// <summary>
    /// Создаёт новый товар на основе переданного DTO.
    /// </summary>
    /// <param name="dto">Данные для создания товара.</param>
    /// <returns>Созданный товар с заполненным идентификатором.</returns>
    Task<ProductDetailDto> CreateProductAsync(CreateProductDto dto);

    /// <summary>
    /// Обновляет существующий товар по идентификатору.
    /// </summary>
    /// <param name="id">Идентификатор товара.</param>
    /// <param name="dto">Данные для обновления товара.</param>
    /// <returns>Обновлённый товар или <c>null</c>, если товар не найден.</returns>
    Task<ProductDetailDto?> UpdateProductAsync(Guid id, UpdateProductDto dto);

    /// <summary>
    /// Удаляет товар по идентификатору.
    /// </summary>
    /// <param name="id">Идентификатор товара.</param>
    /// <returns><c>true</c>, если товар успешно удалён; иначе <c>false</c>.</returns>
    Task<bool> DeleteProductAsync(Guid id);

    // Категории

    /// <summary>
    /// Получает список всех категорий товаров.
    /// </summary>
    /// <returns>Список категорий.</returns>
    Task<List<CategoryDto>> GetCategoriesAsync();

    /// <summary>
    /// Создаёт новую категорию товаров.
    /// </summary>
    /// <param name="dto">Данные для создания категории.</param>
    /// <returns>Созданная категория.</returns>
    Task<CategoryDto> CreateCategoryAsync(CreateCategoryDto dto);

    /// <summary>
    /// Обновляет существующую категорию по идентификатору.
    /// </summary>
    /// <param name="id">Идентификатор категории.</param>
    /// <param name="dto">Данные для обновления категории.</param>
    /// <returns>Обновлённая категория или <c>null</c>, если категория не найдена.</returns>
    Task<CategoryDto?> UpdateCategoryAsync(Guid id, UpdateCategoryDto dto);

    /// <summary>
    /// Удаляет категорию по идентификатору.
    /// </summary>
    /// <param name="id">Идентификатор категории.</param>
    /// <returns><c>true</c>, если категория успешно удалена; иначе <c>false</c>.</returns>
    Task<bool> DeleteCategoryAsync(Guid id);

    // Производители

    /// <summary>
    /// Получает список всех производителей.
    /// </summary>
    /// <returns>Список производителей.</returns>
    Task<List<ManufacturerDto>> GetManufacturersAsync();

    /// <summary>
    /// Создаёт нового производителя.
    /// </summary>
    /// <param name="dto">Данные для создания производителя.</param>
    /// <returns>Созданный производитель.</returns>
    Task<ManufacturerDto> CreateManufacturerAsync(CreateManufacturerDto dto);

    /// <summary>
    /// Обновляет существующего производителя по идентификатору.
    /// </summary>
    /// <param name="id">Идентификатор производителя.</param>
    /// <param name="dto">Данные для обновления производителя.</param>
    /// <returns>Обновлённый производитель или <c>null</c>, если производитель не найден.</returns>
    Task<ManufacturerDto?> UpdateManufacturerAsync(Guid id, UpdateManufacturerDto dto);

    /// <summary>
    /// Удаляет производителя по идентификатору.
    /// </summary>
    /// <param name="id">Идентификатор производителя.</param>
    /// <returns><c>true</c>, если производитель успешно удалён; иначе <c>false</c>.</returns>
    Task<bool> DeleteManufacturerAsync(Guid id);

    // Статистика

    /// <summary>
    /// Получает общее количество товаров в каталоге.
    /// </summary>
    /// <returns>Количество товаров.</returns>
    Task<int> GetTotalProductsAsync();

    // История цен

    /// <summary>
    /// Получает историю изменения цен для указанного товара.
    /// </summary>
    /// <param name="productId">Идентификатор товара.</param>
    /// <returns>Список записей об изменении цен.</returns>
    Task<List<PriceHistoryDto>> GetPriceHistoryAsync(Guid productId);

    // Генерация названия

    /// <summary>
    /// Генерирует название товара на основе производителя, категории и спецификаций.
    /// </summary>
    /// <param name="manufacturerName">Название производителя.</param>
    /// <param name="categorySlug">Slug категории.</param>
    /// <param name="specifications">Словарь спецификаций товара.</param>
    /// <returns>Сгенерированное название товара.</returns>
    Task<string> GenerateProductNameAsync(string? manufacturerName, string? categorySlug, Dictionary<string, object>? specifications);

    // Мета-данные спецификаций

    /// <summary>
    /// Получает мета-данные спецификаций для указанной категории (атрибуты и их типы).
    /// </summary>
    /// <param name="categoryId">Идентификатор категории.</param>
    /// <returns>Мета-данные спецификаций или <c>null</c>, если категория не найдена.</returns>
    Task<CategorySpecificationsDto?> GetCategorySpecificationsAsync(Guid categoryId);
}
#pragma warning restore CS1591
