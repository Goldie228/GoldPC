using System.Security.Claims;
using GoldPC.AuthService.Data;
using GoldPC.AuthService.Entities;
using GoldPC.SharedKernel.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace GoldPC.AuthService.Controllers;

/// <summary>
/// Контроллер избранного пользователя.
/// </summary>
[ApiController]
[Route("api/v1/wishlist")]
[Authorize]
public class WishlistController : ControllerBase
{
    private readonly AuthDbContext _dbContext;

    public WishlistController(AuthDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<List<Guid>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetWishlist()
    {
        var userId = GetCurrentUserId();
        if (userId == null)
        {
            return Unauthorized(ApiResponse.Fail("Пользователь не авторизован"));
        }

        var items = await _dbContext.WishlistItems
            .Where(i => i.UserId == userId.Value)
            .OrderBy(i => i.CreatedAt)
            .Select(i => i.ProductId)
            .ToListAsync();

        return Ok(ApiResponse<List<Guid>>.Ok(items));
    }

    [HttpPost("{productId:guid}")]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> AddItem(Guid productId)
    {
        var userId = GetCurrentUserId();
        if (userId == null)
        {
            return Unauthorized(ApiResponse.Fail("Пользователь не авторизован"));
        }

        var exists = await _dbContext.WishlistItems
            .AnyAsync(i => i.UserId == userId.Value && i.ProductId == productId);
        if (exists)
        {
            return Ok(ApiResponse.Ok("Товар уже в избранном"));
        }

        _dbContext.WishlistItems.Add(new WishlistItem
        {
            Id = Guid.NewGuid(),
            UserId = userId.Value,
            ProductId = productId,
            CreatedAt = DateTime.UtcNow
        });

        await _dbContext.SaveChangesAsync();
        return Ok(ApiResponse.Ok("Товар добавлен в избранное"));
    }

    [HttpDelete("{productId:guid}")]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> RemoveItem(Guid productId)
    {
        var userId = GetCurrentUserId();
        if (userId == null)
        {
            return Unauthorized(ApiResponse.Fail("Пользователь не авторизован"));
        }

        var entity = await _dbContext.WishlistItems
            .FirstOrDefaultAsync(i => i.UserId == userId.Value && i.ProductId == productId);
        if (entity == null)
        {
            return Ok(ApiResponse.Ok("Товар уже отсутствует в избранном"));
        }

        _dbContext.WishlistItems.Remove(entity);
        await _dbContext.SaveChangesAsync();
        return Ok(ApiResponse.Ok("Товар удалён из избранного"));
    }

    [HttpPut("sync")]
    [ProducesResponseType(typeof(ApiResponse<List<Guid>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> Sync([FromBody] List<Guid> productIds)
    {
        var userId = GetCurrentUserId();
        if (userId == null)
        {
            return Unauthorized(ApiResponse.Fail("Пользователь не авторизован"));
        }

        var normalized = productIds
            .Where(id => id != Guid.Empty)
            .Distinct()
            .ToHashSet();

        var existing = await _dbContext.WishlistItems
            .Where(i => i.UserId == userId.Value)
            .ToListAsync();

        var existingSet = existing.Select(i => i.ProductId).ToHashSet();
        var toDelete = existing.Where(i => !normalized.Contains(i.ProductId)).ToList();
        var toAdd = normalized.Where(id => !existingSet.Contains(id)).ToList();

        if (toDelete.Count > 0)
        {
            _dbContext.WishlistItems.RemoveRange(toDelete);
        }

        foreach (var productId in toAdd)
        {
            _dbContext.WishlistItems.Add(new WishlistItem
            {
                Id = Guid.NewGuid(),
                UserId = userId.Value,
                ProductId = productId,
                CreatedAt = DateTime.UtcNow
            });
        }

        if (toDelete.Count > 0 || toAdd.Count > 0)
        {
            await _dbContext.SaveChangesAsync();
        }

        var result = await _dbContext.WishlistItems
            .Where(i => i.UserId == userId.Value)
            .OrderBy(i => i.CreatedAt)
            .Select(i => i.ProductId)
            .ToListAsync();

        return Ok(ApiResponse<List<Guid>>.Ok(result));
    }

    private Guid? GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? User.FindFirst("sub")?.Value;
        return userIdClaim != null && Guid.TryParse(userIdClaim, out var userId) ? userId : null;
    }
}
