using System.Security.Claims;
using CatalogService.Services.Interfaces;
using GoldPC.SharedKernel.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CatalogService.Controllers;

/// <summary>
/// Контроллер для работы с каталогом товаров
/// </summary>
[ApiController]
[Route("api/v1/catalog")]
public class CatalogController : ControllerBase
{
    private readonly ICatalogService _catalogService;
    private readonly ILogger<CatalogController> _logger;

    public CatalogController(ICatalogService catalogService, ILogger<CatalogController> logger)
    {
        _catalogService = catalogService;
        _logger = logger;
    }

    /// <summary>
    /// Получить список товаров с фильтрацией и пагинацией
    /// </summary>
    [HttpGet("products")]
    [ProducesResponseType(typeof(PagedResult<ProductListDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<PagedResult<ProductListDto>>> GetProducts([FromQuery] ProductFilterDto filter)
    {
        var result = await _catalogService.GetProductsAsync(filter);
        return Ok(result);
    }

    /// <summary>
    /// Получить товар по ID
    /// </summary>
    [HttpGet("products/{productId:guid}")]
    [ProducesResponseType(typeof(ProductDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ProductDetailDto>> GetProduct(Guid productId)
    {
        var product = await _catalogService.GetProductByIdAsync(productId);
        if (product == null)
        {
            return NotFound(new { error = "Товар не найден", productId });
        }
        return Ok(product);
    }

    /// <summary>
    /// Получить товар по slug
    /// </summary>
    [HttpGet("products/by-slug/{slug}")]
    [ProducesResponseType(typeof(ProductDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ProductDetailDto>> GetProductBySlug(string slug)
    {
        var product = await _catalogService.GetProductBySlugAsync(slug);
        if (product == null)
        {
            return NotFound(new { error = "Товар не найден", slug });
        }
        return Ok(product);
    }

    /// <summary>
    /// Получить отзывы о товаре
    /// </summary>
    [HttpGet("products/{productId:guid}/reviews")]
    [ProducesResponseType(typeof(PagedResult<ReviewDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<PagedResult<ReviewDto>>> GetProductReviews(
        Guid productId,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var reviews = await _catalogService.GetProductReviewsAsync(productId);
        
        var pagedResult = new PagedResult<ReviewDto>
        {
            Data = reviews.Skip((page - 1) * pageSize).Take(pageSize).ToList(),
            Meta = new PaginationMeta
            {
                Page = page,
                PageSize = pageSize,
                TotalItems = reviews.Count(),
                TotalPages = (int)Math.Ceiling(reviews.Count() / (double)pageSize),
                HasNextPage = reviews.Count() > page * pageSize,
                HasPrevPage = page > 1
            }
        };
        
        return Ok(pagedResult);
    }

    /// <summary>
    /// Добавить отзыв к товару
    /// </summary>
    [HttpPost("products/{productId:guid}/reviews")]
    [Authorize]
    [ProducesResponseType(typeof(ReviewDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ReviewDto>> AddReview(Guid productId, [FromBody] CreateReviewDto dto)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("sub")?.Value;
        if (userIdClaim == null || !Guid.TryParse(userIdClaim, out var userId))
        {
            return Unauthorized(new { error = "Пользователь не авторизован" });
        }
        
        try
        {
            var review = await _catalogService.CreateReviewAsync(productId, userId, dto);
            return CreatedAtAction(nameof(GetProductReviews), new { productId }, review);
        }
        catch (InvalidOperationException ex)
        {
            if (ex.Message.Contains("не найден", StringComparison.OrdinalIgnoreCase))
            {
                return NotFound(new { error = ex.Message });
            }
            return BadRequest(new { error = ex.Message });
        }
    }

    /// <summary>
    /// Обновить отзыв
    /// </summary>
    [HttpPut("products/{productId:guid}/reviews/{reviewId:guid}")]
    [Authorize]
    [ProducesResponseType(typeof(ReviewDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<ReviewDto>> UpdateReview(Guid productId, Guid reviewId, [FromBody] UpdateReviewDto dto)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("sub")?.Value;
        if (userIdClaim == null || !Guid.TryParse(userIdClaim, out var userId))
        {
            return Unauthorized(new { error = "Пользователь не авторизован" });
        }

        try
        {
            var review = await _catalogService.UpdateReviewAsync(reviewId, userId, dto);
            return Ok(review);
        }
        catch (InvalidOperationException ex)
        {
            if (ex.Message.Contains("не найден", StringComparison.OrdinalIgnoreCase))
            {
                return NotFound(new { error = ex.Message });
            }
            return BadRequest(new { error = ex.Message });
        }
    }

    /// <summary>
    /// Удалить отзыв
    /// </summary>
    [HttpDelete("products/{productId:guid}/reviews/{reviewId:guid}")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult> DeleteReview(Guid productId, Guid reviewId)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("sub")?.Value;
        if (userIdClaim == null || !Guid.TryParse(userIdClaim, out var userId))
        {
            return Unauthorized(new { error = "Пользователь не авторизован" });
        }

        try
        {
            var result = await _catalogService.DeleteReviewAsync(reviewId, userId);
            if (!result)
            {
                return NotFound(new { error = "Отзыв не найден" });
            }
            return NoContent();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    /// <summary>
    /// Отметить отзыв как полезный
    /// </summary>
    [HttpPatch("products/{productId:guid}/reviews/{reviewId:guid}/helpful")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult> ToggleHelpful(Guid productId, Guid reviewId)
    {
        var result = await _catalogService.ToggleHelpfulAsync(reviewId);
        if (!result)
        {
            return NotFound(new { error = "Отзыв не найден" });
        }

        var review = await _catalogService.GetProductReviewsAsync(productId);
        var target = review.FirstOrDefault(r => r.Id == reviewId);
        return Ok(new { helpful = target?.Helpful ?? 0 });
    }

    /// <summary>
    /// Получить категории товаров
    /// </summary>
    [HttpGet("categories")]
    [ProducesResponseType(typeof(CategoriesResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<CategoriesResponse>> GetCategories()
    {
        var categories = await _catalogService.GetCategoriesAsync();
        return Ok(new CategoriesResponse { Data = categories });
    }

    /// <summary>
    /// Получить атрибуты фильтрации для категории (VRAM, socket, chipset и т.д.).
    /// Поддержка контекстных фильтров: при manufacturerIds=... возвращаются только значения из отфильтрованных товаров.
    /// </summary>
    [HttpGet("categories/{slug}/filter-attributes")]
    [ProducesResponseType(typeof(FilterAttributesResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<FilterAttributesResponse>> GetFilterAttributes(string slug, [FromQuery] FilterAttributesQueryDto? filterParams)
    {
        var attributes = await _catalogService.GetFilterAttributesByCategoryAsync(slug, filterParams);
        return Ok(new FilterAttributesResponse { Data = attributes });
    }

    /// <summary>
    /// Получить фасеты для фильтров по категории: полный список значений + counts по текущим фильтрам.
    /// Используется для UX (disabled варианты с (0), корректные диапазоны).
    /// </summary>
    [HttpGet("categories/{slug}/filter-facets")]
    [ProducesResponseType(typeof(FilterFacetsResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<FilterFacetsResponse>> GetFilterFacets(string slug, [FromQuery] FilterAttributesQueryDto? filterParams)
    {
        var facets = await _catalogService.GetFilterFacetsByCategoryAsync(slug, filterParams);
        return Ok(new FilterFacetsResponse { Data = facets });
    }

    /// <summary>
    /// Получить список производителей
    /// </summary>
    [HttpGet("manufacturers")]
    [ProducesResponseType(typeof(ManufacturersResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<ManufacturersResponse>> GetManufacturers([FromQuery] string? category)
    {
        IEnumerable<ManufacturerDto> manufacturers;
        
        if (!string.IsNullOrEmpty(category))
        {
            manufacturers = await _catalogService.GetManufacturersByCategoryAsync(category);
        }
        else
        {
            manufacturers = await _catalogService.GetManufacturersAsync();
        }
        
        return Ok(new ManufacturersResponse { Data = manufacturers });
    }
}

/// <summary>
/// Ответ со списком категорий
/// </summary>
public record CategoriesResponse
{
    public IEnumerable<CategoryDto> Data { get; init; } = Enumerable.Empty<CategoryDto>();
}

/// <summary>
/// Ответ со списком производителей
/// </summary>
public record ManufacturersResponse
{
    public IEnumerable<ManufacturerDto> Data { get; init; } = Enumerable.Empty<ManufacturerDto>();
}

/// <summary>
/// Ответ со списком атрибутов фильтрации
/// </summary>
public record FilterAttributesResponse
{
    public IEnumerable<FilterAttributeDto> Data { get; init; } = Enumerable.Empty<FilterAttributeDto>();
}

public record FilterFacetsResponse
{
    public IEnumerable<FilterFacetAttributeDto> Data { get; init; } = Enumerable.Empty<FilterFacetAttributeDto>();
}

/// <summary>
/// Контроллер для административных операций с товарами
/// </summary>
[ApiController]
[Route("api/v1/admin")]
public class AdminCatalogController : ControllerBase
{
    private readonly ICatalogService _catalogService;
    private readonly ILogger<AdminCatalogController> _logger;

    public AdminCatalogController(ICatalogService catalogService, ILogger<AdminCatalogController> logger)
    {
        _catalogService = catalogService;
        _logger = logger;
    }

    /// <summary>
    /// Получить список товаров для админки с пагинацией и фильтрами
    /// </summary>
    [HttpGet("products")]
    [ProducesResponseType(typeof(PagedResult<ProductListDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<PagedResult<ProductListDto>>> GetAdminProducts(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string? category = null,
        [FromQuery] bool? isActive = null,
        [FromQuery] string? search = null)
    {
        var filter = new ProductFilterDto
        {
            Page = page,
            PageSize = pageSize,
            Category = category,
            IsActive = isActive,
            Search = search
        };

        var result = await _catalogService.GetAdminProductsAsync(filter);
        return Ok(result);
    }

    /// <summary>
    /// Создать новый товар (требуются права менеджера/админа)
    /// </summary>
    [HttpPost("products")]
    [ProducesResponseType(typeof(ProductDetailDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<ProductDetailDto>> CreateProduct([FromBody] CreateProductDto dto)
    {
        try
        {
            var product = await _catalogService.CreateProductAsync(dto);
            return CreatedAtAction(nameof(CatalogController.GetProduct), "Catalog", new { productId = product.Id }, product);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    /// <summary>
    /// Обновить товар (требуются права менеджера/админа)
    /// </summary>
    [HttpPut("products/{productId:guid}")]
    [ProducesResponseType(typeof(ProductDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ProductDetailDto>> UpdateProduct(Guid productId, [FromBody] UpdateProductDto dto)
    {
        var product = await _catalogService.UpdateProductAsync(productId, dto);
        if (product == null)
        {
            return NotFound(new { error = "Товар не найден", productId });
        }
        return Ok(product);
    }

    /// <summary>
    /// Удалить товар (мягкое удаление, требуются права админа)
    /// </summary>
    [HttpDelete("products/{productId:guid}")]
    [Authorize(Roles = "Admin,Master")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteProduct(Guid productId)
    {
        var deleted = await _catalogService.DeleteProductAsync(productId);
        if (!deleted)
        {
            return NotFound(new { error = "Товар не найден", productId });
        }
        return NoContent();
    }

    /// <summary>
    /// Создать нового производителя
    /// </summary>
    [HttpPost("manufacturers")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(ManufacturerDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<ManufacturerDto>> CreateManufacturer([FromBody] CreateManufacturerDto dto)
    {
        try
        {
            var manufacturer = await _catalogService.CreateManufacturerAsync(dto);
            return CreatedAtAction(nameof(CatalogController.GetManufacturers), "Catalog", new { }, manufacturer);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    /// <summary>
    /// Обновить производителя
    /// </summary>
    [HttpPut("manufacturers/{manufacturerId:guid}")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(ManufacturerDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ManufacturerDto>> UpdateManufacturer(Guid manufacturerId, [FromBody] UpdateManufacturerDto dto)
    {
        var manufacturer = await _catalogService.UpdateManufacturerAsync(manufacturerId, dto);
        if (manufacturer == null)
        {
            return NotFound(new { error = "Производитель не найден", manufacturerId });
        }
        return Ok(manufacturer);
    }

    /// <summary>
    /// Удалить производителя
    /// </summary>
    [HttpDelete("manufacturers/{manufacturerId:guid}")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteManufacturer(Guid manufacturerId)
    {
        var deleted = await _catalogService.DeleteManufacturerAsync(manufacturerId);
        if (!deleted)
        {
            return NotFound(new { error = "Производитель не найден", manufacturerId });
        }
        return NoContent();
    }

    /// <summary>
    /// Создать новую категорию
    /// </summary>
    [HttpPost("categories")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(CategoryDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<CategoryDto>> CreateCategory([FromBody] CreateCategoryDto dto)
    {
        try
        {
            var category = await _catalogService.CreateCategoryAsync(dto);
            return CreatedAtAction(nameof(CatalogController.GetCategories), "Catalog", new { }, category);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    /// <summary>
    /// Обновить категорию
    /// </summary>
    [HttpPut("categories/{categoryId:guid}")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(CategoryDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<CategoryDto>> UpdateCategory(Guid categoryId, [FromBody] UpdateCategoryDto dto)
    {
        var category = await _catalogService.UpdateCategoryAsync(categoryId, dto);
        if (category == null)
        {
            return NotFound(new { error = "Категория не найдена", categoryId });
        }
        return Ok(category);
    }

    /// <summary>
    /// Удалить категорию
    /// </summary>
    [HttpDelete("categories/{categoryId:guid}")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> DeleteCategory(Guid categoryId)
    {
        try
        {
            var deleted = await _catalogService.DeleteCategoryAsync(categoryId);
            if (!deleted)
            {
                return NotFound(new { error = "Категория не найдена", categoryId });
            }
            return NoContent();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    /// <summary>
    /// Получить историю цен товара
    /// </summary>
    [HttpGet("products/{productId:guid}/price-history")]
    [ProducesResponseType(typeof(List<PriceHistoryDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<List<PriceHistoryDto>>> GetPriceHistory(Guid productId)
    {
        if (!await _catalogService.GetProductByIdAsync(productId).ContinueWith(t => t.Result != null))
        {
            return NotFound(new { error = "Товар не найден", productId });
        }

        var history = await _catalogService.GetPriceHistoryAsync(productId);
        return Ok(history);
    }

    /// <summary>
    /// Получить мета-данные характеристик для категории (для редактора админки)
    /// </summary>
    [HttpGet("specifications/by-category/{categoryId:guid}")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(CategorySpecificationsDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<CategorySpecificationsDto>> GetCategorySpecifications(Guid categoryId)
    {
        var result = await _catalogService.GetCategorySpecificationsAsync(categoryId);
        if (result.Attributes.Count == 0)
        {
            return NotFound(new { error = "Категория не найдена", categoryId });
        }
        return Ok(result);
    }

    /// <summary>
    /// Сгенерировать название товара по шаблону
    /// </summary>
    [HttpPost("products/generate-name")]
    [Authorize(Roles = "Manager,Admin,Master")]
    [ProducesResponseType(typeof(GenerateNameResponse), StatusCodes.Status200OK)]
    public ActionResult<GenerateNameResponse> GenerateProductName(
        [FromBody] GenerateNameRequest request,
        [FromServices] IProductNameGenerator nameGenerator)
    {
        try
        {
            var name = nameGenerator.GenerateName(
                request.ManufacturerName,
                request.CategorySlug,
                request.Specifications);

            return Ok(new GenerateNameResponse { Name = name });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Ошибка генерации названия товара");
            return Ok(new GenerateNameResponse { Name = "Без названия" });
        }
    }
}

/// <summary>
/// Контроллер для административных операций с данными (миграции, исправления)
/// </summary>
[ApiController]
[Route("api/v1/admin/data")]
[Authorize(Roles = "Admin,Master")]
public class AdminDataController : ControllerBase
{
    private readonly ICatalogService _catalogService;
    private readonly ILogger<AdminDataController> _logger;

    public AdminDataController(ICatalogService catalogService, ILogger<AdminDataController> logger)
    {
        _catalogService = catalogService;
        _logger = logger;
    }

    /// <summary>
    /// Запустить миграцию для исправления выбросов в Range-атрибутах
    /// </summary>
    [HttpPost("migrate/fix-range-outliers")]
    [ProducesResponseType(typeof(MigrationResultDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<MigrationResultDto>> FixRangeOutliers([FromServices] CatalogService.Services.SpecificationDataMigration migrationService)
    {
        _logger.LogInformation("Starting range outliers migration");
        var result = await migrationService.FixRangeOutliersAsync();
        
        return Ok(new MigrationResultDto
        {
            Valid = result.ValidCount,
            Fixed = result.FixedCount,
            Removed = result.RemovedCount,
            Message = $"Migration completed. Valid: {result.ValidCount}, Fixed: {result.FixedCount}, Removed: {result.RemovedCount}"
        });
    }

    /// <summary>
    /// Запустить миграцию для удаления leaked values из Terms-атрибутов
    /// </summary>
    [HttpPost("migrate/remove-leaked-values")]
    [ProducesResponseType(typeof(MigrationResultDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<MigrationResultDto>> RemoveLeakedValues([FromServices] CatalogService.Services.SpecificationDataMigration migrationService)
    {
        _logger.LogInformation("Starting leaked values removal migration");
        var result = await migrationService.RemoveLeakedValuesAsync();
        
        return Ok(new MigrationResultDto
        {
            Valid = result.ValidCount,
            Fixed = 0,
            Removed = result.RemovedCount,
            Message = $"Migration completed. Valid: {result.ValidCount}, Removed: {result.RemovedCount}"
        });
    }

    /// <summary>
    /// Запустить миграцию для нормализации дубликатов в Terms-атрибутах
    /// </summary>
    [HttpPost("migrate/normalize-duplicates")]
    [ProducesResponseType(typeof(MigrationResultDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<MigrationResultDto>> NormalizeDuplicates([FromServices] CatalogService.Services.SpecificationDataMigration migrationService)
    {
        _logger.LogInformation("Starting duplicates normalization migration");
        var result = await migrationService.NormalizeDuplicatesAsync();
        
        return Ok(new MigrationResultDto
        {
            Valid = result.ValidCount,
            Fixed = result.FixedCount,
            Removed = 0,
            Message = $"Migration completed. Valid: {result.ValidCount}, Merged: {result.FixedCount}"
        });
    }

    /// <summary>
    /// Пересчитать частоты процессоров из МГц в ГГц
    /// </summary>
    [HttpPost("migrate/recalculate-frequencies")]
    [ProducesResponseType(typeof(MigrationResultDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<MigrationResultDto>> RecalculateFrequencies([FromServices] CatalogService.Services.SpecificationDataMigration migrationService)
    {
        _logger.LogInformation("Starting processor frequencies recalculation migration");
        var result = await migrationService.RecalculateProcessorFrequenciesAsync();
        
        return Ok(new MigrationResultDto
        {
            Valid = result.ValidCount,
            Fixed = result.FixedCount,
            Removed = 0,
            Message = $"Frequencies recalculated. Valid: {result.ValidCount}, Fixed: {result.FixedCount}"
        });
    }

    /// <summary>
    /// Пересчитать видеопамять из ГБ в МБ
    /// </summary>
    [HttpPost("migrate/recalculate-vram")]
    [ProducesResponseType(typeof(MigrationResultDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<MigrationResultDto>> RecalculateVram([FromServices] CatalogService.Services.SpecificationDataMigration migrationService)
    {
        _logger.LogInformation("Starting video memory recalculation migration");
        var result = await migrationService.RecalculateVideoMemoryAsync();
        
        return Ok(new MigrationResultDto
        {
            Valid = result.ValidCount,
            Fixed = result.FixedCount,
            Removed = 0,
            Message = $"Video memory recalculated. Valid: {result.ValidCount}, Fixed: {result.FixedCount}"
        });
    }

    /// <summary>
    /// Запустить все миграции последовательно
    /// </summary>
    [HttpPost("migrate/all")]
    [ProducesResponseType(typeof(AllMigrationsResultDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<AllMigrationsResultDto>> RunAllMigrations([FromServices] CatalogService.Services.SpecificationDataMigration migrationService)
    {
        _logger.LogInformation("Starting all migrations");
        
        var frequencies = await migrationService.RecalculateProcessorFrequenciesAsync();
        var vram = await migrationService.RecalculateVideoMemoryAsync();
        var outliers = await migrationService.FixRangeOutliersAsync();
        var leaked = await migrationService.RemoveLeakedValuesAsync();
        var duplicates = await migrationService.NormalizeDuplicatesAsync();
        
        return Ok(new AllMigrationsResultDto
        {
            RangeOutliers = new MigrationResultDto
            {
                Valid = outliers.ValidCount,
                Fixed = outliers.FixedCount,
                Removed = outliers.RemovedCount,
                Message = "Range outliers fixed"
            },
            LeakedValues = new MigrationResultDto
            {
                Valid = leaked.ValidCount,
                Fixed = 0,
                Removed = leaked.RemovedCount,
                Message = "Leaked values removed"
            },
            Duplicates = new MigrationResultDto
            {
                Valid = duplicates.ValidCount,
                Fixed = duplicates.FixedCount,
                Removed = 0,
                Message = "Duplicates normalized"
            },
            TotalMessage = $"All migrations completed successfully. Frequencies fixed: {frequencies.FixedCount}, VRAM fixed: {vram.FixedCount}"
        });
    }

    /// <summary>
    /// Проверка наличия товаров на складе
    /// </summary>
    [HttpPost("products/check-stock")]
    [ProducesResponseType(typeof(List<StockCheckResponseDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<List<StockCheckResponseDto>>> CheckStock([FromBody] List<StockCheckRequestDto> items)
    {
        var results = new List<StockCheckResponseDto>();

        foreach (var item in items)
        {
            var product = await _catalogService.GetProductByIdAsync(item.ProductId);
            
            if (product == null)
            {
                results.Add(new StockCheckResponseDto
                {
                    ProductId = item.ProductId,
                    Available = false,
                    AvailableQuantity = 0,
                    Message = "Товар не найден"
                });
                continue;
            }

            var available = product.Stock >= item.Quantity;
            results.Add(new StockCheckResponseDto
            {
                ProductId = item.ProductId,
                Available = available,
                AvailableQuantity = product.Stock,
                Message = available ? "В наличии" : $"Доступно только {product.Stock} шт."
            });
        }

        return Ok(results);
    }
}

public record StockCheckRequestDto
{
    public Guid ProductId { get; init; }
    public int Quantity { get; init; }
}

public record StockCheckResponseDto
{
    public Guid ProductId { get; init; }
    public bool Available { get; init; }
    public int AvailableQuantity { get; init; }
    public string Message { get; init; } = string.Empty;
}

public record MigrationResultDto
{
    public int Valid { get; init; }
    public int Fixed { get; init; }
    public int Removed { get; init; }
    public string Message { get; init; } = string.Empty;
}

public record AllMigrationsResultDto
{
    public MigrationResultDto RangeOutliers { get; init; } = new();
    public MigrationResultDto LeakedValues { get; init; } = new();
    public MigrationResultDto Duplicates { get; init; } = new();
    public string TotalMessage { get; init; } = string.Empty;
}