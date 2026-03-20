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
        
        var totalPages = (int)Math.Ceiling(result.TotalCount / (double)result.PageSize);
        
        return new PagedResult<ProductListDto>
        {
            Data = result.Items.Select(MapToListDto).ToList(),
            Meta = new PaginationMeta
            {
                Page = result.Page,
                PageSize = result.PageSize,
                TotalPages = totalPages,
                TotalItems = result.TotalCount,
                HasNextPage = result.Page < totalPages,
                HasPrevPage = result.Page > 1
            }
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

        // Определяем CategoryId: либо передан напрямую, либо ищем по slug/названию
        Guid categoryId;
        if (dto.CategoryId.HasValue)
        {
            categoryId = dto.CategoryId.Value;
        }
        else if (!string.IsNullOrEmpty(dto.Category))
        {
            var category = await _categoryRepository.GetBySlugAsync(dto.Category);
            if (category == null)
            {
                // Пробуем найти по названию
                var allCategories = await _categoryRepository.GetAllAsync();
                category = allCategories.FirstOrDefault(c => 
                    c.Name.Equals(dto.Category, StringComparison.OrdinalIgnoreCase));
            }
            if (category == null)
            {
                throw new InvalidOperationException($"Категория '{dto.Category}' не найдена");
            }
            categoryId = category.Id;
        }
        else
        {
            throw new InvalidOperationException("Необходимо указать CategoryId или Category");
        }

        var product = new Product
        {
            Name = dto.Name,
            Sku = dto.Sku,
            Description = dto.Description,
            CategoryId = categoryId,
            ManufacturerId = dto.ManufacturerId,
            Price = dto.Price,
            Stock = dto.Stock,
            WarrantyMonths = dto.WarrantyMonths,
            Specifications = dto.Specifications,
            IsActive = dto.IsActive,
            IsFeatured = dto.IsFeatured
        };

        var created = await _productRepository.CreateAsync(product);
        return (await GetProductByIdAsync(created.Id))!;
    }

    public async Task<ProductDetailDto?> UpdateProductAsync(Guid id, UpdateProductDto dto)
    {
        var product = await _productRepository.GetByIdAsync(id);
        if (product == null) return null;

        if (dto.Name != null)
            product.Name = dto.Name;
        if (dto.Description != null)
            product.Description = dto.Description;
        if (dto.Price.HasValue)
            product.Price = dto.Price.Value;
        if (dto.Stock.HasValue)
            product.Stock = dto.Stock.Value;
        if (dto.WarrantyMonths.HasValue)
            product.WarrantyMonths = dto.WarrantyMonths.Value;
        if (dto.Specifications != null)
            product.Specifications = dto.Specifications;
        if (dto.IsActive.HasValue)
            product.IsActive = dto.IsActive.Value;
        if (dto.IsFeatured.HasValue)
            product.IsFeatured = dto.IsFeatured.Value;
        if (dto.ManufacturerId.HasValue)
            product.ManufacturerId = dto.ManufacturerId;
        if (dto.OldPrice.HasValue)
            product.OldPrice = dto.OldPrice;

        product.UpdatedAt = DateTime.UtcNow;

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
        var counts = await _productRepository.GetProductCountsByCategoryAsync();
        return categories.Select(c => MapToCategoryDto(c, counts.GetValueOrDefault(c.Id, 0)));
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

    public async Task<IEnumerable<ManufacturerDto>> GetManufacturersByCategoryAsync(string categorySlug)
    {
        // Получаем категорию по slug
        var category = await _categoryRepository.GetBySlugAsync(categorySlug);
        if (category == null)
        {
            return Enumerable.Empty<ManufacturerDto>();
        }

        // Получаем производителей, у которых есть товары в этой категории
        var products = await _productRepository.GetByCategoryAsync(category.Id);
        var manufacturerIds = products
            .Where(p => p.ManufacturerId.HasValue)
            .Select(p => p.ManufacturerId!.Value)
            .Distinct();

        var manufacturers = await _manufacturerRepository.GetAllAsync();
        return manufacturers
            .Where(m => manufacturerIds.Contains(m.Id))
            .Select(MapToManufacturerDto);
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
            Category = product.Category?.Name ?? string.Empty,
            Price = product.Price,
            OldPrice = product.OldPrice,
            Stock = product.Stock,
            Manufacturer = product.Manufacturer != null ? MapToManufacturerDto(product.Manufacturer) : null,
            MainImage = product.Images.Where(i => i.IsPrimary).Select(MapToImageDto).FirstOrDefault()
                ?? product.Images.Select(MapToImageDto).FirstOrDefault(),
            Rating = product.Rating > 0 ? new RatingDto { Average = product.Rating, Count = product.ReviewCount } : null,
            IsActive = product.IsActive
        };
    }

    private static ProductDetailDto MapToDetailDto(Product product)
    {
        return new ProductDetailDto
        {
            Id = product.Id,
            Name = product.Name,
            Sku = product.Sku,
            Category = product.Category?.Name ?? string.Empty,
            ManufacturerId = product.ManufacturerId,
            Manufacturer = product.Manufacturer != null ? MapToManufacturerDto(product.Manufacturer) : null,
            Price = product.Price,
            OldPrice = product.OldPrice,
            Stock = product.Stock,
            WarrantyMonths = product.WarrantyMonths,
            Description = product.Description,
            Specifications = product.Specifications,
            Images = product.Images.Select(MapToImageDto).ToList(),
            Rating = product.Rating > 0 ? new RatingDto { Average = product.Rating, Count = product.ReviewCount } : null,
            IsActive = product.IsActive,
            IsFeatured = product.IsFeatured,
            CreatedAt = product.CreatedAt,
            UpdatedAt = product.UpdatedAt
        };
    }

    private static CategoryDto MapToCategoryDto(Category category, int productCount = 0)
    {
        return new CategoryDto
        {
            Id = category.Id,
            Name = category.Name,
            Slug = category.Slug,
            Description = category.Description,
            ParentId = category.ParentId,
            Icon = category.Icon,
            Order = category.Order,
            ProductCount = productCount,
            Children = category.Children?.Select(c => MapToCategoryDto(c)).ToList() ?? new List<CategoryDto>()
        };
    }

    private static ManufacturerDto MapToManufacturerDto(Manufacturer manufacturer)
    {
        return new ManufacturerDto
        {
            Id = manufacturer.Id,
            Name = manufacturer.Name,
            Country = manufacturer.Country,
            Logo = manufacturer.LogoUrl,
            Description = manufacturer.Description
        };
    }

    private static ProductImageDto MapToImageDto(ProductImage image)
    {
        return new ProductImageDto
        {
            Id = image.Id,
            Url = image.Url,
            Alt = image.AltText,
            IsMain = image.IsPrimary,
            Order = image.SortOrder
        };
    }

    private static ReviewDto MapToReviewDto(Review review)
    {
        return new ReviewDto
        {
            Id = review.Id,
            ProductId = review.ProductId,
            UserId = review.UserId,
            UserName = review.UserName,
            Rating = review.Rating,
            Title = review.Title,
            Comment = review.Comment,
            Pros = review.Pros,
            Cons = review.Cons,
            IsVerified = review.IsVerified,
            IsApproved = review.IsApproved,
            Helpful = review.Helpful,
            CreatedAt = review.CreatedAt
        };
    }

    #endregion
}