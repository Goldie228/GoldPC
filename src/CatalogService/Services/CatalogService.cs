using System.Text.Json;
using System.Text.RegularExpressions;
using CatalogService.Models;
using CatalogService.Repositories.Interfaces;
using CatalogService.Services.Interfaces;
using GoldPC.SharedKernel.DTOs;
using GoldPC.SharedKernel.Utilities;
using Microsoft.Extensions.Caching.Distributed;

namespace CatalogService.Services;

/// <summary>
/// Реализация сервиса каталога
/// </summary>
#pragma warning disable CA1724 // Имя совпадает с пространством имён CatalogService — публичный контракт ICatalogService
public class CatalogService : ICatalogService
{
    private readonly IProductRepository _productRepository;
    private readonly ICategoryRepository _categoryRepository;
    private readonly IManufacturerRepository _manufacturerRepository;
    private readonly IReviewRepository _reviewRepository;
    private readonly ILogger<CatalogService> _logger;
    private readonly IDistributedCache _cache;

    public CatalogService(
        IProductRepository productRepository,
        ICategoryRepository categoryRepository,
        IManufacturerRepository manufacturerRepository,
        IReviewRepository reviewRepository,
        ILogger<CatalogService> logger,
        IDistributedCache cache)
    {
        _productRepository = productRepository;
        _categoryRepository = categoryRepository;
        _manufacturerRepository = manufacturerRepository;
        _reviewRepository = reviewRepository;
        _logger = logger;
        _cache = cache;
    }

    public async Task<PagedResult<ProductListDto>> GetProductsAsync(ProductFilterDto filter)
    {
        // Cache featured products on page 1
        bool isFeaturedPage1 = filter is { IsFeatured: true, Page: 1, PageSize: 20, Category: null, Search: null };
        string? cacheKey = isFeaturedPage1 ? "featured_products_p1" : null;

        if (cacheKey != null)
        {
            var cached = await _cache.GetStringAsync(cacheKey);
            if (!string.IsNullOrEmpty(cached))
            {
                _logger.LogInformation("Returning cached featured products.");
                return JsonSerializer.Deserialize<PagedResult<ProductListDto>>(cached)!;
            }
        }

        var result = await _productRepository.GetFilteredAsync(filter);
        
        var totalPages = (int)Math.Ceiling(result.TotalCount / (double)result.PageSize);
        
        var pagedResult = new PagedResult<ProductListDto>
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

        if (cacheKey != null)
        {
            await _cache.SetStringAsync(cacheKey, JsonSerializer.Serialize(pagedResult), new DistributedCacheEntryOptions
            {
                AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(15)
            });
        }

        return pagedResult;
    }

    public async Task<ProductDetailDto?> GetProductByIdAsync(Guid id)
    {
        var product = await _productRepository.GetDetailByIdAsync(id);
        return product != null ? MapToDetailDto(product) : null;
    }

    public async Task<ProductDetailDto?> GetProductBySlugAsync(string slug)
    {
        var normalized = slug?.Trim() ?? string.Empty;
        if (string.IsNullOrEmpty(normalized))
        {
            return null;
        }

        var product = await _productRepository.GetDetailBySlugAsync(normalized);
        return product != null ? MapToDetailDto(product) : null;
    }

    public async Task<ProductDetailDto?> GetProductBySkuAsync(string sku)
    {
        var normalizedInput = sku?.Trim() ?? string.Empty;
        if (string.IsNullOrEmpty(normalizedInput))
        {
            return null;
        }

        var product = await _productRepository.GetBySkuAsync(normalizedInput);
        if (product == null)
        {
            return null;
        }
        
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

        var productSlug = await EnsureUniqueProductSlugAsync(dto.Slug, dto.Name);

        var product = new Product
        {
            Name = dto.Name,
            Sku = dto.Sku,
            Slug = productSlug,
            Description = dto.Description,
            CategoryId = categoryId,
            ManufacturerId = dto.ManufacturerId,
            Price = dto.Price,
            Stock = dto.Stock,
            WarrantyMonths = dto.WarrantyMonths,
            IsActive = dto.IsActive,
            IsFeatured = dto.IsFeatured
        };

        var created = await _productRepository.CreateAsync(product);
        if (dto.Specifications != null && dto.Specifications.Count > 0)
            await _productRepository.SetSpecificationsAsync(created.Id, dto.Specifications);
        return (await GetProductByIdAsync(created.Id))!;
    }

    public async Task<ProductDetailDto?> UpdateProductAsync(Guid id, UpdateProductDto dto)
    {
        var product = await _productRepository.GetByIdAsync(id);
        if (product == null) return null;

        if (dto.Name != null)
            product.Name = dto.Name;
        if (dto.Slug != null)
        {
            product.Slug = await EnsureUniqueProductSlugAsync(dto.Slug, dto.Name ?? product.Name, product.Id);
        }
        if (dto.Description != null)
            product.Description = dto.Description;
        if (dto.Price.HasValue)
            product.Price = dto.Price.Value;
        if (dto.Stock.HasValue)
            product.Stock = dto.Stock.Value;
        if (dto.WarrantyMonths.HasValue)
            product.WarrantyMonths = dto.WarrantyMonths.Value;
        if (dto.Specifications != null)
            await _productRepository.SetSpecificationsAsync(id, dto.Specifications);
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

    public async Task<IEnumerable<CategoryDto>> GetCategoriesAsync()
    {
        var cacheKey = "all_categories";
        var cachedCategories = await _cache.GetStringAsync(cacheKey);

        if (!string.IsNullOrEmpty(cachedCategories))
        {
            var cached = JsonSerializer.Deserialize<IEnumerable<CategoryDto>>(cachedCategories)?.ToList()
                ?? new List<CategoryDto>();

            // Самовосстановление после "битого" кэша:
            // ранее могли закешироваться нулевые productCount, когда изображения ещё не были заполнены.
            if (cached.Any() && cached.Any(c => c.ProductCount > 0))
            {
                _logger.LogInformation("Returning cached categories.");
                return cached;
            }

            _logger.LogWarning("Categories cache is stale (all productCount are zero), rebuilding.");
        }

        var categories = await _categoryRepository.GetAllAsync();
        var counts = await _productRepository.GetProductCountsByCategoryAsync();
        var result = categories.Select(c => MapToCategoryDto(c, counts.GetValueOrDefault(c.Id, 0)));

        var cacheOptions = new DistributedCacheEntryOptions
        {
            AbsoluteExpirationRelativeToNow = TimeSpan.FromHours(1)
        };

        await _cache.SetStringAsync(cacheKey, JsonSerializer.Serialize(result), cacheOptions);

        return result;
    }

    public async Task<CategoryDto?> GetCategoryBySlugAsync(string slug)
    {
        var category = await _categoryRepository.GetBySlugAsync(slug);
        return category != null ? MapToCategoryDto(category) : null;
    }

    public async Task<IEnumerable<FilterAttributeDto>> GetFilterAttributesByCategoryAsync(string categorySlug, FilterAttributesQueryDto? filterParams = null)
    {
        var category = await _categoryRepository.GetBySlugAsync(categorySlug);
        if (category == null)
        {
            return Array.Empty<FilterAttributeDto>();
        }

        var attributes = await _categoryRepository.GetFilterAttributesByCategorySlugAsync(categorySlug);
        var selectKeys = attributes.Where(a => a.FilterType == FilterAttributeType.Select).Select(a => a.AttributeKey).ToList();

        var filterContext = filterParams != null
            ? new ProductFilterDto
            {
                ManufacturerIds = filterParams.ManufacturerIds,
                Specifications = filterParams.Specifications,
                SpecificationRanges = filterParams.SpecificationRanges
            }
            : null;

        var distinctValues = selectKeys.Count > 0
            ? await _productRepository.GetDistinctSpecificationValuesAsync(category.Id, selectKeys, filterContext)
            : new Dictionary<string, List<string>>();

        var result = new List<FilterAttributeDto>();
        foreach (var a in attributes)
        {
            decimal? minVal = null, maxVal = null;
            if (a.FilterType == FilterAttributeType.Range)
            {
                (minVal, maxVal) = await _productRepository.GetSpecificationRangeAsync(category.Id, a.AttributeKey, filterContext);
            }

            var values = distinctValues.GetValueOrDefault(a.AttributeKey, new List<string>());

            // Глобально: исключаем значения с HTML-мусором (<, >) для всех select
            if (a.FilterType == FilterAttributeType.Select)
            {
                values = values.Where(v => v != null && !v.Contains('<', StringComparison.Ordinal) && !v.Contains('>', StringComparison.Ordinal)).ToList();
            }

            // PSU efficiency: исключаем обрезки вроде (230V EU)
            if (string.Equals(a.AttributeKey, "efficiency", StringComparison.OrdinalIgnoreCase))
            {
                values = values.Where(v => string.IsNullOrEmpty(v) || (!v.Contains("(230V", StringComparison.OrdinalIgnoreCase) && !v.Contains("(115V", StringComparison.OrdinalIgnoreCase))).ToList();
            }

            // Значения из canonical — уже нормализованы. Минимальная постобработка.
            values = values
                .Select(v => string.IsNullOrEmpty(v) ? null : v.Replace("\n", " ", StringComparison.Ordinal).Replace("\r", string.Empty, StringComparison.Ordinal).Trim())
                .Select(v => NormalizeBooleanDisplay(v))
                .Where(v => !string.IsNullOrEmpty(v))
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .OrderBy(BooleanDisplaySortKey)
                .ThenBy(v => v)
                .ToList();

            // Не отдаём select-атрибуты с пустым списком значений (например sensor_type для mice)
            if (a.FilterType == FilterAttributeType.Select && !values.Any())
            {
                continue;
            }

            result.Add(new FilterAttributeDto
            {
                Key = a.AttributeKey,
                DisplayName = a.DisplayName,
                FilterType = a.FilterType == FilterAttributeType.Range ? "range" : "select",
                SortOrder = a.SortOrder,
                Values = values,
                MinValue = minVal,
                MaxValue = maxVal
            });
        }
        return result;
    }

    public async Task<IEnumerable<FilterFacetAttributeDto>> GetFilterFacetsByCategoryAsync(string categorySlug, FilterAttributesQueryDto? filterParams = null)
    {
        var category = await _categoryRepository.GetBySlugAsync(categorySlug);
        if (category == null)
        {
            return Array.Empty<FilterFacetAttributeDto>();
        }

        var attributes = await _categoryRepository.GetFilterAttributesByCategorySlugAsync(categorySlug);

        var filterContext = filterParams != null
            ? new ProductFilterDto
            {
                ManufacturerIds = filterParams.ManufacturerIds,
                Specifications = filterParams.Specifications,
                SpecificationRanges = filterParams.SpecificationRanges
            }
            : null;

        var result = new List<FilterFacetAttributeDto>();

        foreach (var a in attributes)
        {
            if (a.FilterType == FilterAttributeType.Range)
            {
                var (minVal, maxVal) = await _productRepository.GetSpecificationRangeAsync(category.Id, a.AttributeKey, filterContext);
                if (minVal == null && maxVal == null)
                {
                    continue;
                }

                // Конвертация videopamyat из МБ (базовая единица) в ГБ для UI
                if (a.AttributeKey.Equals("videopamyat", StringComparison.OrdinalIgnoreCase))
                {
                    minVal = minVal.HasValue ? minVal.Value / 1024m : null;
                    maxVal = maxVal.HasValue ? maxVal.Value / 1024m : null;
                }

                result.Add(new FilterFacetAttributeDto
                {
                    Key = a.AttributeKey,
                    DisplayName = a.DisplayName,
                    FilterType = "range",
                    SortOrder = a.SortOrder,
                    MinValue = minVal,
                    MaxValue = maxVal
                });

                continue;
            }

            // select: full list for category + counts in current context (excluding self)
            var allValuesDict = await _productRepository.GetDistinctSpecificationValuesAsync(category.Id, new[] { a.AttributeKey }, null);
            var allValues = allValuesDict.GetValueOrDefault(a.AttributeKey, new List<string>());

            // Post-processing same as v1
            allValues = allValues
                .Where(v => v != null && !v.Contains('<', StringComparison.Ordinal) && !v.Contains('>', StringComparison.Ordinal))
                .Select(v => string.IsNullOrEmpty(v) ? null : v.Replace("\n", " ", StringComparison.Ordinal).Replace("\r", string.Empty, StringComparison.Ordinal).Trim())
                .Select(v => NormalizeBooleanDisplay(v))
                .Where(v => !string.IsNullOrEmpty(v))
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .OrderBy(BooleanDisplaySortKey)
                .ThenBy(v => v)
                .ToList()!;

            if (allValues.Count == 0)
            {
                continue;
            }

            var rawCounts = await _productRepository.GetSpecificationValueCountsAsync(category.Id, a.AttributeKey, filterContext);
            var counts = rawCounts
                .GroupBy(kv => NormalizeBooleanDisplay(kv.Key) ?? kv.Key, StringComparer.OrdinalIgnoreCase)
                .ToDictionary(g => g.Key, g => g.Sum(x => x.Value), StringComparer.OrdinalIgnoreCase);

            var options = allValues.Select(v => new FilterFacetOptionDto
            {
                Value = v!,
                Count = counts.GetValueOrDefault(v!, 0)
            }).ToList();

            result.Add(new FilterFacetAttributeDto
            {
                Key = a.AttributeKey,
                DisplayName = a.DisplayName,
                FilterType = "select",
                SortOrder = a.SortOrder,
                Options = options
            });
        }

        return result;
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

        // Получаем производителей, у которых есть товары в этой категории (включая без фото)
        var manufacturerIds = (await _productRepository.GetManufacturerIdsByCategoryAsync(category.Id)).ToHashSet();
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

    public async Task<ReviewDto> CreateReviewAsync(Guid productId, Guid userId, CreateReviewDto dto)
    {
        if (!await _productRepository.ExistsAsync(productId))
        {
            throw new InvalidOperationException($"Товар с ID {productId} не найден");
        }

        if (dto.Rating < 1 || dto.Rating > 5)
        {
            throw new InvalidOperationException("Рейтинг должен быть в диапазоне от 1 до 5");
        }

        var hasReview = await _reviewRepository.ExistsByUserAndProductAsync(userId, productId);
        if (hasReview)
        {
            throw new InvalidOperationException("Вы уже оставляли отзыв для этого товара");
        }

        var review = new Review
        {
            ProductId = productId,
            UserId = userId,
            UserName = "Покупатель",
            Rating = dto.Rating,
            Title = StringSanitizer.SanitizeText(dto.Title),
            Comment = StringSanitizer.SanitizeText(dto.Comment),
            Pros = StringSanitizer.SanitizeText(dto.Pros),
            Cons = StringSanitizer.SanitizeText(dto.Cons),
            CreatedAt = DateTime.UtcNow,
            IsVerified = true,
            IsApproved = true
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

    public async Task<(bool Success, string? Error)> ReserveStockAsync(IEnumerable<(Guid ProductId, int Quantity)> items)
    {
        using var transaction = await _productRepository.BeginTransactionAsync();
#pragma warning disable CA1031
        try
        {
            foreach (var item in items)
            {
                var product = await _productRepository.GetByIdAsync(item.ProductId);
                if (product == null)
                {
                    await transaction.RollbackAsync();
                    return (false, $"Товар с ID {item.ProductId} не найден");
                }

                if (product.Stock < item.Quantity)
                {
                    await transaction.RollbackAsync();
                    return (false, $"Недостаточно товара '{product.Name}' на складе (доступно: {product.Stock}, требуется: {item.Quantity})");
                }

                await _productRepository.UpdateStockAsync(item.ProductId, -item.Quantity);
            }

            await transaction.CommitAsync();
            return (true, null);
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            _logger.LogError(ex, "Ошибка при резервировании товара");
            return (false, "Внутренняя ошибка при резервировании товара");
        }
#pragma warning restore CA1031
    }

    public async Task<(bool Success, string? Error)> ReleaseStockAsync(IEnumerable<(Guid ProductId, int Quantity)> items)
    {
        using var transaction = await _productRepository.BeginTransactionAsync();
#pragma warning disable CA1031
        try
        {
            foreach (var item in items)
            {
                await _productRepository.UpdateStockAsync(item.ProductId, item.Quantity);
            }

            await transaction.CommitAsync();
            return (true, null);
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            _logger.LogError(ex, "Ошибка при возврате товара на склад");
            return (false, "Внутренняя ошибка при возврате товара на склад");
        }
#pragma warning restore CA1031
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

    private const int DescriptionShortMaxLength = 300;

    private static string BuildSlug(string? raw, string fallback)
    {
        var source = string.IsNullOrWhiteSpace(raw) ? fallback : raw;
#pragma warning disable CA1308 // Slug для URL в нижнем регистре
        var slug = Regex.Replace(source.ToLowerInvariant(), @"[^a-z0-9]+", "_");
#pragma warning restore CA1308
        slug = Regex.Replace(slug, @"_+", "_").Trim('_');
        return string.IsNullOrWhiteSpace(slug) ? $"product_{Guid.NewGuid():N}" : slug;
    }

    private async Task<string> EnsureUniqueProductSlugAsync(string? requestedSlug, string fallbackName, Guid? excludeId = null)
    {
        var baseSlug = BuildSlug(requestedSlug, fallbackName);
        var slug = baseSlug;
        var i = 2;
        while (await _productRepository.SlugExistsAsync(slug, excludeId))
        {
            slug = $"{baseSlug}_{i}";
            i++;
        }
        return slug;
    }

    /// <summary>Картинка для витрины — только после выгрузки на наш сервер (поле Path).</summary>
    private static bool HasLocallyStoredImage(ProductImage image) =>
        !string.IsNullOrWhiteSpace(image.Path);

    private static ProductListDto MapToListDto(Product product)
    {
        string? descShort = null;
        if (!string.IsNullOrEmpty(product.Description))
        {
            descShort = product.Description.Length > DescriptionShortMaxLength
                ? product.Description[..DescriptionShortMaxLength].TrimEnd() + "…"
                : product.Description;
        }

        return new ProductListDto
        {
            Id = product.Id,
            Name = product.Name,
            Sku = product.Sku,
            Slug = product.Slug,
            Category = product.Category?.Name ?? string.Empty,
            Price = product.Price,
            OldPrice = product.OldPrice,
            Stock = product.Stock,
            Manufacturer = product.Manufacturer != null ? MapToManufacturerDto(product.Manufacturer) : null,
            MainImage = product.Images
                .Where(i => HasLocallyStoredImage(i) && i.IsPrimary)
                .Select(MapToImageDto)
                .FirstOrDefault()
                ?? product.Images
                    .Where(HasLocallyStoredImage)
                    .Select(MapToImageDto)
                    .FirstOrDefault(),
            Rating = product.Rating > 0 ? new RatingDto { Average = product.Rating, Count = product.ReviewCount } : null,
            IsActive = product.IsActive,
            DescriptionShort = descShort
        };
    }

    private static ProductDetailDto MapToDetailDto(Product product)
    {
        return new ProductDetailDto
        {
            Id = product.Id,
            Name = product.Name,
            Sku = product.Sku,
            Slug = product.Slug,
            Category = product.Category?.Name ?? string.Empty,
            ManufacturerId = product.ManufacturerId,
            Manufacturer = product.Manufacturer != null ? MapToManufacturerDto(product.Manufacturer) : null,
            Price = product.Price,
            OldPrice = product.OldPrice,
            Stock = product.Stock,
            WarrantyMonths = product.WarrantyMonths,
            Description = product.Description,
            ManufacturerAddress = product.ManufacturerAddress,
            ProductionAddress = product.ProductionAddress,
            Importer = product.Importer,
            ServiceSupport = product.ServiceSupport,
            Specifications = product.SpecificationValues.ToSpecificationsDict(),
            MainImage = product.Images
                .Where(i => HasLocallyStoredImage(i) && i.IsPrimary)
                .Select(MapToImageDto)
                .FirstOrDefault()
                ?? product.Images
                    .Where(HasLocallyStoredImage)
                    .Select(MapToImageDto)
                    .FirstOrDefault(),
            Images = product.Images
                .Where(HasLocallyStoredImage)
                .Select(MapToImageDto)
                .ToList(),
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
            Logo = manufacturer.LogoPath,
            Description = manufacturer.Description
        };
    }

    private static ProductImageDto MapToImageDto(ProductImage image)
    {
        // Клиенту отдаём только локальный путь (/uploads/...). URL источника (x-core) в API не экспонируем.
        return new ProductImageDto
        {
            Id = image.Id,
            Url = image.Path ?? string.Empty,
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

    private static string? NormalizeBooleanDisplay(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return value;
        }

        var t = value.Trim();
        if (string.Equals(t, "true", StringComparison.OrdinalIgnoreCase) || t == "1" || string.Equals(t, "yes", StringComparison.OrdinalIgnoreCase))
        {
            return "Да";
        }

        if (string.Equals(t, "false", StringComparison.OrdinalIgnoreCase) || t == "0" || string.Equals(t, "no", StringComparison.OrdinalIgnoreCase))
        {
            return "Нет";
        }

        return value;
    }

    private static int BooleanDisplaySortKey(string? v)
    {
        if (v == "Нет")
        {
            return 0;
        }

        if (v == "Есть")
        {
            return 1;
        }

        return 2;
    }
#pragma warning restore CA1724
}