using CatalogService.DTOs;
using CatalogService.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace CatalogService.Controllers;

/// <summary>
/// Контроллер для работы с каталогом товаров
/// </summary>
[ApiController]
[Route("api/v1/[controller]")]
public class ProductsController : ControllerBase
{
    private readonly ICatalogService _catalogService;
    private readonly ILogger<ProductsController> _logger;

    public ProductsController(ICatalogService catalogService, ILogger<ProductsController> logger)
    {
        _catalogService = catalogService;
        _logger = logger;
    }

    /// <summary>
    /// Получить список товаров с фильтрацией и пагинацией
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(PagedResult<ProductListDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<PagedResult<ProductListDto>>> GetProducts([FromQuery] ProductFilterDto filter)
    {
        var result = await _catalogService.GetProductsAsync(filter);
        return Ok(result);
    }

    /// <summary>
    /// Получить товар по ID
    /// </summary>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(ProductDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ProductDetailDto>> GetProduct(Guid id)
    {
        var product = await _catalogService.GetProductByIdAsync(id);
        if (product == null)
        {
            return NotFound(new { error = "Товар не найден", id });
        }
        return Ok(product);
    }

    /// <summary>
    /// Получить товар по артикулу (SKU)
    /// </summary>
    [HttpGet("by-sku/{sku}")]
    [ProducesResponseType(typeof(ProductDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ProductDetailDto>> GetProductBySku(string sku)
    {
        var product = await _catalogService.GetProductBySkuAsync(sku);
        if (product == null)
        {
            return NotFound(new { error = "Товар не найден", sku });
        }
        return Ok(product);
    }

    /// <summary>
    /// Получить несколько товаров по списку ID (для других сервисов)
    /// </summary>
    [HttpPost("by-ids")]
    [ProducesResponseType(typeof(IEnumerable<ProductListDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<ProductListDto>>> GetProductsByIds([FromBody] IEnumerable<Guid> ids)
    {
        var products = await _catalogService.GetProductsByIdsAsync(ids);
        return Ok(products);
    }

    /// <summary>
    /// Создать новый товар (требуются права менеджера/админа)
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(ProductDetailDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<ProductDetailDto>> CreateProduct([FromBody] CreateProductDto dto)
    {
        try
        {
            var product = await _catalogService.CreateProductAsync(dto);
            return CreatedAtAction(nameof(GetProduct), new { id = product.Id }, product);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    /// <summary>
    /// Обновить товар (требуются права менеджера/админа)
    /// </summary>
    [HttpPut("{id:guid}")]
    [ProducesResponseType(typeof(ProductDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ProductDetailDto>> UpdateProduct(Guid id, [FromBody] UpdateProductDto dto)
    {
        var product = await _catalogService.UpdateProductAsync(id, dto);
        if (product == null)
        {
            return NotFound(new { error = "Товар не найден", id });
        }
        return Ok(product);
    }

    /// <summary>
    /// Удалить товар (мягкое удаление, требуются права админа)
    /// </summary>
    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteProduct(Guid id)
    {
        var deleted = await _catalogService.DeleteProductAsync(id);
        if (!deleted)
        {
            return NotFound(new { error = "Товар не найден", id });
        }
        return NoContent();
    }

    /// <summary>
    /// Добавить отзыв к товару
    /// </summary>
    [HttpPost("{id:guid}/reviews")]
    [ProducesResponseType(typeof(ReviewDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ReviewDto>> AddReview(Guid id, [FromBody] CreateReviewDto dto)
    {
        // TODO: Получить userId из JWT токена после интеграции с Auth сервисом
        var userId = Guid.Parse("00000000-0000-0000-0000-000000000000"); // Заглушка
        
        try
        {
            var review = await _catalogService.CreateReviewAsync(id, userId, dto);
            return CreatedAtAction(nameof(GetProductReviews), new { id }, review);
        }
        catch (InvalidOperationException ex)
        {
            return NotFound(new { error = ex.Message });
        }
    }

    /// <summary>
    /// Получить отзывы товара
    /// </summary>
    [HttpGet("{id:guid}/reviews")]
    [ProducesResponseType(typeof(IEnumerable<ReviewDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<ReviewDto>>> GetProductReviews(Guid id)
    {
        var reviews = await _catalogService.GetProductReviewsAsync(id);
        return Ok(reviews);
    }
}

/// <summary>
/// Контроллер для работы с категориями
/// </summary>
[ApiController]
[Route("api/v1/[controller]")]
public class CategoriesController : ControllerBase
{
    private readonly ICatalogService _catalogService;

    public CategoriesController(ICatalogService catalogService)
    {
        _catalogService = catalogService;
    }

    /// <summary>
    /// Получить все категории
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<CategoryDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<CategoryDto>>> GetCategories()
    {
        var categories = await _catalogService.GetCategoriesAsync();
        return Ok(categories);
    }

    /// <summary>
    /// Получить категорию по slug
    /// </summary>
    [HttpGet("{slug}")]
    [ProducesResponseType(typeof(CategoryDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<CategoryDto>> GetCategory(string slug)
    {
        var category = await _catalogService.GetCategoryBySlugAsync(slug);
        if (category == null)
        {
            return NotFound(new { error = "Категория не найдена", slug });
        }
        return Ok(category);
    }

    /// <summary>
    /// Создать категорию (требуются права админа)
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(CategoryDto), StatusCodes.Status201Created)]
    public async Task<ActionResult<CategoryDto>> CreateCategory([FromBody] CreateCategoryDto dto)
    {
        var category = await _catalogService.CreateCategoryAsync(dto);
        return CreatedAtAction(nameof(GetCategory), new { slug = category.Slug }, category);
    }
}

/// <summary>
/// Контроллер для работы с производителями
/// </summary>
[ApiController]
[Route("api/v1/[controller]")]
public class ManufacturersController : ControllerBase
{
    private readonly ICatalogService _catalogService;

    public ManufacturersController(ICatalogService catalogService)
    {
        _catalogService = catalogService;
    }

    /// <summary>
    /// Получить всех производителей
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<ManufacturerDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<ManufacturerDto>>> GetManufacturers()
    {
        var manufacturers = await _catalogService.GetManufacturersAsync();
        return Ok(manufacturers);
    }

    /// <summary>
    /// Создать производителя (требуются права админа)
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(ManufacturerDto), StatusCodes.Status201Created)]
    public async Task<ActionResult<ManufacturerDto>> CreateManufacturer([FromBody] CreateManufacturerDto dto)
    {
        var manufacturer = await _catalogService.CreateManufacturerAsync(dto);
        return CreatedAtAction(nameof(GetManufacturers), new { id = manufacturer.Id }, manufacturer);
    }
}