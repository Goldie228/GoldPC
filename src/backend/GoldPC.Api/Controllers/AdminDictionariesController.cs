using GoldPC.Api.Services;
using GoldPC.Shared.Authorization;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SK = GoldPC.SharedKernel.DTOs;

namespace GoldPC.Api.Controllers;

/// <summary>Контроллер управления справочниками</summary>
[ApiController]
[Route("api/v1/admin/dictionaries")]
public class AdminDictionariesController : ControllerBase
{
    private readonly IAdminService _adminService;
    private readonly ICatalogServiceClient _catalogClient;
    private readonly ILogger<AdminDictionariesController> _logger;

    public AdminDictionariesController(
        IAdminService adminService,
        ICatalogServiceClient catalogClient,
        ILogger<AdminDictionariesController> logger)
    {
        _adminService = adminService;
        _catalogClient = catalogClient;
        _logger = logger;
    }

    // ====================================================================
    // Маппинг: SharedKernel DTOs → DictionaryItemDto
    // ====================================================================
    private static List<DictionaryItemDto> MapCategoriesToDictionaryItems(List<SK.CategoryDto> categories)
    {
        return categories.Select(c => new DictionaryItemDto
        {
            Id = c.Id.ToString(),
            Name = c.Name,
            Slug = c.Slug,
            IsActive = true,
            ProductCount = c.ProductCount
        }).ToList();
    }

    private static DictionaryItemDto MapCategoryToDictionaryItem(SK.CategoryDto c) => new()
    {
        Id = c.Id.ToString(),
        Name = c.Name,
        Slug = c.Slug,
        IsActive = true,
        ProductCount = c.ProductCount
    };

    private static List<DictionaryItemDto> MapManufacturersToDictionaryItems(List<SK.ManufacturerDto> manufacturers)
    {
        return manufacturers.Select(m => new DictionaryItemDto
        {
            Id = m.Id.ToString(),
            Name = m.Name,
            Slug = m.Name.ToLower().Replace(" ", "-").Replace("!", ""),
            IsActive = true,
            ProductCount = 0,
            Country = m.Country
        }).ToList();
    }

    private static DictionaryItemDto MapManufacturerToDictionaryItem(SK.ManufacturerDto m) => new()
    {
        Id = m.Id.ToString(),
        Name = m.Name,
        Slug = m.Name.ToLower().Replace(" ", "-").Replace("!", ""),
        IsActive = true,
        ProductCount = 0,
        Country = m.Country
    };

    // ====================================================================
    // Эндпоинты
    // ====================================================================

    /// <summary>Получить элементы справочника</summary>
    /// <returns>A <see cref="Task"/> representing the asynchronous operation.</returns>
    [HttpGet("{type}")]
    [Authorize(Policy = Permissions.CategoriesView)]
    [ProducesResponseType(typeof(List<DictionaryItemDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<List<DictionaryItemDto>>> GetDictionary(string type)
    {
        var validTypes = new[] { "categories", "manufacturers", "attributes" };
        if (!validTypes.Contains(type.ToLower()))
            return BadRequest(new { error = $"Неизвестный тип справочника: {type}. Допустимые: {string.Join(", ", validTypes)}" });

        switch (type.ToLower())
        {
            case "categories":
                return Ok(MapCategoriesToDictionaryItems(await _catalogClient.GetCategoriesAsync()));
            case "manufacturers":
                return Ok(MapManufacturersToDictionaryItems(await _catalogClient.GetManufacturersAsync()));
            case "attributes":
                return Ok(await _adminService.GetDictionaryAsync("attributes"));
            default:
                return Ok(new List<DictionaryItemDto>());
        }
    }

    /// <summary>Создать элемент справочника</summary>
    /// <returns>A <see cref="Task"/> representing the asynchronous operation.</returns>
    [HttpPost("{type}")]
    [Authorize(Policy = Permissions.CategoriesManage)]
    [ProducesResponseType(typeof(DictionaryItemDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<DictionaryItemDto>> CreateDictionaryItem(string type, [FromBody] CreateDictionaryItemRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name) || string.IsNullOrWhiteSpace(request.Slug))
            return BadRequest(new { error = "Name и Slug обязательны" });

        switch (type.ToLower())
        {
            case "categories":
                var catDto = new SK.CreateCategoryDto { Name = request.Name, Slug = request.Slug };
                var catResult = await _catalogClient.CreateCategoryAsync(catDto);
                return CreatedAtAction(nameof(GetDictionary), new { type }, MapCategoryToDictionaryItem(catResult));
            case "manufacturers":
                var mfrDto = new SK.CreateManufacturerDto { Name = request.Name };
                var mfrResult = await _catalogClient.CreateManufacturerAsync(mfrDto);
                return CreatedAtAction(nameof(GetDictionary), new { type }, MapManufacturerToDictionaryItem(mfrResult));
            case "attributes":
                var attrResult = await _adminService.CreateDictionaryItemAsync(type, request);
                return CreatedAtAction(nameof(GetDictionary), new { type }, attrResult);
            default:
                return BadRequest(new { error = $"Неизвестный тип справочника: {type}" });
        }
    }

    /// <summary>Обновить элемент справочника</summary>
    /// <returns>A <see cref="Task"/> representing the asynchronous operation.</returns>
    [HttpPut("{type}/{id}")]
    [Authorize(Policy = Permissions.CategoriesManage)]
    [ProducesResponseType(typeof(DictionaryItemDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<DictionaryItemDto>> UpdateDictionaryItem(string type, string id, [FromBody] UpdateDictionaryItemRequest request)
    {
        switch (type.ToLower())
        {
            case "categories":
                if (!Guid.TryParse(id, out var catGuid))
                    return BadRequest(new { error = "Неверный формат ID" });
                var catDto = new SK.UpdateCategoryDto { Name = request.Name, Slug = request.Slug };
                var catResult = await _catalogClient.UpdateCategoryAsync(catGuid, catDto);
                if (catResult == null) return NotFound(new { error = "Категория не найдена" });
                return Ok(MapCategoryToDictionaryItem(catResult));
            case "manufacturers":
                if (!Guid.TryParse(id, out var mfrGuid))
                    return BadRequest(new { error = "Неверный формат ID" });
                var mfrDto = new SK.UpdateManufacturerDto { Name = request.Name };
                var mfrResult = await _catalogClient.UpdateManufacturerAsync(mfrGuid, mfrDto);
                if (mfrResult == null) return NotFound(new { error = "Производитель не найден" });
                return Ok(MapManufacturerToDictionaryItem(mfrResult));
            case "attributes":
                var attrResult = await _adminService.UpdateDictionaryItemAsync(type, id, request);
                if (attrResult == null) return NotFound(new { error = "Элемент справочника не найден" });
                return Ok(attrResult);
            default:
                return BadRequest(new { error = $"Неизвестный тип справочника: {type}" });
        }
    }

    /// <summary>Удалить элемент справочника (деактивация)</summary>
    /// <returns>A <see cref="Task"/> representing the asynchronous operation.</returns>
    [HttpDelete("{type}/{id}")]
    [Authorize(Policy = Permissions.CategoriesManage)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteDictionaryItem(string type, string id)
    {
        switch (type.ToLower())
        {
            case "categories":
                if (!Guid.TryParse(id, out var catGuid))
                    return BadRequest(new { error = "Неверный формат ID" });
                var catResult = await _catalogClient.DeleteCategoryAsync(catGuid);
                if (!catResult) return NotFound(new { error = "Категория не найдена" });
                return NoContent();
            case "manufacturers":
                if (!Guid.TryParse(id, out var mfrGuid))
                    return BadRequest(new { error = "Неверный формат ID" });
                var mfrResult = await _catalogClient.DeleteManufacturerAsync(mfrGuid);
                if (!mfrResult) return NotFound(new { error = "Производитель не найден" });
                return NoContent();
            case "attributes":
                var attrResult = await _adminService.DeleteDictionaryItemAsync(type, id);
                if (!attrResult) return NotFound(new { error = "Элемент справочника не найден" });
                return NoContent();
            default:
                return BadRequest(new { error = $"Неизвестный тип справочника: {type}" });
        }
    }
}
