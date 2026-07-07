#pragma warning disable CA1002, CA1056, CA1805, CS1591, SA1402, SA1600, SA1649
using System;
using System.Collections.Generic;
using Microsoft.AspNetCore.Mvc;

namespace GoldPC.SharedKernel.DTOs;

/// <summary>
/// DTO для списка товаров (каталог) - соответствует ProductSummary в OpenAPI
/// </summary>
public record ProductListDto
{
    public Guid Id { get; init; }

    public string Name { get; init; } = string.Empty;

    public string Sku { get; init; } = string.Empty;

    public string Slug { get; init; } = string.Empty;

    public string Category { get; init; } = string.Empty;

    public decimal Price { get; init; }

    public decimal? OldPrice { get; init; }

    public int Stock { get; init; }

    public ManufacturerDto? Manufacturer { get; init; }

    public ProductImageDto? MainImage { get; init; }

    public RatingDto? Rating { get; init; }

    public bool IsActive { get; init; }

    /// <summary>Получает краткое описание для QuickView (первые 300 символов)</summary>
    public string? DescriptionShort { get; init; }

    /// <summary>Получает сокет процессора (для проверки совместимости CPU/Motherboard)</summary>
    public string? Socket { get; init; }

    /// <summary>Получает тип оперативной памяти (для проверки совместимости Motherboard/RAM)</summary>
    public string? MemoryType { get; init; }

    /// <summary>Получает форм-фактор оперативной памяти (DIMM/SO-DIMM)</summary>
    public string? MemoryFormFactor { get; init; }

    /// <summary>Получает тепловыделение процессора в ваттах (для проверки совместимости с кулером)</summary>
    public int? Tdp { get; init; }

    /// <summary>Получает мощность блока питания в ваттах (для проверки совместимости PSU/system)</summary>
    public int? Wattage { get; init; }

    /// <summary>Получает список изображений товара (для галереи в карточке)</summary>
    public List<ProductImageDto> Images { get; init; } = new();
}

/// <summary>
/// DTO для рейтинга - соответствует Rating в OpenAPI
/// </summary>
public record RatingDto
{
    public double Average { get; init; }

    public int Count { get; init; }
}

/// <summary>
/// DTO для детальной информации о товаре - соответствует Product в OpenAPI
/// </summary>
public record ProductDetailDto
{
    public Guid Id { get; init; }

    public string Name { get; init; } = string.Empty;

    public string Sku { get; init; } = string.Empty;

    public string Slug { get; init; } = string.Empty;

    public string Category { get; init; } = string.Empty;

    public Guid? ManufacturerId { get; init; }

    public ManufacturerDto? Manufacturer { get; init; }

    public decimal Price { get; init; }

    public decimal? OldPrice { get; init; }

    public int Stock { get; init; }

    public int WarrantyMonths { get; init; }

    public string? Description { get; init; }

    public string? ManufacturerAddress { get; init; }

    public string? ProductionAddress { get; init; }

    public string? Importer { get; init; }

    public string? ServiceSupport { get; init; }

    public Dictionary<string, object> Specifications { get; init; } = new();

    public ProductImageDto? MainImage { get; init; }

    public List<ProductImageDto> Images { get; init; } = new();

    public RatingDto? Rating { get; init; }

    public bool IsActive { get; init; }

    public bool IsFeatured { get; init; }

    public DateTime CreatedAt { get; init; }

    public DateTime? UpdatedAt { get; init; }

    /// <summary>Получает значение, указывающее, была ли категория определена автоматически.</summary>
    public bool IsCategoryAutoDetected { get; init; }
}

/// <summary>
/// DTO для создания товара - соответствует CreateProductRequest в OpenAPI
/// </summary>
public record CreateProductDto
{
    public string Name { get; init; } = string.Empty;

    public string Sku { get; init; } = string.Empty;

    public string? Slug { get; init; }

    /// <summary>Получает категория товара (slug или название)</summary>
    public string Category { get; init; } = string.Empty;

    /// <summary>Получает iD категории (для внутреннего использования)</summary>
    public Guid? CategoryId { get; init; }

    public Guid? ManufacturerId { get; init; }

    public decimal Price { get; init; }

    public decimal? OldPrice { get; init; }

    public int Stock { get; init; }

    public int WarrantyMonths { get; init; } = 12;

    public string? Description { get; init; }

    public Dictionary<string, object> Specifications { get; init; } = new();

    public bool IsActive { get; init; } = true;

    public bool IsFeatured { get; init; } = false;
}

/// <summary>
/// DTO для обновления товара - соответствует UpdateProductRequest в OpenAPI
/// </summary>
public record UpdateProductDto
{
    public string? Name { get; init; }

    public string? Slug { get; init; }

    public Guid? ManufacturerId { get; init; }

    public decimal? Price { get; init; }

    public decimal? OldPrice { get; init; }

    public int? Stock { get; init; }

    public int? WarrantyMonths { get; init; }

    public string? Description { get; init; }

    public Dictionary<string, object>? Specifications { get; init; }

    public bool? IsActive { get; init; }

    public bool? IsFeatured { get; init; }
}

/// <summary>
/// DTO категории - соответствует Category в OpenAPI
/// </summary>
public record CategoryDto
{
    public Guid Id { get; init; }

    public string Name { get; init; } = string.Empty;

    public string Slug { get; init; } = string.Empty;

    public Guid? ParentId { get; init; }

    public List<CategoryDto> Children { get; init; } = new();

    public string? Icon { get; init; }

    public string? Description { get; init; }

    public int ProductCount { get; init; }

    public int Order { get; init; }
}

/// <summary>
/// DTO производителя - соответствует Manufacturer в OpenAPI
/// </summary>
public record ManufacturerDto
{
    public Guid Id { get; init; }

    public string Name { get; init; } = string.Empty;

    public string? Logo { get; init; }

    public string? Country { get; init; }

    public string? Description { get; init; }
}

/// <summary>
/// DTO для обновления производителя
/// </summary>
public record UpdateManufacturerDto
{
    public string? Name { get; init; }

    public string? Country { get; init; }

    public string? LogoUrl { get; init; }

    public string? Description { get; init; }
}

/// <summary>
/// DTO изображения товара - соответствует ProductImage в OpenAPI
/// </summary>
public record ProductImageDto
{
    public Guid Id { get; init; }

    public string Url { get; init; } = string.Empty;

    public string? Alt { get; init; }

    public bool IsMain { get; init; }

    public int Order { get; init; }
}

/// <summary>
/// DTO отзыва - соответствует Review в OpenAPI
/// </summary>
public record ReviewDto
{
    public Guid Id { get; init; }

    public Guid ProductId { get; init; }

    public Guid UserId { get; init; }

    public string UserName { get; init; } = string.Empty;

    public int Rating { get; init; }

    public string? Title { get; init; }

    public string? Comment { get; init; }

    public string? Pros { get; init; }

    public string? Cons { get; init; }

    public bool IsVerified { get; init; }

    public bool IsApproved { get; init; }

    public int Helpful { get; init; }

    public DateTime CreatedAt { get; init; }
}

/// <summary>
/// DTO для создания отзыва - соответствует CreateReviewRequest в OpenAPI
/// </summary>
public record CreateReviewDto
{
    public int Rating { get; init; }

    public string? Title { get; init; }

    public string? Comment { get; init; }

    public string? Pros { get; init; }

    public string? Cons { get; init; }
}

/// <summary>
/// DTO для обновления отзыва
/// </summary>
public record UpdateReviewDto
{
    public int Rating { get; init; }

    public string? Title { get; init; }

    public string? Comment { get; init; }

    public string? Pros { get; init; }

    public string? Cons { get; init; }
}

/// <summary>
/// Параметры фильтрации товаров - соответствует ProductFilter в OpenAPI
/// </summary>
public record ProductFilterDto
{
    /// <summary>Получает фильтр по категории (slug или название)</summary>
    public string? Category { get; init; }

    /// <summary>Получает фильтр по ID категории (для внутренней фильтрации)</summary>
    public Guid? CategoryId { get; init; }

    /// <summary>Получает фильтр по ID производителя (один)</summary>
    public Guid? ManufacturerId { get; init; }

    /// <summary>Получает фильтр по списку ID производителей (несколько)</summary>
    public IEnumerable<Guid>? ManufacturerIds { get; init; }

    /// <summary>Получает минимальная цена (query: priceMin)</summary>
    [FromQuery(Name = "priceMin")]
    public decimal? MinPrice { get; init; }

    /// <summary>Получает максимальная цена (query: priceMax)</summary>
    [FromQuery(Name = "priceMax")]
    public decimal? MaxPrice { get; init; }

    /// <summary>Получает только в наличии</summary>
    public bool? InStock { get; init; }

    /// <summary>Получает только рекомендуемые</summary>
    public bool? IsFeatured { get; init; }

    /// <summary>Получает только товары с картинками (true — есть хотя бы одна, false — без картинок, null — все)</summary>
    public bool? HasImages { get; init; }

    /// <summary>Получает фильтр по активности товара (true — активные, false — неактивные, null — все)</summary>
    public bool? IsActive { get; init; }

    /// <summary>Получает поиск по названию и описанию</summary>
    public string? Search { get; init; }

    /// <summary>Получает фильтр по спецификациям (ключ → значение для JSONB containment, select)</summary>
    public Dictionary<string, string>? Specifications { get; init; }

    /// <summary>Получает диапазоны для range-атрибутов: ключ → "min,max" (например "8,16")</summary>
    public Dictionary<string, string>? SpecificationRanges { get; init; }

    // Пагинация
    public int Page { get; init; } = 1;

    public int PageSize { get; init; } = 20;

    // Сортировка
    public string SortBy { get; init; } = "createdAt";

    public string SortOrder { get; init; } = "desc";
}

/// <summary>
/// Query-параметры для контекстно-зависимых атрибутов фильтра (при выборе Intel скрывать AM4/AM5)
/// </summary>
public record FilterAttributesQueryDto
{
    public IEnumerable<Guid>? ManufacturerIds { get; init; }

    public Dictionary<string, string>? Specifications { get; init; }

    public Dictionary<string, string>? SpecificationRanges { get; init; }

    /// <summary>Получает флаг фильтра "в наличии", используемый для согласования фасетов с результатами товаров.</summary>
    public bool? InStock { get; init; }
}

/// <summary>
/// DTO атрибута фильтра по характеристикам
/// </summary>
public record FilterAttributeDto
{
    public string Key { get; init; } = string.Empty;

    public string DisplayName { get; init; } = string.Empty;

    public string FilterType { get; init; } = "select"; // select | range

    public int SortOrder { get; init; }

    /// <summary>Получает уникальные значения для select-фильтра (из товаров категории)</summary>
    public List<string> Values { get; init; } = new();

    /// <summary>Получает мин. значение для range-фильтра (из товаров категории)</summary>
    public decimal? MinValue { get; init; }

    /// <summary>Получает макс. значение для range-фильтра</summary>
    public decimal? MaxValue { get; init; }
}

/// <summary>
/// DTO для создания производителя
/// </summary>
public record CreateManufacturerDto
{
    public string Name { get; init; } = string.Empty;

    public string? Country { get; init; }

    public string? LogoUrl { get; init; }

    public string? Description { get; init; }
}

/// <summary>
/// DTO для создания категории
/// </summary>
public record CreateCategoryDto
{
    public string Name { get; init; } = string.Empty;

    public string Slug { get; init; } = string.Empty;

    public string? Description { get; init; }

    public Guid? ParentId { get; init; }
}

/// <summary>
/// DTO для обновления категории
/// </summary>
public record UpdateCategoryDto
{
    public string? Name { get; init; }

    public string? Slug { get; init; }

    public string? Description { get; init; }

    public Guid? ParentId { get; init; }
}

/// <summary>
/// Пагинированный результат - соответствует PagedResponse в OpenAPI
/// </summary>
public record PagedResult<T>
{
    public List<T> Data { get; init; } = new();

    public PaginationMeta Meta { get; init; } = new();
}

/// <summary>
/// Метаданные пагинации - соответствует PaginationMeta в OpenAPI
/// </summary>
public record PaginationMeta
{
    public int Page { get; init; }

    public int PageSize { get; init; }

    public int TotalPages { get; init; }

    public int TotalItems { get; init; }

    public bool HasNextPage { get; init; }

    public bool HasPrevPage { get; init; }
}

/// <summary>
/// DTO записи об изменении цены товара
/// </summary>
public record PriceHistoryDto
{
    public Guid Id { get; init; }

    public decimal Price { get; init; }

    public decimal? OldPrice { get; init; }

    public DateTime ChangedAt { get; init; }

    public string? ChangedBy { get; init; }
}

/// <summary>
/// Запрос на генерацию названия товара по шаблону
/// </summary>
public record GenerateNameRequest
{
    /// <summary>Получает название производителя</summary>
    public string? ManufacturerName { get; init; }

    /// <summary>Получает slug категории</summary>
    public string? CategorySlug { get; init; }

    /// <summary>Получает характеристики товара</summary>
    public Dictionary<string, object>? Specifications { get; init; }
}

/// <summary>
/// Ответ сгенерированного названия товара
/// </summary>
public record GenerateNameResponse
{
    /// <summary>Получает сгенерированное название</summary>
    public string Name { get; init; } = string.Empty;
}

/// <summary>
/// DTO с мета-информацией о характеристике для редактора админки
/// </summary>
public record SpecificationAttributeDto
{
    /// <summary>Получает идентификатор атрибута.</summary>
    public Guid Id { get; init; }

    /// <summary>Получает ключ атрибута (socket, cores, frequency...).</summary>
    public string Key { get; init; } = string.Empty;

    /// <summary>Получает отображаемое имя атрибута ("Socket", "Core Count").</summary>
    public string DisplayName { get; init; } = string.Empty;

    /// <summary>Получает тип значения: "select" или "range".</summary>
    public string ValueType { get; init; } = "select";

    /// <summary>Получает значение, указывающее, поддерживает ли атрибут множественные значения.</summary>
    public bool IsMultiValue { get; init; }

    /// <summary>Получает единица измерения (MHz, GB, mm, Ohm...).</summary>
    public string? Unit { get; init; }

    /// <summary>Получает имя группы для группировки атрибутов.</summary>
    public string? GroupName { get; init; }

    /// <summary>Получает порядок сортировки атрибута.</summary>
    public int SortOrder { get; init; }

    /// <summary>Получает минимальное допустимое значение для range-атрибутов.</summary>
    public decimal? ValidationMin { get; init; }

    /// <summary>Получает максимальное допустимое значение для range-атрибутов.</summary>
    public decimal? ValidationMax { get; init; }

    /// <summary>Получает шаг изменения для range-атрибутов.</summary>
    public decimal? ValidationStep { get; init; }

    /// <summary>Получает значение, указывающее, является ли атрибут обязательным.</summary>
    public bool IsRequired { get; init; }

    /// <summary>Получает список доступных опций для select-атрибутов.</summary>
    public List<string> Options { get; init; } = new();
}

/// <summary>
/// DTO с характеристиками категории для редактора админки
/// </summary>
public record CategorySpecificationsDto
{
    /// <summary>Получает идентификатор категории.</summary>
    public Guid CategoryId { get; init; }

    /// <summary>Получает название категории.</summary>
    public string CategoryName { get; init; } = string.Empty;

    /// <summary>Получает список атрибутов спецификаций для категории.</summary>
    public List<SpecificationAttributeDto> Attributes { get; init; } = new();
}
#pragma warning restore CA1002, CA1056, CA1805, CS1591, SA1402, SA1600, SA1649
