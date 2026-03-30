using GoldPC.AuthService.Data;
using GoldPC.AuthService.Entities;
using GoldPC.SharedKernel.DTOs;
using GoldPC.SharedKernel.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace GoldPC.AuthService.Controllers;

/// <summary>
/// Контроллер управления адресами доставки пользователя
/// </summary>
[ApiController]
[Route("api/v1/auth/address")]
[Authorize]
public class AddressController : ControllerBase
{
    private readonly AuthDbContext _context;
    private readonly ILogger<AddressController> _logger;

    public AddressController(AuthDbContext context, ILogger<AddressController> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// Получение списка адресов пользователя
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<List<UserAddressDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAddresses()
    {
        var userId = GetCurrentUserId();
        if (userId == null)
        {
            return Unauthorized(ApiResponse.Fail("Пользователь не авторизован"));
        }

        var addresses = await _context.UserAddresses
            .Where(a => a.UserId == userId.Value)
            .OrderByDescending(a => a.IsDefault)
            .ThenByDescending(a => a.CreatedAt)
            .ToListAsync();

        var dtos = addresses.Select(MapToDto).ToList();
        return Ok(ApiResponse<List<UserAddressDto>>.Ok(dtos));
    }

    /// <summary>
    /// Получение адреса по ID
    /// </summary>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(ApiResponse<UserAddressDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetAddress(Guid id)
    {
        var userId = GetCurrentUserId();
        if (userId == null)
        {
            return Unauthorized(ApiResponse.Fail("Пользователь не авторизован"));
        }

        var address = await _context.UserAddresses
            .FirstOrDefaultAsync(a => a.Id == id && a.UserId == userId.Value);

        if (address == null)
        {
            return NotFound(ApiResponse.Fail("Адрес не найден"));
        }

        return Ok(ApiResponse<UserAddressDto>.Ok(MapToDto(address)));
    }

    /// <summary>
    /// Создание нового адреса
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(ApiResponse<UserAddressDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreateAddress([FromBody] CreateUserAddressRequest request)
    {
        var userId = GetCurrentUserId();
        if (userId == null)
        {
            return Unauthorized(ApiResponse.Fail("Пользователь не авторизован"));
        }

        // Если это первый адрес или установлен флаг IsDefault, сделать его адресом по умолчанию
        var hasAddresses = await _context.UserAddresses.AnyAsync(a => a.UserId == userId.Value);
        var isDefault = !hasAddresses || request.IsDefault;

        // Если устанавливаем новый адрес по умолчанию, снять флаг с остальных
        if (isDefault)
        {
            var existingDefaultAddresses = await _context.UserAddresses
                .Where(a => a.UserId == userId.Value && a.IsDefault)
                .ToListAsync();

            foreach (var addr in existingDefaultAddresses)
            {
                addr.IsDefault = false;
            }
        }

        var address = new UserAddress
        {
            Id = Guid.NewGuid(),
            UserId = userId.Value,
            Name = request.Name,
            City = request.City,
            Address = request.Address,
            Apartment = request.Apartment,
            PostalCode = request.PostalCode,
            IsDefault = isDefault,
            CreatedAt = DateTime.UtcNow
        };

        _context.UserAddresses.Add(address);
        await _context.SaveChangesAsync();

        _logger.LogInformation("User {UserId} created address {AddressId}", userId.Value, address.Id);

        return CreatedAtAction(
            nameof(GetAddress),
            new { id = address.Id },
            ApiResponse<UserAddressDto>.Ok(MapToDto(address), "Адрес успешно создан"));
    }

    /// <summary>
    /// Обновление адреса
    /// </summary>
    [HttpPut("{id}")]
    [ProducesResponseType(typeof(ApiResponse<UserAddressDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateAddress(Guid id, [FromBody] UpdateUserAddressRequest request)
    {
        var userId = GetCurrentUserId();
        if (userId == null)
        {
            return Unauthorized(ApiResponse.Fail("Пользователь не авторизован"));
        }

        var address = await _context.UserAddresses
            .FirstOrDefaultAsync(a => a.Id == id && a.UserId == userId.Value);

        if (address == null)
        {
            return NotFound(ApiResponse.Fail("Адрес не найден"));
        }

        // Если устанавливаем новый адрес по умолчанию, снять флаг с остальных
        if (request.IsDefault && !address.IsDefault)
        {
            var existingDefaultAddresses = await _context.UserAddresses
                .Where(a => a.UserId == userId.Value && a.IsDefault && a.Id != id)
                .ToListAsync();

            foreach (var addr in existingDefaultAddresses)
            {
                addr.IsDefault = false;
            }
        }

        address.Name = request.Name;
        address.City = request.City;
        address.Address = request.Address;
        address.Apartment = request.Apartment;
        address.PostalCode = request.PostalCode;
        address.IsDefault = request.IsDefault;
        address.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        _logger.LogInformation("User {UserId} updated address {AddressId}", userId.Value, address.Id);

        return Ok(ApiResponse<UserAddressDto>.Ok(MapToDto(address), "Адрес успешно обновлён"));
    }

    /// <summary>
    /// Удаление адреса
    /// </summary>
    [HttpDelete("{id}")]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteAddress(Guid id)
    {
        var userId = GetCurrentUserId();
        if (userId == null)
        {
            return Unauthorized(ApiResponse.Fail("Пользователь не авторизован"));
        }

        var address = await _context.UserAddresses
            .FirstOrDefaultAsync(a => a.Id == id && a.UserId == userId.Value);

        if (address == null)
        {
            return NotFound(ApiResponse.Fail("Адрес не найден"));
        }

        _context.UserAddresses.Remove(address);
        await _context.SaveChangesAsync();

        _logger.LogInformation("User {UserId} deleted address {AddressId}", userId.Value, address.Id);

        return Ok(ApiResponse.Ok("Адрес успешно удалён"));
    }

    /// <summary>
    /// Установка адреса по умолчанию
    /// </summary>
    [HttpPut("{id}/default")]
    [ProducesResponseType(typeof(ApiResponse<UserAddressDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> SetDefaultAddress(Guid id)
    {
        var userId = GetCurrentUserId();
        if (userId == null)
        {
            return Unauthorized(ApiResponse.Fail("Пользователь не авторизован"));
        }

        var address = await _context.UserAddresses
            .FirstOrDefaultAsync(a => a.Id == id && a.UserId == userId.Value);

        if (address == null)
        {
            return NotFound(ApiResponse.Fail("Адрес не найден"));
        }

        // Снять флаг по умолчанию с других адресов
        var otherAddresses = await _context.UserAddresses
            .Where(a => a.UserId == userId.Value && a.IsDefault && a.Id != id)
            .ToListAsync();

        foreach (var addr in otherAddresses)
        {
            addr.IsDefault = false;
        }

        address.IsDefault = true;
        address.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        _logger.LogInformation("User {UserId} set address {AddressId} as default", userId.Value, address.Id);

        return Ok(ApiResponse<UserAddressDto>.Ok(MapToDto(address), "Адрес установлен по умолчанию"));
    }

    private Guid? GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value 
            ?? User.FindFirst("sub")?.Value;
        
        return userIdClaim != null && Guid.TryParse(userIdClaim, out var userId) 
            ? userId 
            : null;
    }

    private static UserAddressDto MapToDto(UserAddress address)
    {
        return new UserAddressDto
        {
            Id = address.Id,
            UserId = address.UserId,
            Name = address.Name,
            City = address.City,
            Address = address.Address,
            Apartment = address.Apartment,
            PostalCode = address.PostalCode,
            IsDefault = address.IsDefault,
            CreatedAt = address.CreatedAt
        };
    }
}
