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

    public async Task<IEnumerable<FilterAttributeDto>> GetFilterAttributesByCategoryAsync(string categorySlug, FilterAttributesQueryDto? filterParams = null)
    {
        var category = await _categoryRepository.GetBySlugAsync(categorySlug);
        if (category == null)
            return Array.Empty<FilterAttributeDto>();

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
                values = values.Where(v => v != null && !v.Contains('<') && !v.Contains('>')).ToList();
            }

            // PSU efficiency: исключаем обрезки вроде (230V EU)
            if (string.Equals(a.AttributeKey, "efficiency", StringComparison.OrdinalIgnoreCase))
            {
                values = values.Where(v => !SpecValueNormalizer.ShouldExcludeEfficiencyValue(v)).ToList();
            }

            // RAM: из «Тип памяти» убираем микросхемы (2Gx8) и standalone DDR3/DDR4/DDR5 (оставляем только с форм-фактором)
            if (string.Equals(categorySlug, "ram", StringComparison.OrdinalIgnoreCase) &&
                string.Equals(a.AttributeKey, "type", StringComparison.OrdinalIgnoreCase))
            {
                var excludeStandalone = new[] { "DDR3", "DDR4", "DDR5" };
                values = values.Where(v =>
                {
                    if (SpecValueNormalizer.ShouldExcludeFromRamTypeFilter(v)) return false;
                    var s = (v ?? "").Trim();
                    if (excludeStandalone.Contains(s, StringComparer.OrdinalIgnoreCase)) return false;
                    return true;
                }).ToList();
            }

            // Материнские платы memory_type: разворачиваем «DDR5, DDR4» в DDR5 и DDR4
            if (string.Equals(categorySlug, "motherboards", StringComparison.OrdinalIgnoreCase) &&
                string.Equals(a.AttributeKey, "memory_type", StringComparison.OrdinalIgnoreCase))
            {
                values = values
                    .SelectMany(v => SpecValueNormalizer.ExpandMotherboardMemoryType(v))
                    .Where(x => !string.IsNullOrEmpty(x))
                    .Distinct(StringComparer.OrdinalIgnoreCase)
                    .OrderBy(x => x)
                    .ToList();
            }
            else if (string.Equals(a.AttributeKey, "socket", StringComparison.OrdinalIgnoreCase))
            {
                values = SpecValueNormalizer.ExpandMultiValue(values).ToList();
                values = values
                    .Select(v => SpecValueNormalizer.NormalizeForDisplay(a.AttributeKey, v))
                    .Where(x => !string.IsNullOrEmpty(x))
                    .Distinct(StringComparer.OrdinalIgnoreCase)
                    .OrderBy(x => x)
                    .ToList();
            }
            else if (SpecValueNormalizer.IsNormalizedAttribute(a.AttributeKey))
            {
                var normalized = values
                    .Select(v => SpecValueNormalizer.NormalizeForDisplay(a.AttributeKey, v))
                    .Distinct()
                    .OrderBy(x => x == "Нет" ? 0 : (x == "Есть" ? 1 : 2))
                    .ThenBy(x => x)
                    .ToList();
                values = normalized;

                // Процессоры codename: Zen 3/4/5 — архитектура, не кодовое имя
                if (string.Equals(categorySlug, "processors", StringComparison.OrdinalIgnoreCase) &&
                    string.Equals(a.AttributeKey, "codename", StringComparison.OrdinalIgnoreCase))
                {
                    var excludeArchitecture = new[] { "Zen 3", "Zen 4", "Zen 5" };
                    values = values.Where(v => !excludeArchitecture.Contains(v, StringComparer.OrdinalIgnoreCase)).ToList();
                }

                // PSU efficiency: исключаем «Сертифицирован» (не стандарт 80+)
                if (string.Equals(a.AttributeKey, "efficiency", StringComparison.OrdinalIgnoreCase))
                {
                    values = values.Where(v => !string.Equals(v, "Сертифицирован", StringComparison.OrdinalIgnoreCase)).ToList();
                }

                // Storage interface: исключаем «асинхронный» (ONFi, очень старые SSD)
                if (string.Equals(categorySlug, "storage", StringComparison.OrdinalIgnoreCase) &&
                    string.Equals(a.AttributeKey, "interface", StringComparison.OrdinalIgnoreCase))
                {
                    values = values.Where(v => !(v ?? "").Trim().StartsWith("асинхронный", StringComparison.OrdinalIgnoreCase)).ToList();
                }
            }
            else if (SpecValueNormalizer.ShouldExpandMultiValue(a.AttributeKey))
            {
                // form_factor: нормализуем «до 280 мм», miniITX/mini-itx → Mini-ITX и т.п.
                if (string.Equals(a.AttributeKey, "form_factor", StringComparison.OrdinalIgnoreCase))
                {
                    values = values
                        .Select(v => SpecValueNormalizer.NormalizeFormFactorForDisplay(v))
                        .Where(x => !string.IsNullOrEmpty(x))
                        .Distinct(StringComparer.OrdinalIgnoreCase)
                        .ToList();
                }
                values = SpecValueNormalizer.ExpandMultiValue(values).ToList();
                if (string.Equals(a.AttributeKey, "form_factor", StringComparison.OrdinalIgnoreCase))
                {
                    values = values
                        .Select(v => SpecValueNormalizer.NormalizeFormFactorForDisplay(v))
                        .Where(x => !string.IsNullOrEmpty(x))
                        .Distinct(StringComparer.OrdinalIgnoreCase)
                        .OrderBy(x => x)
                        .ToList();
                    // Корпуса: исключаем размеры вида 12" x 13", 304x276 мм (серверные)
                    if (string.Equals(categorySlug, "cases", StringComparison.OrdinalIgnoreCase))
                    {
                        var opts = System.Text.RegularExpressions.RegexOptions.IgnoreCase;
                        values = values.Where(v =>
                        {
                            if (string.IsNullOrEmpty(v)) return false;
                            if (System.Text.RegularExpressions.Regex.IsMatch(v, @"^\d+[\""""]?\s*x\s*\d+", opts)) return false;
                            if (System.Text.RegularExpressions.Regex.IsMatch(v, @"^\d+x\d+\s*мм", opts)) return false;
                            return true;
                        }).ToList();
                    }
                }
            }
            else
            {
                // Глобально: исключаем сырые true/false для «сырых» атрибутов (не нормализуемых)
                values = values.Where(v =>
                {
                    var lower = (v ?? "").Trim().ToLowerInvariant();
                    return lower != "true" && lower != "false";
                }).ToList();

                // Monitors type: исключаем яркость (200 кд/м²), smart, для камер видеонаблюдения
                if (string.Equals(categorySlug, "monitors", StringComparison.OrdinalIgnoreCase) &&
                    string.Equals(a.AttributeKey, "type", StringComparison.OrdinalIgnoreCase))
                {
                    var excludeMonitorType = new[] { "smart", "для камер видеонаблюдения" };
                    values = values.Where(v =>
                    {
                        var s = (v ?? "").Trim();
                        if (System.Text.RegularExpressions.Regex.IsMatch(s, @"^\d+\s*кд\s*/\s*м[2²]", System.Text.RegularExpressions.RegexOptions.IgnoreCase))
                            return false;
                        if (excludeMonitorType.Contains(s, StringComparer.OrdinalIgnoreCase))
                            return false;
                        return true;
                    }).ToList();
                }
                // Mice type: исключаем питание (AA, AA/AAA, Li-pol, Li-ion) и слишком длинные значения
                if (string.Equals(categorySlug, "mice", StringComparison.OrdinalIgnoreCase) &&
                    string.Equals(a.AttributeKey, "type", StringComparison.OrdinalIgnoreCase))
                {
                    var opts = System.Text.RegularExpressions.RegexOptions.IgnoreCase;
                    values = values.Where(v =>
                    {
                        if (v != null && v.Length > 60) return false;
                        return !System.Text.RegularExpressions.Regex.IsMatch(v ?? "", @"^\d+\s*x\s*AA", opts) &&
                            !System.Text.RegularExpressions.Regex.IsMatch(v ?? "", @"^AA\b", opts) &&
                            !System.Text.RegularExpressions.Regex.IsMatch(v ?? "", @"^AA/AAA$", opts) &&
                            !System.Text.RegularExpressions.Regex.IsMatch(v ?? "", @"^(Li-pol|Li-ion|Bluetooth)$", opts);
                    }).ToList();
                }
                // Coolers type: исключаем типы коннекторов (2 pin, Molex, ARGB и т.п.)
                if (string.Equals(categorySlug, "coolers", StringComparison.OrdinalIgnoreCase) &&
                    string.Equals(a.AttributeKey, "type", StringComparison.OrdinalIgnoreCase))
                {
                    var opts = System.Text.RegularExpressions.RegexOptions.IgnoreCase;
                    values = values.Where(v =>
                    {
                        var s = v ?? "";
                        if (System.Text.RegularExpressions.Regex.IsMatch(s, @"^\d+[-]?\s*pin", opts)) return false;
                        if (System.Text.RegularExpressions.Regex.IsMatch(s, @"pin\s*\+\s*", opts)) return false;
                        if (s.Contains("Molex", StringComparison.OrdinalIgnoreCase)) return false;
                        if (s.Contains("Power SATA", StringComparison.OrdinalIgnoreCase)) return false;
                        if (System.Text.RegularExpressions.Regex.IsMatch(s, @"USB\s*\d*-pin", opts)) return false;
                        if (s.Contains("ARGB", StringComparison.OrdinalIgnoreCase)) return false;
                        if (System.Text.RegularExpressions.Regex.IsMatch(s, @"RGB\s*\d*V", opts)) return false;
                        if (s.Contains("термопаста", StringComparison.OrdinalIgnoreCase)) return false;
                        return true;
                    }).ToList();
                }
                // Keyboards type: исключаем переключатели, питание, назначение — оставляем только типоразмер
                if (string.Equals(categorySlug, "keyboards", StringComparison.OrdinalIgnoreCase) &&
                    string.Equals(a.AttributeKey, "type", StringComparison.OrdinalIgnoreCase))
                {
                    var excludePatterns = new[] { "Kailh", "Outemu", "Razer", "Gateron", "Cherry", "Bloody", "Light Strike", "Content Slim", "Logitech GX" };
                    var excludeExact = new[] { "2 x AAA", "AA", "AAA", "игровая", "игровая механико-оптическая", "офисная", "мультимедийная", "компактная", "полноразмерная", "стандартная" };
                    values = values.Where(v =>
                    {
                        var s = (v ?? "").Trim();
                        if (excludeExact.Contains(s, StringComparer.OrdinalIgnoreCase)) return false;
                        if (excludePatterns.Any(p => s.Contains(p, StringComparison.OrdinalIgnoreCase))) return false;
                        return true;
                    }).ToList();
                }
                // Убираем переносы строк и лишние пробелы в сырых значениях
                values = values
                    .Select(v => SpecValueNormalizer.CollapseWhitespace(v))
                    .Where(v => !string.IsNullOrEmpty(v))
                    .Distinct(StringComparer.OrdinalIgnoreCase)
                    .OrderBy(v => v)
                    .ToList();
            }

            // Не отдаём select-атрибуты с пустым списком значений (например sensor_type для mice)
            if (a.FilterType == FilterAttributeType.Select && !values.Any())
                continue;

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

    private const int DescriptionShortMaxLength = 300;

    private static ProductListDto MapToListDto(Product product)
    {
        var descShort = !string.IsNullOrEmpty(product.Description)
            ? (product.Description.Length > DescriptionShortMaxLength
                ? product.Description[..DescriptionShortMaxLength].TrimEnd() + "…"
                : product.Description)
            : null;

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
            Logo = !string.IsNullOrEmpty(manufacturer.LogoPath) ? manufacturer.LogoPath : manufacturer.LogoUrl,
            Description = manufacturer.Description
        };
    }

    private static ProductImageDto MapToImageDto(ProductImage image)
    {
        return new ProductImageDto
        {
            Id = image.Id,
            Url = !string.IsNullOrEmpty(image.Path) ? image.Path : image.Url,
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