using CatalogService.DTOs;
using CatalogService.Models;
using CatalogService.Repositories.Interfaces;
using CatalogService.Services.Interfaces;

namespace CatalogService.Services;

/// <summary>
/// Реализация сервиса каталога
/// </summary>
public class CatalogService : ICatalogService
{
    private readonly IProductRepository _productRepository;
    private readonly ICategoryRepository _categoryRepository;
    private readonly IManufacturerRepository _manufacturerRepository;
    private readonly IReviewRepository _reviewRepository;
    private readonly ILogger<CatalogService> _logger;

    public CatalogService(
        IProductRepository productRepository,
        ICategoryRepository categoryRepository,
        IManufacturerRepository manufacturerRepository,
        IReviewRepository reviewRepository,
        ILogger<CatalogService> logger)
    {
        _productRepository = productRepository;
        _categoryRepository = categoryRepository;
        _manufacturerRepository = manufacturerRepository;
        _reviewRepository = reviewRepository;
        _logger = logger;
    }

    #region Products

    public async Task<PagedResult<ProductListDto>> GetProductsAsync(ProductFilterDto filter)
    {
        var result = await _productRepository.GetFilteredAsync(filter);
        
        return new PagedResult<ProductListDto>
        {
            Items = result.Items.Select(MapToListDto).ToList(),
            TotalCount = result.TotalCount,
            Page = result.Page,
            PageSize = result.PageSize
        };
    }

    public async Task<ProductDetailDto?> GetProductByIdAsync(Guid id)
    {
        var product = await _productRepository.GetDetailByIdAsync(id);
        return product != null ? MapToDetailDto(product) : null;
    }

    public async Task<ProductDetailDto?> GetProductBySkuAsync(string sku)
    {
        var product = await _productRepository.GetBySkuAsync(sku);
        if (product == null) return null;
        
        var detailedProduct = await _productRepository.GetDetailByIdAsync(product.Id);
        return detailedProduct != null ? MapToDetailDto(detailedProduct) : null;
    }

    public async Task<ProductDetailDto> CreateProductAsync(CreateProductDto dto)
    {
        // Проверка уникальности SKU
        if (await _productRepository.SkuExistsAsync(dto.Sku))
        {
            throw new InvalidOperationException($"Товар с артикулом {dto.Sku} уже существует");
        }

        var product = new Product
        {
            Name = dto.Name,
            Sku = dto.Sku,
            Description = dto.Description,
            CategoryId = dto.CategoryId,
            ManufacturerId = dto.ManufacturerId,
            Price = dto.Price,
            Stock = dto.Stock,
            WarrantyMonths = dto.WarrantyMonths,
            Specifications = dto.Specifications
        };

        var created = await _productRepository.CreateAsync(product);
        return (await GetProductByIdAsync(created.Id))!;
    }

    public async Task<ProductDetailDto?> UpdateProductAsync(Guid id, UpdateProductDto dto)
    {
        var product = await _productRepository.GetByIdAsync(id);
        if (product == null) return null;

        product.Name = dto.Name;
        product.Description = dto.Description;
        product.Price = dto.Price;
        product.Stock = dto.Stock;
        product.WarrantyMonths = dto.WarrantyMonths;
        product.Specifications = dto.Specifications;
        product.IsActive = dto.IsActive;

        await _productRepository.UpdateAsync(product);
        return await GetProductByIdAsync(id);
    }

    public async Task<bool> DeleteProductAsync(Guid id)
    {
        if (!await _productRepository.ExistsAsync(id)) return false;
        await _productRepository.DeleteAsync(id);
        return true;
    }

    public async Task<IEnumerable<ProductListDto>> GetProductsByIdsAsync(IEnumerable<Guid> ids)
    {
        var products = await _productRepository.GetByIdsAsync(ids);
        return products.Select(MapToListDto);
    }

    #endregion

    #region Categories

    public async Task<IEnumerable<CategoryDto>> GetCategoriesAsync()
    {
        var categories = await _categoryRepository.GetAllAsync();
        return categories.Select(MapToCategoryDto);
    }

    public async Task<CategoryDto?> GetCategoryBySlugAsync(string slug)
    {
        var category = await _categoryRepository.GetBySlugAsync(slug);
        return category != null ? MapToCategoryDto(category) : null;
    }

    public async Task<CategoryDto> CreateCategoryAsync(CreateCategoryDto dto)
    {
        var category = new Category
        {
            Name = dto.Name,
            Slug = dto.Slug,
            Description = dto.Description,
            ParentId = dto.ParentId,
            ComponentType = dto.ComponentType
        };

        var created = await _categoryRepository.CreateAsync(category);
        return MapToCategoryDto(created);
    }

    #endregion

    #region Manufacturers

    public async Task<IEnumerable<ManufacturerDto>> GetManufacturersAsync()
    {
        var manufacturers = await _manufacturerRepository.GetAllAsync();
        return manufacturers.Select(MapToManufacturerDto);
    }

    public async Task<ManufacturerDto> CreateManufacturerAsync(CreateManufacturerDto dto)
    {
        var manufacturer = new Manufacturer
        {
            Name = dto.Name,
            Country = dto.Country,
            LogoUrl = dto.LogoUrl,
            Description = dto.Description
        };

        var created = await _manufacturerRepository.CreateAsync(manufacturer);
        return MapToManufacturerDto(created);
    }

    #endregion

    #region Reviews

    public async Task<ReviewDto> CreateReviewAsync(Guid productId, Guid userId, CreateReviewDto dto)
    {
        if (!await _productRepository.ExistsAsync(productId))
        {
            throw new InvalidOperationException($"Товар с ID {productId} не найден");
        }

        var review = new Review
        {
            ProductId = productId,
            UserId = userId,
            Rating = dto.Rating,
            Comment = dto.Comment,
            Pros = dto.Pros,
            Cons = dto.Cons,
            CreatedAt = DateTime.UtcNow,
            IsVerified = false // Отзыв требует модерации
        };

        var created = await _reviewRepository.CreateAsync(review);
        
        // Обновляем рейтинг товара
        await UpdateProductRatingAsync(productId);
        
        return MapToReviewDto(created);
    }

    public async Task<IEnumerable<ReviewDto>> GetProductReviewsAsync(Guid productId)
    {
        var reviews = await _reviewRepository.GetByProductIdAsync(productId);
        return reviews.Select(MapToReviewDto);
    }

    private async Task UpdateProductRatingAsync(Guid productId)
    {
        var avgRating = await _reviewRepository.GetAverageRatingAsync(productId);
        var count = await _reviewRepository.GetReviewCountAsync(productId);
        
        var product = await _productRepository.GetByIdAsync(productId);
        if (product != null)
        {
            product.Rating = avgRating;
            product.ReviewCount = count;
            await _productRepository.UpdateAsync(product);
        }
    }

    #endregion

    #region Mapping

    private static ProductListDto MapToListDto(Product product)
    {
        return new ProductListDto
        {
            Id = product.Id,
            Name = product.Name,
            Sku = product.Sku,
            Price = product.Price,
            Stock = product.Stock,
            PrimaryImageUrl = product.Images.FirstOrDefault(i => i.IsPrimary)?.Url ?? product.Images.FirstOrDefault()?.Url,
            CategoryName = product.Category?.Name ?? string.Empty,
            ManufacturerName = product.Manufacturer?.Name ?? string.Empty,
            Rating = product.Rating,
            ReviewCount = product.ReviewCount
        };
    }

    private static ProductDetailDto MapToDetailDto(Product product)
    {
        return new ProductDetailDto
        {
            Id = product.Id,
            Name = product.Name,
            Sku = product.Sku,
            Description = product.Description,
            Price = product.Price,
            Stock = product.Stock,
            WarrantyMonths = product.WarrantyMonths,
            Rating = product.Rating,
            ReviewCount = product.ReviewCount,
            Category = product.Category != null ? MapToCategoryDto(product.Category) : null!,
            Manufacturer = product.Manufacturer != null ? MapToManufacturerDto(product.Manufacturer) : null!,
            Specifications = product.Specifications,
            Images = product.Images.Select(MapToImageDto).ToList(),
            Reviews = product.Reviews.Select(MapToReviewDto).ToList()
        };
    }

    private static CategoryDto MapToCategoryDto(Category category)
    {
        return new CategoryDto
        {
            Id = category.Id,
            Name = category.Name,
            Slug = category.Slug,
            Description = category.Description,
            ParentId = category.ParentId,
            ComponentType = category.ComponentType,
            Children = category.Children?.Select(MapToCategoryDto).ToList() ?? new List<CategoryDto>()
        };
    }

    private static ManufacturerDto MapToManufacturerDto(Manufacturer manufacturer)
    {
        return new ManufacturerDto
        {
            Id = manufacturer.Id,
            Name = manufacturer.Name,
            Country = manufacturer.Country,
            LogoUrl = manufacturer.LogoUrl
        };
    }

    private static ProductImageDto MapToImageDto(ProductImage image)
    {
        return new ProductImageDto
        {
            Id = image.Id,
            Url = image.Url,
            AltText = image.AltText,
            IsPrimary = image.IsPrimary
        };
    }

    private static ReviewDto MapToReviewDto(Review review)
    {
        return new ReviewDto
        {
            Id = review.Id,
            UserId = review.UserId,
            UserName = review.UserName,
            Rating = review.Rating,
            Comment = review.Comment,
            Pros = review.Pros,
            Cons = review.Cons,
            CreatedAt = review.CreatedAt,
            IsVerified = review.IsVerified
        };
    }

    #endregion
}