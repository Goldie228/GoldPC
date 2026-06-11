using GoldPC.Api.Services;
using GoldPC.Shared.Authorization;
using GoldPC.Shared.Entities;
using GoldPC.Shared.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SK = GoldPC.SharedKernel.DTOs;

namespace GoldPC.Api.Controllers;

/// <summary>Контроллер управления товарами</summary>
[ApiController]
[Route("api/v1/admin")]
public class AdminProductsController : ControllerBase
{
    private readonly IAdminService _adminService;
    private readonly ICatalogServiceClient _catalogClient;
    private readonly INotificationService _notificationService;
    private readonly ILogger<AdminProductsController> _logger;

    public AdminProductsController(
        IAdminService adminService,
        ICatalogServiceClient catalogClient,
        INotificationService notificationService,
        ILogger<AdminProductsController> logger)
    {
        _adminService = adminService;
        _catalogClient = catalogClient;
        _notificationService = notificationService;
        _logger = logger;
    }

    /// <summary>Получить IP-адрес клиента</summary>
    private string GetClientIp()
    {
        var ip = HttpContext.Connection.RemoteIpAddress?.ToString();
        // За обратным прокси: X-Forwarded-For — инфраструктурный заголовок, не привязывается через model binding
#pragma warning disable S6932 // Use model binding instead of raw request data
        if (HttpContext.Request.Headers.TryGetValue("X-Forwarded-For", out var forwardedFor))
#pragma warning restore S6932
        {
            var first = forwardedFor.FirstOrDefault();
            if (!string.IsNullOrWhiteSpace(first))
                ip = first.Split(',')[0].Trim();
        }
        return ip ?? "";
    }

    /// <summary>Получить ID текущего пользователя из JWT-токена</summary>
    private Guid GetCurrentUserId()
    {
        var claim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        Guid.TryParse(claim, out var userId);
        return userId;
    }

    // ====================================================================
    // Эндпоинты товаров
    // ====================================================================

    /// <summary>Получить список товаров</summary>
    /// <returns>A <see cref="Task"/> representing the asynchronous operation.</returns>
    [HttpGet("products")]
    [Authorize(Policy = Permissions.ProductsView)]
    [ProducesResponseType(typeof(SK.PagedResult<SK.ProductListDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<SK.PagedResult<SK.ProductListDto>>> GetProducts(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string? category = null,
        [FromQuery] bool? isActive = null,
        [FromQuery] string? search = null)
    {
        var result = await _catalogClient.GetProductsAsync(page, pageSize, category, isActive, search);
        return Ok(result);
    }

    /// <summary>Получить товар по ID</summary>
    /// <returns>A <see cref="Task"/> representing the asynchronous operation.</returns>
    [HttpGet("products/{id}")]
    [Authorize(Policy = Permissions.ProductsView)]
    [ProducesResponseType(typeof(SK.ProductDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<SK.ProductDetailDto>> GetProductById(string id)
    {
        if (!Guid.TryParse(id, out var guid))
            return BadRequest(new { error = "Неверный формат ID товара" });

        var product = await _catalogClient.GetProductByIdAsync(guid);
        if (product == null) return NotFound(new { error = "Товар не найден" });
        return Ok(product);
    }

    /// <summary>Создать товар</summary>
    /// <returns>A <see cref="Task"/> representing the asynchronous operation.</returns>
    [HttpPost("products")]
    [Authorize(Policy = Permissions.ProductsCreate)]
    [ProducesResponseType(typeof(SK.ProductDetailDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<SK.ProductDetailDto>> CreateProduct([FromBody] SK.CreateProductDto create)
    {
        if (string.IsNullOrWhiteSpace(create.Name))
            return BadRequest(new { error = "Название товара обязательно" });
        if (string.IsNullOrWhiteSpace(create.Category))
            return BadRequest(new { error = "Категория обязательна" });

        var product = await _catalogClient.CreateProductAsync(create);
        var currentUserId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "unknown";
        var currentUserName = User.Identity?.Name ?? "unknown";
        var currentUserEmail = User.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value ?? "unknown";
        await _adminService.AddAuditLogAsync("PRODUCT_CREATED", currentUserId, currentUserName, currentUserEmail,
            $"Создан товар: {create.Name}", ipAddress: GetClientIp());
        await _notificationService.SendNotificationToRoleAsync("Admin", new Notification
        {
            UserId = GetCurrentUserId(),
            Title = "Создан товар",
            Message = $"Создан товар: {create.Name}",
            Type = NotificationType.ProductUpdate,
            Priority = NotificationPriority.Medium,
            RelatedUrl = "/admin/catalog"
        });
        return CreatedAtAction(nameof(GetProductById), new { id = product.Id.ToString() }, product);
    }

    /// <summary>Обновить товар</summary>
    /// <returns>A <see cref="Task"/> representing the asynchronous operation.</returns>
    [HttpPut("products/{id}")]
    [Authorize(Policy = Permissions.ProductsEdit)]
    [ProducesResponseType(typeof(SK.ProductDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<SK.ProductDetailDto>> UpdateProduct(string id, [FromBody] SK.UpdateProductDto update)
    {
        if (!Guid.TryParse(id, out var guid))
            return BadRequest(new { error = "Неверный формат ID товара" });

        var product = await _catalogClient.UpdateProductAsync(guid, update);
        if (product == null) return NotFound(new { error = "Товар не найден" });
        var currentUserId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "unknown";
        var currentUserName = User.Identity?.Name ?? "unknown";
        var currentUserEmail = User.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value ?? "unknown";
        var nameForLog = product.Name ?? id;
        await _adminService.AddAuditLogAsync("PRODUCT_UPDATED", currentUserId, currentUserName, currentUserEmail,
            $"Обновлён товар: {nameForLog}", ipAddress: GetClientIp());
        await _notificationService.SendNotificationToRoleAsync("Admin", new Notification
        {
            UserId = GetCurrentUserId(),
            Title = "Обновлён товар",
            Message = $"Обновлён товар: {nameForLog}",
            Type = NotificationType.ProductUpdate,
            Priority = NotificationPriority.Medium,
            RelatedUrl = "/admin/catalog"
        });
        return Ok(product);
    }

    /// <summary>Удалить товар (деактивация)</summary>
    /// <returns>A <see cref="Task"/> representing the asynchronous operation.</returns>
    [HttpDelete("products/{id}")]
    [Authorize(Policy = Permissions.ProductsDelete)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteProduct(string id)
    {
        if (!Guid.TryParse(id, out var guid))
            return BadRequest(new { error = "Неверный формат ID товара" });

        var result = await _catalogClient.DeleteProductAsync(guid);
        if (!result) return NotFound(new { error = "Товар не найден" });
        var currentUserId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "unknown";
        var currentUserName = User.Identity?.Name ?? "unknown";
        var currentUserEmail = User.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value ?? "unknown";
        await _adminService.AddAuditLogAsync("PRODUCT_DELETED", currentUserId, currentUserName, currentUserEmail,
            $"Удалён товар (ID: {id})", "WARNING", ipAddress: GetClientIp());
        await _notificationService.SendNotificationToRoleAsync("Admin", new Notification
        {
            UserId = GetCurrentUserId(),
            Title = "Удалён товар",
            Message = $"Удалён товар (ID: {id})",
            Type = NotificationType.ProductUpdate,
            Priority = NotificationPriority.High,
            RelatedUrl = "/admin/catalog"
        });
        return NoContent();
    }

    /// <summary>Получить историю цен товара</summary>
    /// <returns>A <see cref="Task"/> representing the asynchronous operation.</returns>
    [HttpGet("products/{id}/price-history")]
    [Authorize(Policy = Permissions.ProductsView)]
    [ProducesResponseType(typeof(List<SK.PriceHistoryDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<List<SK.PriceHistoryDto>>> GetPriceHistory(string id)
    {
        if (!Guid.TryParse(id, out var guid))
            return BadRequest(new { error = "Неверный формат ID товара" });

        var history = await _catalogClient.GetPriceHistoryAsync(guid);
        return Ok(history);
    }

    /// <summary>Сгенерировать название товара по шаблону</summary>
    /// <returns>A <see cref="Task"/> representing the asynchronous operation.</returns>
    [HttpPost("products/generate-name")]
    [Authorize(Policy = Permissions.ProductsCreate)]
    [ProducesResponseType(typeof(SK.GenerateNameResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<SK.GenerateNameResponse>> GenerateProductName([FromBody] SK.GenerateNameRequest request)
    {
        var name = await _catalogClient.GenerateProductNameAsync(
            request.ManufacturerName,
            request.CategorySlug,
            request.Specifications);

        return Ok(new SK.GenerateNameResponse { Name = name });
    }

    /// <summary>Получить мета-данные характеристик для категории (редактор админки)</summary>
    /// <returns>A <see cref="Task"/> representing the asynchronous operation.</returns>
    [HttpGet("specifications/by-category/{categoryId}")]
    [Authorize(Policy = Permissions.ProductsView)]
    [ProducesResponseType(typeof(SK.CategorySpecificationsDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<SK.CategorySpecificationsDto>> GetCategorySpecifications(string categoryId)
    {
        if (!Guid.TryParse(categoryId, out var guid))
            return BadRequest(new { error = "Неверный формат ID категории" });

        var result = await _catalogClient.GetCategorySpecificationsAsync(guid);
        if (result == null)
            return NotFound(new { error = "Категория не найдена", categoryId });

        return Ok(result);
    }

    /// <summary>Получить уникальные значения характеристик для категории</summary>
    /// <returns>A <see cref="Task"/> representing the asynchronous operation.</returns>
    [HttpGet("specifications/unique-values/{categoryId}")]
    [Authorize(Policy = Permissions.ProductsView)]
    [ProducesResponseType(typeof(Dictionary<string, List<string>>), StatusCodes.Status200OK)]
    public async Task<ActionResult<Dictionary<string, List<string>>>> GetUniqueSpecValues(string categoryId)
    {
        if (!Guid.TryParse(categoryId, out var guid))
            return BadRequest(new { error = "Неверный формат ID категории" });

        var result = await _catalogClient.GetUniqueSpecValuesAsync(guid);
        return Ok(result);
    }
}
