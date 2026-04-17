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
[Authorize(Roles = "Manager,Admin,Master")]
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