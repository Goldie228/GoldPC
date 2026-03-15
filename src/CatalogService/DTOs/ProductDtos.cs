namespace CatalogService.DTOs;

/// <summary>
/// DTO для списка товаров (каталог) - соответствует ProductSummary в OpenAPI
/// </summary>
public record ProductListDto
{
    public Guid Id { get; init; }
    public string Name { get; init; } = string.Empty;
    public string Sku { get; init; } = string.Empty;
    public string Category { get; init; } = string.Empty;
    public decimal Price { get; init; }
    public decimal? OldPrice { get; init; }
    public int Stock { get; init; }
    public ManufacturerDto? Manufacturer { get; init; }
    public ProductImageDto? MainImage { get; init; }
    public RatingDto? Rating { get; init; }
    public bool IsActive { get; init; }
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
    public string Category { get; init; } = string.Empty;
    public Guid? ManufacturerId { get; init; }
    public ManufacturerDto? Manufacturer { get; init; }
    public decimal Price { get; init; }
    public decimal? OldPrice { get; init; }
    public int Stock { get; init; }
    public int WarrantyMonths { get; init; }
    public string? Description { get; init; }
    public Dictionary<string, object> Specifications { get; init; } = new();
    public List<ProductImageDto> Images { get; init; } = new();
    public RatingDto? Rating { get; init; }
    public bool IsActive { get; init; }
    public bool IsFeatured { get; init; }
    public DateTime CreatedAt { get; init; }
    public DateTime? UpdatedAt { get; init; }
}

/// <summary>
/// DTO для создания товара - соответствует CreateProductRequest в OpenAPI
/// </summary>
public record CreateProductDto
{
    public string Name { get; init; } = string.Empty;
    public string Sku { get; init; } = string.Empty;
    
    /// <summary>Категория товара (slug или название)</summary>
    public string Category { get; init; } = string.Empty;
    
    /// <summary>ID категории (для внутреннего использования)</summary>
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
/// Параметры фильтрации товаров - соответствует ProductFilter в OpenAPI
/// </summary>
public record ProductFilterDto
{
    /// <summary>Фильтр по категории (slug или название)</summary>
    public string? Category { get; init; }
    
    /// <summary>Фильтр по ID категории (для внутренней фильтрации)</summary>
    public Guid? CategoryId { get; init; }
    
    /// <summary>Фильтр по ID производителя</summary>
    public Guid? ManufacturerId { get; init; }
    
    /// <summary>Минимальная цена</summary>
    public decimal? MinPrice { get; init; }
    
    /// <summary>Максимальная цена</summary>
    public decimal? MaxPrice { get; init; }
    
    /// <summary>Только в наличии</summary>
    public bool? InStock { get; init; }
    
    /// <summary>Только рекомендуемые</summary>
    public bool? IsFeatured { get; init; }
    
    /// <summary>Поиск по названию и описанию</summary>
    public string? Search { get; init; }
    
    /// <summary>Фильтр по спецификациям</summary>
    public Dictionary<string, object>? Specifications { get; init; }
    
    // Пагинация
    public int Page { get; init; } = 1;
    public int PageSize { get; init; } = 20;
    
    // Сортировка
    public string SortBy { get; init; } = "createdAt";
    public string SortOrder { get; init; } = "desc";
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

