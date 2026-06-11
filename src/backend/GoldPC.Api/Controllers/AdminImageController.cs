using GoldPC.Api.Models;
using GoldPC.Api.Services;
using GoldPC.Shared.Authorization;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GoldPC.Api.Controllers;

/// <summary>Контроллер для управления изображениями товаров</summary>
[ApiController]
[Route("api/v1/admin/products/{productId}/images")]
[Authorize(Roles = "Admin,Manager")]
public class AdminImageController : ControllerBase
{
    private readonly IFileService _fileService;
    private readonly ICatalogServiceClient _catalogClient;
    private readonly ILogger<AdminImageController> _logger;

    public AdminImageController(
        IFileService fileService,
        ICatalogServiceClient catalogClient,
        ILogger<AdminImageController> logger)
    {
        _fileService = fileService;
        _catalogClient = catalogClient;
        _logger = logger;
    }

    /// <summary>Загрузить одно или несколько изображений товара (multipart/form-data)</summary>
    /// <returns>A <see cref="Task"/> representing the asynchronous operation.</returns>
    [HttpPost]
    [ProducesResponseType(typeof(List<ProductImageDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<List<ProductImageDto>>> UploadImages(string productId)
    {
        // Verify product exists via CatalogService
        if (!Guid.TryParse(productId, out var productGuid))
            return BadRequest(new { error = "Неверный формат ID товара" });

        var product = await _catalogClient.GetProductByIdAsync(productGuid);
        if (product == null)
            return NotFound(new { error = "Товар не найден" });

#pragma warning disable S6932 // Use IFormFile or IFormFileCollection binding instead — получение файлов из формы напрямую необходимо для динамического числа файлов
        var files = Request.Form.Files;
#pragma warning restore S6932
        if (files == null || files.Count == 0)
            return BadRequest(new { error = "Не выбраны файлы для загрузки" });

        var results = new List<ProductImageDto>();
        var errors = new List<string>();

        foreach (var file in files)
        {
            var result = await _fileService.SaveAsync(file, productId);
            if (result.Success && result.Image != null)
            {
                results.Add(result.Image);
            }
            else
            {
                errors.Add(result.Error ?? "Ошибка загрузки файла");
            }
        }

        if (results.Count == 0)
            return BadRequest(new { error = string.Join("; ", errors) });

        if (errors.Count > 0)
        {
            _logger.LogWarning("Uploaded {Ok} images for {ProductId}, {Err} errors: {Errors}",
                results.Count, productId, errors.Count, string.Join(", ", errors));
        }

        return Ok(results);
    }

    /// <summary>Удалить изображение товара (soft delete)</summary>
    /// <returns>A <see cref="Task"/> representing the asynchronous operation.</returns>
    [HttpDelete("{imageId}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteImage(string productId, string imageId)
    {
        var deleted = await _fileService.DeleteAsync(imageId);
        if (!deleted)
            return NotFound(new { error = "Изображение не найдено" });

        return NoContent();
    }

    /// <summary>Установить изображение как главное</summary>
    /// <returns>A <see cref="Task"/> representing the asynchronous operation.</returns>
    [HttpPut("{imageId}/primary")]
    [ProducesResponseType(typeof(ProductImageDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ProductImageDto>> SetPrimary(string productId, string imageId)
    {
        var image = await _fileService.SetPrimaryAsync(productId, imageId);
        if (image == null)
            return NotFound(new { error = "Изображение не найдено" });

        return Ok(image);
    }

    /// <summary>Пересортировать изображения товара</summary>
    /// <returns>A <see cref="Task"/> representing the asynchronous operation.</returns>
    [HttpPut("reorder")]
    [ProducesResponseType(typeof(List<ProductImageDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<List<ProductImageDto>>> Reorder(
        string productId,
        [FromBody] ReorderRequest request)
    {
        if (request?.ImageIds == null || request.ImageIds.Count == 0)
            return BadRequest(new { error = "Список imageIds обязателен" });

        var images = await _fileService.ReorderAsync(productId, request.ImageIds);
        return Ok(images);
    }
}

/// <summary>Тело запроса пересортировки изображений</summary>
public record ReorderRequest
{
    public List<string> ImageIds { get; init; } = new();
}
