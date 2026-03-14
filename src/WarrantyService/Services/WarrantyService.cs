using GoldPC.WarrantyService.Data;
using GoldPC.WarrantyService.Entities;
using GoldPC.SharedKernel.DTOs;
using GoldPC.SharedKernel.Enums;
using GoldPC.SharedKernel.Models;
using Microsoft.EntityFrameworkCore;

namespace GoldPC.WarrantyService.Services;

public interface IWarrantyService
{
    Task<WarrantyClaimDto?> GetByIdAsync(Guid id);
    Task<PagedResult<WarrantyClaimDto>> GetByUserIdAsync(Guid userId, int page, int pageSize);
    Task<PagedResult<WarrantyClaimDto>> GetAllAsync(int page, int pageSize, WarrantyStatus? status = null);
    Task<(WarrantyClaimDto? Claim, string? Error)> CreateAsync(Guid userId, CreateWarrantyClaimRequest request);
    Task<(WarrantyClaimDto? Claim, string? Error)> UpdateStatusAsync(Guid id, WarrantyStatus status, Guid changedBy, string? comment = null);
    Task<(WarrantyClaimDto? Claim, string? Error)> ResolveAsync(Guid id, string resolution, Guid changedBy);
}

public class WarrantyService : IWarrantyService
{
    private readonly WarrantyDbContext _context;
    private readonly ILogger<WarrantyService> _logger;

    public WarrantyService(WarrantyDbContext context, ILogger<WarrantyService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<WarrantyClaimDto?> GetByIdAsync(Guid id)
    {
        var claim = await _context.WarrantyClaims.Include(w => w.History).FirstOrDefaultAsync(w => w.Id == id);
        return claim != null ? MapToDto(claim) : null;
    }

    public async Task<PagedResult<WarrantyClaimDto>> GetByUserIdAsync(Guid userId, int page, int pageSize)
    {
        var query = _context.WarrantyClaims.Where(w => w.UserId == userId).OrderByDescending(w => w.CreatedAt);
        var totalCount = await query.CountAsync();
        var items = await query.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();
        return new PagedResult<WarrantyClaimDto> { Items = items.Select(MapToDto).ToList(), TotalCount = totalCount, PageNumber = page, PageSize = pageSize };
    }

    public async Task<PagedResult<WarrantyClaimDto>> GetAllAsync(int page, int pageSize, WarrantyStatus? status = null)
    {
        var query = _context.WarrantyClaims.AsQueryable();
        if (status.HasValue) query = query.Where(w => w.Status == status.Value);
        query = query.OrderByDescending(w => w.CreatedAt);
        var totalCount = await query.CountAsync();
        var items = await query.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();
        return new PagedResult<WarrantyClaimDto> { Items = items.Select(MapToDto).ToList(), TotalCount = totalCount, PageNumber = page, PageSize = pageSize };
    }

    public async Task<(WarrantyClaimDto? Claim, string? Error)> CreateAsync(Guid userId, CreateWarrantyClaimRequest request)
    {
        var year = DateTime.UtcNow.Year;
        var lastClaim = await _context.WarrantyClaims.Where(w => w.ClaimNumber.StartsWith($"WC-{year}-")).OrderByDescending(w => w.ClaimNumber).FirstOrDefaultAsync();
        var nextNumber = lastClaim != null ? int.Parse(lastClaim.ClaimNumber.Split('-')[2]) + 1 : 1;
        var claimNumber = $"WC-{year}-{nextNumber:D6}";

        var claim = new WarrantyClaim
        {
            Id = Guid.NewGuid(), ClaimNumber = claimNumber, OrderId = request.OrderId, UserId = userId,
            ProductId = request.ProductId, ProductName = request.ProductName, Description = request.Description,
            PurchaseDate = request.PurchaseDate, WarrantyPeriodMonths = request.WarrantyPeriodMonths,
            WarrantyEndDate = request.PurchaseDate.AddMonths(request.WarrantyPeriodMonths),
            Status = WarrantyStatus.New, CreatedAt = DateTime.UtcNow
        };

        _context.WarrantyClaims.Add(claim);
        _context.WarrantyHistory.Add(new WarrantyHistory { Id = Guid.NewGuid(), WarrantyClaimId = claim.Id, PreviousStatus = WarrantyStatus.New, NewStatus = WarrantyStatus.New, Comment = "Заявка создана", ChangedBy = userId, ChangedAt = DateTime.UtcNow });
        await _context.SaveChangesAsync();
        _logger.LogInformation("Warranty claim created: {ClaimNumber}", claimNumber);
        return (MapToDto(claim), null);
    }

    public async Task<(WarrantyClaimDto? Claim, string? Error)> UpdateStatusAsync(Guid id, WarrantyStatus newStatus, Guid changedBy, string? comment = null)
    {
        var claim = await _context.WarrantyClaims.FindAsync(id);
        if (claim == null) return (null, "Заявка не найдена");
        var previousStatus = claim.Status;
        claim.Status = newStatus;
        claim.UpdatedAt = DateTime.UtcNow;
        _context.WarrantyHistory.Add(new WarrantyHistory { Id = Guid.NewGuid(), WarrantyClaimId = claim.Id, PreviousStatus = previousStatus, NewStatus = newStatus, Comment = comment, ChangedBy = changedBy, ChangedAt = DateTime.UtcNow });
        await _context.SaveChangesAsync();
        return (MapToDto(claim), null);
    }

    public async Task<(WarrantyClaimDto? Claim, string? Error)> ResolveAsync(Guid id, string resolution, Guid changedBy)
    {
        var claim = await _context.WarrantyClaims.FindAsync(id);
        if (claim == null) return (null, "Заявка не найдена");
        var previousStatus = claim.Status;
        claim.Status = WarrantyStatus.Resolved;
        claim.Resolution = resolution;
        claim.ResolvedAt = DateTime.UtcNow;
        claim.UpdatedAt = DateTime.UtcNow;
        _context.WarrantyHistory.Add(new WarrantyHistory { Id = Guid.NewGuid(), WarrantyClaimId = claim.Id, PreviousStatus = previousStatus, NewStatus = WarrantyStatus.Resolved, Comment = resolution, ChangedBy = changedBy, ChangedAt = DateTime.UtcNow });
        await _context.SaveChangesAsync();
        return (MapToDto(claim), null);
    }

    private static WarrantyClaimDto MapToDto(WarrantyClaim claim) => new()
    {
        Id = claim.Id, ClaimNumber = claim.ClaimNumber, OrderId = claim.OrderId, UserId = claim.UserId,
        ProductId = claim.ProductId, ProductName = claim.ProductName, Status = claim.Status,
        Description = claim.Description, PurchaseDate = claim.PurchaseDate, WarrantyEndDate = claim.WarrantyEndDate,
        CreatedAt = claim.CreatedAt, ResolvedAt = claim.ResolvedAt, Resolution = claim.Resolution
    };
}