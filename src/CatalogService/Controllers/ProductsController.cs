using GoldPC.SharedKernel.DTOs;
using CatalogService.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

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
[Authorize(Roles = "Manager,Admin")]
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
    [Authorize(Roles = "Admin")]
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