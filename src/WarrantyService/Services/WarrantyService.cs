using GoldPC.WarrantyService.Data;
using GoldPC.WarrantyService.Entities;
using GoldPC.SharedKernel.DTOs;
using GoldPC.SharedKernel.Enums;
using GoldPC.SharedKernel.Models;
using GoldPC.Shared.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace GoldPC.WarrantyService.Services;

public interface IWarrantyService
{
    // Claims (Existing)
    Task<WarrantyClaimDto?> GetClaimByIdAsync(Guid id);
    Task<PagedResult<WarrantyClaimDto>> GetClaimsByUserIdAsync(Guid userId, int page, int pageSize);
    Task<PagedResult<WarrantyClaimDto>> GetAllClaimsAsync(int page, int pageSize, WarrantyStatus? status = null);
    Task<(WarrantyClaimDto? Claim, string? Error)> CreateClaimAsync(Guid userId, CreateWarrantyClaimRequest request);
    Task<(WarrantyClaimDto? Claim, string? Error)> UpdateClaimStatusAsync(Guid id, WarrantyStatus status, Guid changedBy, string? comment = null);
    Task<(WarrantyClaimDto? Claim, string? Error)> ResolveClaimAsync(Guid id, string resolution, Guid changedBy);

    // Cards (New)
    Task<WarrantyDto?> GetCardByIdAsync(Guid id);
    Task<WarrantyDto?> GetCardByNumberAsync(string warrantyNumber);
    Task<WarrantyDto?> GetCardByOrderIdAsync(Guid orderId);
    Task<WarrantyDto?> GetCardByServiceIdAsync(Guid serviceId);
    Task<WarrantyDto?> GetCardBySerialNumberAsync(string serialNumber);
    Task<PagedResult<WarrantyDto>> GetCardsByUserIdAsync(Guid userId, int page, int pageSize);
    Task<(WarrantyDto? Warranty, string? Error)> CreateCardAsync(CreateWarrantyRequest request);
    Task<(bool Success, string? Error)> AnnulCardAsync(Guid id, AnnulWarrantyRequest request, Guid userId);
    Task<int> ExpireWarrantiesAsync();
    Task<int> NotifyExpiringWarrantiesAsync();
}

public class WarrantyService : IWarrantyService
{
    private readonly WarrantyDbContext _context;
    private readonly ILogger<WarrantyService> _logger;
    private readonly INotificationService? _notificationService;

    public WarrantyService(WarrantyDbContext context, ILogger<WarrantyService> logger, INotificationService? notificationService = null)
    {
        _context = context;
        _logger = logger;
        _notificationService = notificationService;
    }

    #region Claims

    public async Task<WarrantyClaimDto?> GetClaimByIdAsync(Guid id)
    {
        var claim = await _context.WarrantyClaims.Include(w => w.History).FirstOrDefaultAsync(w => w.Id == id);
        return claim != null ? MapClaimToDto(claim) : null;
    }

    public async Task<PagedResult<WarrantyClaimDto>> GetClaimsByUserIdAsync(Guid userId, int page, int pageSize)
    {
        var query = _context.WarrantyClaims.Where(w => w.UserId == userId).OrderByDescending(w => w.CreatedAt);
        var totalCount = await query.CountAsync();
        var items = await query.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();
        return new PagedResult<WarrantyClaimDto> { Items = items.Select(MapClaimToDto).ToList(), TotalCount = totalCount, PageNumber = page, PageSize = pageSize };
    }

    public async Task<PagedResult<WarrantyClaimDto>> GetAllClaimsAsync(int page, int pageSize, WarrantyStatus? status = null)
    {
        var query = _context.WarrantyClaims.AsQueryable();
        if (status.HasValue) query = query.Where(w => w.Status == status.Value);
        query = query.OrderByDescending(w => w.CreatedAt);
        var totalCount = await query.CountAsync();
        var items = await query.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();
        return new PagedResult<WarrantyClaimDto> { Items = items.Select(MapClaimToDto).ToList(), TotalCount = totalCount, PageNumber = page, PageSize = pageSize };
    }

    public async Task<(WarrantyClaimDto? Claim, string? Error)> CreateClaimAsync(Guid userId, CreateWarrantyClaimRequest request)
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
        return (MapClaimToDto(claim), null);
    }

    public async Task<(WarrantyClaimDto? Claim, string? Error)> UpdateClaimStatusAsync(Guid id, WarrantyStatus newStatus, Guid changedBy, string? comment = null)
    {
        var claim = await _context.WarrantyClaims.FindAsync(id);
        if (claim == null) return (null, "Заявка не найдена");
        var previousStatus = claim.Status;
        claim.Status = newStatus;
        claim.UpdatedAt = DateTime.UtcNow;
        _context.WarrantyHistory.Add(new WarrantyHistory { Id = Guid.NewGuid(), WarrantyClaimId = claim.Id, PreviousStatus = previousStatus, NewStatus = newStatus, Comment = comment, ChangedBy = changedBy, ChangedAt = DateTime.UtcNow });
        await _context.SaveChangesAsync();
        return (MapClaimToDto(claim), null);
    }

    public async Task<(WarrantyClaimDto? Claim, string? Error)> ResolveClaimAsync(Guid id, string resolution, Guid changedBy)
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
        return (MapClaimToDto(claim), null);
    }

    #endregion

    #region Cards

    public async Task<WarrantyDto?> GetCardByIdAsync(Guid id)
    {
        var card = await _context.WarrantyCards.FirstOrDefaultAsync(w => w.Id == id);
        if (card == null) return null;
        var operations = await _context.WarrantyCardOperations.Where(o => o.WarrantyCardId == id).ToListAsync();
        return MapCardToDto(card, operations);
    }

    public async Task<WarrantyDto?> GetCardByNumberAsync(string warrantyNumber)
    {
        var card = await _context.WarrantyCards.FirstOrDefaultAsync(w => w.WarrantyNumber == warrantyNumber);
        if (card == null) return null;
        var operations = await _context.WarrantyCardOperations.Where(o => o.WarrantyCardId == card.Id).ToListAsync();
        return MapCardToDto(card, operations);
    }

    public async Task<WarrantyDto?> GetCardByOrderIdAsync(Guid orderId)
    {
        var card = await _context.WarrantyCards.FirstOrDefaultAsync(w => w.OrderId == orderId);
        if (card == null) return null;
        var operations = await _context.WarrantyCardOperations.Where(o => o.WarrantyCardId == card.Id).ToListAsync();
        return MapCardToDto(card, operations);
    }

    public async Task<WarrantyDto?> GetCardByServiceIdAsync(Guid serviceId)
    {
        var card = await _context.WarrantyCards.FirstOrDefaultAsync(w => w.ServiceRequestId == serviceId);
        if (card == null) return null;
        var operations = await _context.WarrantyCardOperations.Where(o => o.WarrantyCardId == card.Id).ToListAsync();
        return MapCardToDto(card, operations);
    }

    public async Task<WarrantyDto?> GetCardBySerialNumberAsync(string serialNumber)
    {
        var card = await _context.WarrantyCards.FirstOrDefaultAsync(w => w.SerialNumber == serialNumber);
        if (card == null) return null;
        var operations = await _context.WarrantyCardOperations.Where(o => o.WarrantyCardId == card.Id).ToListAsync();
        return MapCardToDto(card, operations);
    }

    public async Task<PagedResult<WarrantyDto>> GetCardsByUserIdAsync(Guid userId, int page, int pageSize)
    {
        var query = _context.WarrantyCards.Where(w => w.UserId == userId).OrderByDescending(w => w.CreatedAt);
        var totalCount = await query.CountAsync();
        var cards = await query.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();
        
        var dtos = new List<WarrantyDto>();
        foreach (var card in cards)
        {
            var operations = await _context.WarrantyCardOperations.Where(o => o.WarrantyCardId == card.Id).ToListAsync();
            dtos.Add(MapCardToDto(card, operations));
        }

        return new PagedResult<WarrantyDto> { Items = dtos, TotalCount = totalCount, PageNumber = page, PageSize = pageSize };
    }

    public async Task<(WarrantyDto? Warranty, string? Error)> CreateCardAsync(CreateWarrantyRequest request)
    {
        var year = DateTime.UtcNow.Year;
        var lastCard = await _context.WarrantyCards.Where(w => w.WarrantyNumber.StartsWith($"W-{year}-")).OrderByDescending(w => w.WarrantyNumber).FirstOrDefaultAsync();
        var nextNumber = lastCard != null ? int.Parse(lastCard.WarrantyNumber.Split('-')[2]) + 1 : 1;
        var warrantyNumber = $"W-{year}-{nextNumber:D6}";

        var card = new WarrantyCard
        {
            Id = Guid.NewGuid(),
            WarrantyNumber = warrantyNumber,
            OrderId = request.OrderId,
            ServiceRequestId = request.ServiceRequestId,
            ProductId = request.ProductId,
            ProductName = request.ProductName,
            SerialNumber = request.SerialNumber,
            UserId = request.UserId,
            StartDate = DateTime.UtcNow,
            EndDate = request.WarrantyDays.HasValue 
                ? DateTime.UtcNow.AddDays(request.WarrantyDays.Value)
                : DateTime.UtcNow.AddMonths(request.WarrantyMonths),
            WarrantyMonths = request.WarrantyMonths,
            Status = WarrantyStatus.Active,
            CreatedAt = DateTime.UtcNow
        };

        _context.WarrantyCards.Add(card);
        
        var operation = new WarrantyCardOperation
        {
            Id = Guid.NewGuid(),
            WarrantyCardId = card.Id,
            OperationType = "Created",
            Description = "Гарантийный талон создан",
            PerformedBy = request.UserId, // В реальности может быть системный ID
            PerformedAt = DateTime.UtcNow
        };
        _context.WarrantyCardOperations.Add(operation);

        await _context.SaveChangesAsync();
        _logger.LogInformation("Warranty card created: {WarrantyNumber}", warrantyNumber);
        
        return (MapCardToDto(card, new[] { operation }), null);
    }

    public async Task<(bool Success, string? Error)> AnnulCardAsync(Guid id, AnnulWarrantyRequest request, Guid userId)
    {
        var card = await _context.WarrantyCards.FindAsync(id);
        if (card == null) return (false, "Гарантийный талон не найден");

        if (card.Status == WarrantyStatus.Annulled)
            return (false, "Гарантийный талон уже аннулирован");

        card.Status = WarrantyStatus.Annulled;
        card.CancellationReason = request.Reason;
        card.UpdatedAt = DateTime.UtcNow;

        var operation = new WarrantyCardOperation
        {
            Id = Guid.NewGuid(),
            WarrantyCardId = card.Id,
            OperationType = "Annulled",
            Description = $"Гарантия аннулирована: {request.Reason}",
            PerformedBy = userId,
            PerformedAt = DateTime.UtcNow
        };
        _context.WarrantyCardOperations.Add(operation);

        await _context.SaveChangesAsync();
        _logger.LogInformation("Warranty card {WarrantyNumber} annulled by {UserId}", card.WarrantyNumber, userId);
        
        return (true, null);
    }

    public async Task<int> ExpireWarrantiesAsync()
    {
        var now = DateTime.UtcNow;
        var expiring = await _context.WarrantyCards
            .Where(w => w.Status == WarrantyStatus.Active && w.EndDate < now)
            .ToListAsync();

        foreach (var card in expiring)
        {
            card.Status = WarrantyStatus.Expired;
            card.UpdatedAt = now;
            
            _context.WarrantyCardOperations.Add(new WarrantyCardOperation
            {
                Id = Guid.NewGuid(),
                WarrantyCardId = card.Id,
                OperationType = "Expired",
                Description = "Срок действия гарантии истек",
                PerformedBy = Guid.Empty, // System
                PerformedAt = now
            });
        }

        if (expiring.Any())
        {
            await _context.SaveChangesAsync();
            _logger.LogInformation("Expired {Count} warranties", expiring.Count);
        }

        return expiring.Count;
    }

    public async Task<int> NotifyExpiringWarrantiesAsync()
    {
        if (_notificationService == null)
        {
            _logger.LogWarning("Notification service not registered, skipping notifications");
            return 0;
        }

        var targetDate = DateTime.UtcNow.Date.AddDays(30);
        var expiringSoon = await _context.WarrantyCards
            .Where(w => w.Status == WarrantyStatus.Active && w.EndDate.Date == targetDate)
            .ToListAsync();

        int notifiedCount = 0;
        foreach (var card in expiringSoon)
        {
            // В реальности здесь нужно получить Email пользователя через Identity сервис
            // Для целей этой задачи используем заглушку
            string userEmail = "customer@example.com"; // Mock email
            
            var result = await _notificationService.SendEmailAsync(
                userEmail, 
                "Срок действия гарантии истекает скоро", 
                $"Уважаемый клиент, гарантия на товар {card.ProductName} (номер {card.WarrantyNumber}) истекает через 30 дней ({card.EndDate:d}).");

            if (result.Success)
            {
                notifiedCount++;
            }
        }

        if (notifiedCount > 0)
        {
            _logger.LogInformation("Sent {Count} expiration notifications", notifiedCount);
        }

        return notifiedCount;
    }

    #endregion

    #region Helpers

    private static WarrantyClaimDto MapClaimToDto(WarrantyClaim claim) => new()
    {
        Id = claim.Id, ClaimNumber = claim.ClaimNumber, OrderId = claim.OrderId, UserId = claim.UserId,
        ProductId = claim.ProductId, ProductName = claim.ProductName, Status = claim.Status,
        Description = claim.Description, PurchaseDate = claim.PurchaseDate, WarrantyEndDate = claim.WarrantyEndDate,
        CreatedAt = claim.CreatedAt, ResolvedAt = claim.ResolvedAt, Resolution = claim.Resolution
    };

    private static WarrantyDto MapCardToDto(WarrantyCard card, IEnumerable<WarrantyCardOperation> operations)
    {
        var dto = new WarrantyDto
        {
            Id = card.Id,
            WarrantyNumber = card.WarrantyNumber,
            OrderId = card.OrderId,
            ServiceRequestId = card.ServiceRequestId,
            ProductId = card.ProductId,
            ProductName = card.ProductName,
            UserId = card.UserId,
            StartDate = DateOnly.FromDateTime(card.StartDate),
            EndDate = DateOnly.FromDateTime(card.EndDate),
            WarrantyMonths = card.WarrantyMonths,
            Status = card.Status,
            CreatedAt = card.CreatedAt
        };

        foreach (var op in operations)
        {
            dto.Operations.Add(new WarrantyOperationDto
            {
                Id = op.Id,
                WarrantyId = op.WarrantyCardId,
                OperationType = op.OperationType,
                Description = op.Description,
                RelatedServiceRequestId = op.RelatedServiceRequestId,
                PerformedAt = op.PerformedAt,
                PerformedBy = op.PerformedBy
            });
        }

        return dto;
    }

    #endregion
}
