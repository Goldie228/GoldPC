using GoldPC.WarrantyService.Data;
using GoldPC.WarrantyService.Entities;
using GoldPC.SharedKernel.DTOs;
using GoldPC.SharedKernel.Enums;
using GoldPC.SharedKernel.Models;
using GoldPC.Shared.Services.Interfaces;
using GoldPC.Shared.Services;
using Microsoft.EntityFrameworkCore;
using PagedResultClaim = GoldPC.SharedKernel.Models.PagedResult<GoldPC.SharedKernel.DTOs.WarrantyClaimDto>;
using PagedResultCard = GoldPC.SharedKernel.Models.PagedResult<GoldPC.SharedKernel.DTOs.WarrantyDto>;

namespace GoldPC.WarrantyService.Services;

public interface IWarrantyService
{
    // Claims (Existing)
    Task<WarrantyClaimDto?> GetClaimByIdAsync(Guid id);
    Task<PagedResultClaim> GetClaimsByUserIdAsync(Guid userId, int page, int pageSize);
    Task<PagedResultClaim> GetAllClaimsAsync(int page, int pageSize, WarrantyStatus? status = null);
    Task<(WarrantyClaimDto? Claim, string? Error)> CreateClaimAsync(Guid userId, CreateWarrantyClaimRequest request);
    Task<(WarrantyClaimDto? Claim, string? Error)> UpdateClaimStatusAsync(Guid id, WarrantyStatus status, Guid changedBy, string? comment = null);
    Task<(WarrantyClaimDto? Claim, string? Error)> ResolveClaimAsync(Guid id, string resolution, Guid changedBy);

    // Cards (New)
    Task<WarrantyDto?> GetCardByIdAsync(Guid id);
    Task<WarrantyDto?> GetCardByNumberAsync(string warrantyNumber);
    Task<WarrantyDto?> GetCardByOrderIdAsync(Guid orderId);
    Task<WarrantyDto?> GetCardByServiceIdAsync(Guid serviceId);
    Task<WarrantyDto?> GetCardBySerialNumberAsync(string serialNumber);
    Task<PagedResultCard> GetCardsByUserIdAsync(Guid userId, int page, int pageSize);
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
    private readonly IServiceProvider? _serviceProvider;

    public WarrantyService(WarrantyDbContext context, ILogger<WarrantyService> logger, INotificationService? notificationService = null, IServiceProvider? serviceProvider = null)
    {
        _context = context;
        _logger = logger;
        _notificationService = notificationService;
        _serviceProvider = serviceProvider;
    }

    #region Claims

    public async Task<WarrantyClaimDto?> GetClaimByIdAsync(Guid id)
    {
        var claim = await _context.WarrantyClaims.Include(w => w.History).FirstOrDefaultAsync(w => w.Id == id);
        return claim != null ? MapClaimToDto(claim) : null;
    }

    public async Task<PagedResultClaim> GetClaimsByUserIdAsync(Guid userId, int page, int pageSize)
    {
        var query = _context.WarrantyClaims.Where(w => w.UserId == userId).OrderByDescending(w => w.CreatedAt);
        var totalCount = await query.CountAsync();
        var items = await query.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();
        return new PagedResultClaim { Items = items.Select(MapClaimToDto).ToList(), TotalCount = totalCount, PageNumber = page, PageSize = pageSize };
    }

    public async Task<PagedResultClaim> GetAllClaimsAsync(int page, int pageSize, WarrantyStatus? status = null)
    {
        var query = _context.WarrantyClaims.AsQueryable();
        if (status.HasValue) query = query.Where(w => w.Status == status.Value);
        query = query.OrderByDescending(w => w.CreatedAt);
        var totalCount = await query.CountAsync();
        var items = await query.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();
        return new PagedResultClaim { Items = items.Select(MapClaimToDto).ToList(), TotalCount = totalCount, PageNumber = page, PageSize = pageSize };
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

    public async Task<PagedResultCard> GetCardsByUserIdAsync(Guid userId, int page, int pageSize)
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

        return new PagedResultCard { Items = dtos, TotalCount = totalCount, PageNumber = page, PageSize = pageSize };
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
            UserEmail = request.UserEmail,
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
        var targetDate = DateTime.UtcNow.Date.AddDays(30);
        var expiringSoon = await _context.WarrantyCards
            .Where(w => w.Status == WarrantyStatus.Active && w.EndDate.Date == targetDate)
            .ToListAsync();

        if (expiringSoon.Count == 0)
            return 0;

        // Пытаемся отправить email через OrderEmailService (если зарегистрирован)
        // Используем IEmailQueue из IServiceScope
        int notifiedCount = 0;
        foreach (var card in expiringSoon)
        {
            try
            {
                // Строим DTO для отправки
                var dto = new WarrantyDto
                {
                    Id = card.Id,
                    WarrantyNumber = card.WarrantyNumber,
                    ProductId = card.ProductId,
                    ProductName = card.ProductName,
                    UserId = card.UserId,
                    UserEmail = card.UserEmail,
                    StartDate = DateOnly.FromDateTime(card.StartDate),
                    EndDate = DateOnly.FromDateTime(card.EndDate),
                    WarrantyMonths = card.WarrantyMonths,
                    Status = card.Status,
                    CreatedAt = card.CreatedAt
                };

                // Отправляем email если есть адрес
                if (!string.IsNullOrWhiteSpace(card.UserEmail))
                {
                    // Используем IEmailQueue напрямую
                    var emailQueue = _serviceProvider?.GetService(typeof(Shared.Services.Background.IEmailQueue)) 
                        as Shared.Services.Background.IEmailQueue;
                    
                    if (emailQueue != null)
                    {
                        var subject = $"⚠️ Гарантия на «{card.ProductName}» истекает через 30 дней — GoldPC";
                        var body = BuildExpiryReminderHtml(card);
                        
                        await emailQueue.QueueEmailAsync(new Shared.Services.Background.EmailJob(
                            card.UserEmail, subject, body, IsHtml: true));
                        
                        _logger.LogInformation("Напоминание о гарантии отправлено: {WarrantyNumber} → {Email}", 
                            card.WarrantyNumber, card.UserEmail);
                    }
                }

                notifiedCount++;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Не удалось отправить напоминание для гарантии {WarrantyNumber}", card.WarrantyNumber);
            }
        }

        if (notifiedCount > 0)
        {
            _logger.LogInformation("Sent {Count} expiration notifications", notifiedCount);
        }

        return notifiedCount;
    }

    /// <summary>
    /// Построить HTML-письмо-напоминание об окончании гарантии (золотая тема GoldPC)
    /// </summary>
    private static string BuildExpiryReminderHtml(WarrantyCard card)
    {
        var daysLeft = (card.EndDate - DateTime.UtcNow.Date).Days;
        
        return $@"<!DOCTYPE html>
<html lang=""ru"">
<head><meta charset=""utf-8""><meta name=""viewport"" content=""width=device-width, initial-scale=1.0""></head>
<body style=""margin:0;padding:0;background-color:#1e2329;font-family:'Segoe UI',Arial,sans-serif;color:#eaecef;"">
<table width=""100%"" cellpadding=""0"" cellspacing=""0"" style=""background-color:#1e2329;padding:32px 16px;"">
<tr><td align=""center"">
<table width=""600"" cellpadding=""0"" cellspacing=""0"" style=""background-color:#2b3139;border-radius:12px;border:1px solid #363c45;overflow:hidden;"">
  <tr><td style=""background:linear-gradient(135deg,#f0b90b,#e67e22);padding:28px 32px;text-align:center;"">
    <h1 style=""margin:0;font-size:24px;color:#1e2329;font-weight:700;"">⚠️ Гарантия истекает</h1>
    <p style=""margin:6px 0 0;font-size:14px;color:#1e2329;opacity:0.8;"">Осталось {daysLeft} дн.</p>
  </td></tr>
  <tr><td style=""padding:28px 32px;"">
    <p style=""margin:0;font-size:15px;color:#848e9c;line-height:1.6;"">
      Срок действия гарантии на ваш товар приближается к завершению. Рекомендуем проверить работоспособность оборудования.
    </p>
    <table width=""100%"" cellpadding=""0"" cellspacing=""0"" style=""margin-top:20px;background-color:#1e2329;border-radius:8px;border:1px solid #363c45;overflow:hidden;"">
      <tr><td style=""padding:20px;"">
        <table width=""100%"" cellpadding=""0"" cellspacing=""0"">
          <tr><td style=""padding:8px 0;font-size:14px;color:#848e9c;width:40%;"">Товар</td><td style=""padding:8px 0;font-size:14px;color:#eaecef;font-weight:600;text-align:right;"" align=""right"">{card.ProductName}</td></tr>
          <tr><td style=""padding:8px 0;font-size:14px;color:#848e9c;"">Номер талона</td><td style=""padding:8px 0;font-size:14px;color:#FCD535;text-align:right;"" align=""right"">{card.WarrantyNumber}</td></tr>
          <tr><td style=""padding:8px 0;font-size:14px;color:#848e9c;"">Дата окончания</td><td style=""padding:8px 0;font-size:14px;color:#f6465d;font-weight:600;text-align:right;"" align=""right"">{card.EndDate:dd.MM.yyyy}</td></tr>
          <tr><td style=""padding:8px 0;font-size:14px;color:#848e9c;"">Осталось дней</td><td style=""padding:8px 0;font-size:14px;color:#f6465d;font-weight:700;text-align:right;"" align=""right"">{daysLeft}</td></tr>
        </table>
      </td></tr>
    </table>
    <p style=""margin:20px 0 0;font-size:14px;color:#848e9c;line-height:1.6;"">
      Если вы обнаружили неисправность, обратитесь в сервисный центр: <a href=""https://goldpc.by/service-request"" style=""color:#FCD535;text-decoration:none;"">Оставить заявку</a>
    </p>
  </td></tr>
  <tr><td style=""background-color:#1e2329;padding:20px 32px;border-top:1px solid #363c45;text-align:center;"">
    <p style=""margin:0;font-size:12px;color:#848e9c;line-height:1.6;"">
      Это автоматическое письмо от магазина <a href=""https://goldpc.by"" style=""color:#FCD535;text-decoration:none;"">GoldPC</a>. Пожалуйста, не отвечайте на него.
    </p>
  </td></tr>
</table>
</td></tr></table>
</body></html>";
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
            CreatedAt = card.CreatedAt,
            UserEmail = card.UserEmail
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
