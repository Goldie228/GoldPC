namespace CatalogService.DTOs;

/// <summary>
/// DTO для списка товаров (каталог)
/// </summary>
public record ProductListDto
{
    public Guid Id { get; init; }
    public string Name { get; init; } = string.Empty;
    public string Sku { get; init; } = string.Empty;
    public decimal Price { get; init; }
    public int Stock { get; init; }
    public string? PrimaryImageUrl { get; init; }
    public string CategoryName { get; init; } = string.Empty;
    public string ManufacturerName { get; init; } = string.Empty;
    public double Rating { get; init; }
    public int ReviewCount { get; init; }
    public bool IsInStock => Stock > 0;
}

/// <summary>
/// DTO для детальной информации о товаре
/// </summary>
public record ProductDetailDto
{
    public Guid Id { get; init; }
    public string Name { get; init; } = string.Empty;
    public string Sku { get; init; } = string.Empty;
    public string? Description { get; init; }
    public decimal Price { get; init; }
    public int Stock { get; init; }
    public int WarrantyMonths { get; init; }
    public double Rating { get; init; }
    public int ReviewCount { get; init; }
    
    public CategoryDto Category { get; init; } = null!;
    public ManufacturerDto Manufacturer { get; init; } = null!;
    public Dictionary<string, object> Specifications { get; init; } = new();
    public List<ProductImageDto> Images { get; init; } = new();
    public List<ReviewDto> Reviews { get; init; } = new();
}

/// <summary>
/// DTO для создания товара
/// </summary>
public record CreateProductDto
{
    public string Name { get; init; } = string.Empty;
    public string Sku { get; init; } = string.Empty;
    public string? Description { get; init; }
    public Guid CategoryId { get; init; }
    public Guid ManufacturerId { get; init; }
    public decimal Price { get; init; }
    public int Stock { get; init; }
    public int WarrantyMonths { get; init; } = 12;
    public Dictionary<string, object> Specifications { get; init; } = new();
}

/// <summary>
/// DTO для обновления товара
/// </summary>
public record UpdateProductDto
{
    public string Name { get; init; } = string.Empty;
    public string? Description { get; init; }
    public decimal Price { get; init; }
    public int Stock { get; init; }
    public int WarrantyMonths { get; init; }
    public Dictionary<string, object> Specifications { get; init; } = new();
    public bool IsActive { get; init; } = true;
}

/// <summary>
/// DTO категории
/// </summary>
public record CategoryDto
{
    public Guid Id { get; init; }
    public string Name { get; init; } = string.Empty;
    public string Slug { get; init; } = string.Empty;
    public string? Description { get; init; }
    public Guid? ParentId { get; init; }
    public ComponentType? ComponentType { get; init; }
    public List<CategoryDto> Children { get; init; } = new();
}

/// <summary>
/// DTO производителя
/// </summary>
public record ManufacturerDto
{
    public Guid Id { get; init; }
    public string Name { get; init; } = string.Empty;
    public string? Country { get; init; }
    public string? LogoUrl { get; init; }
}

/// <summary>
/// DTO изображения товара
/// </summary>
public record ProductImageDto
{
    public Guid Id { get; init; }
    public string Url { get; init; } = string.Empty;
    public string? AltText { get; init; }
    public bool IsPrimary { get; init; }
}

/// <summary>
/// DTO отзыва
/// </summary>
public record ReviewDto
{
    public Guid Id { get; init; }
    public Guid UserId { get; init; }
    public string UserName { get; init; } = string.Empty;
    public int Rating { get; init; }
    public string? Comment { get; init; }
    public string? Pros { get; init; }
    public string? Cons { get; init; }
    public DateTime CreatedAt { get; init; }
    public bool IsVerified { get; init; }
}

/// <summary>
/// DTO для создания отзыва
/// </summary>
public record CreateReviewDto
{
    public int Rating { get; init; }
    public string? Comment { get; init; }
    public string? Pros { get; init; }
    public string? Cons { get; init; }
}

/// <summary>
/// Параметры фильтрации товаров
/// </summary>
public record ProductFilterDto
{
    public Guid? CategoryId { get; init; }
    public Guid? ManufacturerId { get; init; }
    public decimal? MinPrice { get; init; }
    public decimal? MaxPrice { get; init; }
    public string? Search { get; init; }
    public bool? InStockOnly { get; init; }
    public int Page { get; init; } = 1;
    public int PageSize { get; init; } = 20;
    public string SortBy { get; init; } = "name";
    public bool SortDesc { get; init; }
}

/// <summary>
/// Пагинированный результат
/// </summary>
public record PagedResult<T>
{
    public List<T> Items { get; init; } = new();
    public int TotalCount { get; init; }
    public int Page { get; init; }
    public int PageSize { get; init; }
    public int TotalPages => (int)Math.Ceiling((double)TotalCount / PageSize);
    public bool HasPreviousPage => Page > 1;
    public bool HasNextPage => Page < TotalPages;
}