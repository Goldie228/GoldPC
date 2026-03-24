using GoldPC.ServicesService.Data;
using GoldPC.ServicesService.Entities;
using GoldPC.SharedKernel.DTOs;
using GoldPC.SharedKernel.Enums;
using GoldPC.SharedKernel.Models;
using Microsoft.EntityFrameworkCore;
using GoldPC.Shared.Services.Interfaces;

namespace GoldPC.ServicesService.Services;

public interface IServicesService
{
    Task<ServiceRequestDto?> GetByIdAsync(Guid id);
    Task<PagedResult<ServiceRequestDto>> GetByClientIdAsync(Guid clientId, int page, int pageSize);
    Task<PagedResult<ServiceRequestDto>> GetByMasterIdAsync(Guid masterId, int page, int pageSize);
    Task<PagedResult<ServiceRequestDto>> GetAllAsync(int page, int pageSize, ServiceRequestStatus? status = null);
    Task<(ServiceRequestDto? Request, string? Error)> CreateAsync(Guid clientId, CreateServiceRequestRequest request);
    Task<(ServiceRequestDto? Request, string? Error)> AssignMasterAsync(Guid id, Guid masterId);
    Task<(ServiceRequestDto? Request, string? Error)> UpdateStatusAsync(Guid id, ServiceRequestStatus status, Guid changedBy, string? comment = null);
    Task<(ServiceRequestDto? Request, string? Error)> CompleteAsync(Guid id, Guid masterId, UpdateServiceRequestRequest request);
    Task<(bool Success, string? Error)> CancelAsync(Guid id, Guid userId);
    Task<List<ServiceTypeDto>> GetServiceTypesAsync();
    Task<(ServiceRequestDto? Request, string? Error)> AddPartAsync(Guid id, Guid masterId, ServicePartDto partDto);
    Task<WorkReportDto?> GenerateReportAsync(Guid id);
}

/// <summary>
/// Сервис управления заявками на услуги
/// Реализует бизнес-логику модуля "Услуги" (ФТ-4.1 - ФТ-4.11)
/// </summary>
public class ServicesService : IServicesService
{
    private readonly ServicesDbContext _context;
    private readonly ILogger<ServicesService> _logger;
    private readonly INotificationService _notificationService;
    
    /// <summary>
    /// Максимальное количество активных заявок у одного мастера (ФТ-4.6)
    /// </summary>
    private const int MaxActiveRequestsPerMaster = 3;

    public ServicesService(
        ServicesDbContext context, 
        ILogger<ServicesService> logger,
        INotificationService notificationService,
        IWarrantyClient? warrantyClient = null)
    {
        _context = context;
        _logger = logger;
        _notificationService = notificationService;
        _warrantyClient = warrantyClient;
    }

    public async Task<ServiceRequestDto?> GetByIdAsync(Guid id)
    {
        var request = await _context.ServiceRequests
            .Include(sr => sr.ServiceType)
            .Include(sr => sr.ServiceParts)
            .Include(sr => sr.WorkReports)
            .FirstOrDefaultAsync(sr => sr.Id == id);
        
        return request != null ? MapToDto(request) : null;
    }

    public async Task<PagedResult<ServiceRequestDto>> GetByClientIdAsync(Guid clientId, int page, int pageSize)
    {
        var query = _context.ServiceRequests
            .Include(sr => sr.ServiceType)
            .Where(sr => sr.ClientId == clientId)
            .OrderByDescending(sr => sr.CreatedAt);

        var totalCount = await query.CountAsync();
        var items = await query.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();

        return new PagedResult<ServiceRequestDto>
        {
            Items = items.Select(MapToDto).ToList(),
            TotalCount = totalCount,
            PageNumber = page,
            PageSize = pageSize
        };
    }

    public async Task<PagedResult<ServiceRequestDto>> GetByMasterIdAsync(Guid masterId, int page, int pageSize)
    {
        var query = _context.ServiceRequests
            .Include(sr => sr.ServiceType)
            .Where(sr => sr.MasterId == masterId)
            .OrderByDescending(sr => sr.CreatedAt);

        var totalCount = await query.CountAsync();
        var items = await query.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();

        return new PagedResult<ServiceRequestDto>
        {
            Items = items.Select(MapToDto).ToList(),
            TotalCount = totalCount,
            PageNumber = page,
            PageSize = pageSize
        };
    }

    public async Task<PagedResult<ServiceRequestDto>> GetAllAsync(int page, int pageSize, ServiceRequestStatus? status = null)
    {
        var query = _context.ServiceRequests.Include(sr => sr.ServiceType).AsQueryable();

        if (status.HasValue)
            query = query.Where(sr => sr.Status == status.Value);

        query = query.OrderByDescending(sr => sr.CreatedAt);

        var totalCount = await query.CountAsync();
        var items = await query.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();

        return new PagedResult<ServiceRequestDto>
        {
            Items = items.Select(MapToDto).ToList(),
            TotalCount = totalCount,
            PageNumber = page,
            PageSize = pageSize
        };
    }

    public async Task<(ServiceRequestDto? Request, string? Error)> CreateAsync(Guid clientId, CreateServiceRequestRequest request)
    {
        var serviceType = await _context.ServiceTypes.FindAsync(request.ServiceTypeId);
        if (serviceType == null)
            return (null, "Тип услуги не найден");

        var year = DateTime.UtcNow.Year;
        var lastRequest = await _context.ServiceRequests
            .Where(sr => sr.RequestNumber.StartsWith($"SR-{year}-"))
            .OrderByDescending(sr => sr.RequestNumber)
            .FirstOrDefaultAsync();

        var nextNumber = lastRequest != null ? int.Parse(lastRequest.RequestNumber.Split('-')[2]) + 1 : 1;
        var requestNumber = $"SR-{year}-{nextNumber:D6}";

        var serviceRequest = new ServiceRequest
        {
            Id = Guid.NewGuid(),
            RequestNumber = requestNumber,
            ClientId = clientId,
            ServiceTypeId = request.ServiceTypeId,
            Description = request.Description,
            DeviceModel = request.DeviceModel,
            SerialNumber = request.SerialNumber,
            EstimatedCost = serviceType.BasePrice,
            Status = ServiceRequestStatus.Submitted,
            CreatedAt = DateTime.UtcNow
        };

        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            _context.ServiceRequests.Add(serviceRequest);

            var report = new WorkReport
            {
                Id = Guid.NewGuid(),
                ServiceRequestId = serviceRequest.Id,
                PreviousStatus = ServiceRequestStatus.Submitted,
                NewStatus = ServiceRequestStatus.Submitted,
                Comment = "Заявка создана клиентом",
                ChangedBy = clientId,
                ChangedAt = DateTime.UtcNow
            };
            _context.WorkReports.Add(report);

            await _context.SaveChangesAsync();
            await transaction.CommitAsync();

            _logger.LogInformation("Service request created: {RequestNumber}", requestNumber);
            return (MapToDto(serviceRequest), null);
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            _logger.LogError(ex, "Error creating service request");
            return (null, "Ошибка при создании заявки");
        }
    }

    public async Task<(ServiceRequestDto? Request, string? Error)> AssignMasterAsync(Guid id, Guid masterId)
    {
        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            var request = await _context.ServiceRequests
                .Include(sr => sr.ServiceType)
                .FirstOrDefaultAsync(sr => sr.Id == id);

            if (request == null)
                return (null, "Заявка не найдена");

            if (request.Status != ServiceRequestStatus.Submitted)
                return (null, "Мастера можно назначить только для новой заявки");

            var activeCount = await _context.ServiceRequests
                .CountAsync(sr => sr.MasterId == masterId && 
                                 (sr.Status == ServiceRequestStatus.InProgress || 
                                  sr.Status == ServiceRequestStatus.PartsPending));
            
            if (activeCount >= MaxActiveRequestsPerMaster)
                return (null, $"У мастера уже {MaxActiveRequestsPerMaster} активных заявок (лимит FT-4.5)");

            var previousStatus = request.Status;
            request.MasterId = masterId;
            request.Status = ServiceRequestStatus.InProgress;
            request.UpdatedAt = DateTime.UtcNow;

            var report = new WorkReport
            {
                Id = Guid.NewGuid(),
                ServiceRequestId = request.Id,
                PreviousStatus = previousStatus,
                NewStatus = request.Status,
                Comment = "Назначен мастер, заявка принята в работу",
                ChangedBy = masterId, // В реальности это ID менеджера, но для простоты используем masterId или передаем changedBy
                ChangedAt = DateTime.UtcNow
            };
            _context.WorkReports.Add(report);

            await _context.SaveChangesAsync();
            await transaction.CommitAsync();

            _logger.LogInformation("Master {MasterId} assigned to request {RequestNumber}", masterId, request.RequestNumber);
            return (MapToDto(request), null);
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            _logger.LogError(ex, "Error assigning master");
            return (null, "Ошибка при назначении мастера");
        }
    }

    public async Task<(ServiceRequestDto? Request, string? Error)> UpdateStatusAsync(Guid id, ServiceRequestStatus newStatus, Guid changedBy, string? comment = null)
    {
        var request = await _context.ServiceRequests
            .Include(sr => sr.ServiceType)
            .FirstOrDefaultAsync(sr => sr.Id == id);

        if (request == null)
            return (null, "Заявка не найдена");

        var previousStatus = request.Status;
        
        if (!IsValidStatusTransition(previousStatus, newStatus))
        {
            return (null, $"Невозможно изменить статус с {GetStatusName(previousStatus)} на {GetStatusName(newStatus)}");
        }

        request.Status = newStatus;
        request.UpdatedAt = DateTime.UtcNow;

        if (newStatus == ServiceRequestStatus.Completed)
        {
            request.CompletedAt = DateTime.UtcNow;

            // Автоматическое создание гарантии на услуги (14 дней) (ФТ-5.2)
            if (_warrantyClient != null)
            {
                await _warrantyClient.CreateWarrantyAsync(new CreateWarrantyRequest
                {
                    ServiceRequestId = request.Id,
                    ProductId = Guid.Empty, // У услуги нет ProductId товара
                    ProductName = $"Услуга: {request.ServiceType?.Name ?? "Ремонт"}",
                    UserId = request.ClientId,
                    WarrantyMonths = 0,
                    WarrantyDays = 14 // 14 дней на услуги
                });
            }
        }

        var report = new WorkReport
        {
            Id = Guid.NewGuid(),
            ServiceRequestId = request.Id,
            PreviousStatus = previousStatus,
            NewStatus = newStatus,
            Comment = comment,
            ChangedBy = changedBy,
            ChangedAt = DateTime.UtcNow
        };
        _context.WorkReports.Add(report);

        await _context.SaveChangesAsync();

        // Уведомление клиента (ФТ-4.11)
        if (newStatus == ServiceRequestStatus.ReadyForPickup)
        {
            await _notificationService.SendPushNotificationAsync(
                request.ClientId.ToString(), 
                "Ваш заказ готов!", 
                $"Заявка {request.RequestNumber} переведена в статус 'Готова к выдаче'.");
        }

        _logger.LogInformation("Service request {RequestId} status changed: {PreviousStatus} -> {NewStatus}", 
            id, previousStatus, newStatus);

        return (MapToDto(request), null);
    }

    public async Task<(ServiceRequestDto? Request, string? Error)> CompleteAsync(Guid id, Guid masterId, UpdateServiceRequestRequest request)
    {
        var serviceRequest = await _context.ServiceRequests
            .Include(sr => sr.ServiceType)
            .Include(sr => sr.ServiceParts)
            .FirstOrDefaultAsync(sr => sr.Id == id);
            
        if (serviceRequest == null)
            return (null, "Заявка не найдена");

        if (serviceRequest.MasterId != masterId)
            return (null, "Вы не назначены на эту заявку");

        if (serviceRequest.Status != ServiceRequestStatus.InProgress)
            return (null, $"Невозможно завершить работу в статусе '{GetStatusName(serviceRequest.Status)}'");

        var previousStatus = serviceRequest.Status;
        serviceRequest.MasterComment = request.MasterComment;
        serviceRequest.UpdatedAt = DateTime.UtcNow;

        // Расчёт итоговой стоимости: работа + запчасти (ФТ-4.9)
        decimal partsTotal = serviceRequest.ServiceParts.Sum(p => p.Quantity * p.UnitPrice);
        var laborCost = request.ActualCost ?? serviceRequest.EstimatedCost;
        serviceRequest.ActualCost = laborCost + partsTotal;
        serviceRequest.Status = ServiceRequestStatus.ReadyForPickup;

        var report = new WorkReport
        {
            Id = Guid.NewGuid(),
            ServiceRequestId = serviceRequest.Id,
            PreviousStatus = previousStatus,
            NewStatus = ServiceRequestStatus.ReadyForPickup,
            Comment = $"Работа завершена. Итоговая стоимость: {serviceRequest.ActualCost:F2} (Работа: {laborCost:F2}, Запчасти: {partsTotal:F2})",
            ChangedBy = masterId,
            ChangedAt = DateTime.UtcNow
        };
        _context.WorkReports.Add(report);

        await _context.SaveChangesAsync();

        await _notificationService.SendPushNotificationAsync(
            serviceRequest.ClientId.ToString(), 
            "Ремонт окончен", 
            $"Ваше устройство {serviceRequest.DeviceModel} готово к выдаче. Сумма: {serviceRequest.ActualCost:F2} руб.");

        _logger.LogInformation("Service request {RequestId} moved to ReadyForPickup. Total cost: {TotalCost}", 
            id, serviceRequest.ActualCost);

        return (MapToDto(serviceRequest), null);
    }

    public async Task<(ServiceRequestDto? Request, string? Error)> AddPartAsync(Guid id, Guid masterId, ServicePartDto partDto)
    {
        var request = await _context.ServiceRequests.FindAsync(id);
        if (request == null) return (null, "Заявка не найдена");
        if (request.MasterId != masterId) return (null, "Доступ запрещен");
        
        var part = new ServicePart
        {
            Id = Guid.NewGuid(),
            ServiceRequestId = id,
            ProductId = partDto.ProductId,
            ProductName = partDto.ProductName,
            Quantity = partDto.Quantity,
            UnitPrice = partDto.UnitPrice
        };

        _context.ServiceParts.Add(part);
        
        // Если до этого статус был InProgress, возможно стоит перевести в PartsPending если мастер так решит
        // Но обычно части добавляются в процессе.
        
        await _context.SaveChangesAsync();
        return (MapToDto(request), null);
    }

    public async Task<WorkReportDto?> GenerateReportAsync(Guid id)
    {
        var lastReport = await _context.WorkReports
            .Where(wr => wr.ServiceRequestId == id)
            .OrderByDescending(wr => wr.ChangedAt)
            .FirstOrDefaultAsync();

        if (lastReport == null) return null;

        return new WorkReportDto
        {
            Id = lastReport.Id,
            ServiceRequestId = lastReport.ServiceRequestId,
            PreviousStatus = lastReport.PreviousStatus,
            NewStatus = lastReport.NewStatus,
            Comment = lastReport.Comment,
            ChangedBy = lastReport.ChangedBy,
            ChangedAt = lastReport.ChangedAt
        };
    }

    public async Task<(bool Success, string? Error)> CancelAsync(Guid id, Guid userId)
    {
        var request = await _context.ServiceRequests.FindAsync(id);
        if (request == null)
            return (false, "Заявка не найдена");

        if (request.Status != ServiceRequestStatus.Submitted)
            return (false, "Заявку нельзя отменить в текущем статусе");

        var previousStatus = request.Status;
        request.Status = ServiceRequestStatus.Cancelled;
        request.UpdatedAt = DateTime.UtcNow;

        var report = new WorkReport
        {
            Id = Guid.NewGuid(),
            ServiceRequestId = request.Id,
            PreviousStatus = previousStatus,
            NewStatus = ServiceRequestStatus.Cancelled,
            Comment = "Заявка отменена пользователем",
            ChangedBy = userId,
            ChangedAt = DateTime.UtcNow
        };
        _context.WorkReports.Add(report);

        await _context.SaveChangesAsync();

        return (true, null);
    }

    public async Task<List<ServiceTypeDto>> GetServiceTypesAsync()
    {
        return await _context.ServiceTypes
            .Where(st => st.IsActive)
            .Select(st => new ServiceTypeDto
            {
                Id = st.Id,
                Name = st.Name,
                Description = st.Description,
                BasePrice = st.BasePrice,
                EstimatedDurationMinutes = st.EstimatedDurationMinutes
            })
            .ToListAsync();
    }

    private static ServiceRequestDto MapToDto(ServiceRequest request)
    {
        return new ServiceRequestDto
        {
            Id = request.Id,
            RequestNumber = request.RequestNumber,
            ClientId = request.ClientId,
            MasterId = request.MasterId,
            ServiceTypeId = request.ServiceTypeId,
            ServiceTypeName = request.ServiceType?.Name ?? "",
            Status = request.Status,
            Description = request.Description,
            DeviceModel = request.DeviceModel,
            SerialNumber = request.SerialNumber,
            EstimatedCost = request.EstimatedCost,
            ActualCost = request.ActualCost,
            CreatedAt = request.CreatedAt,
            CompletedAt = request.CompletedAt,
            ServiceParts = request.ServiceParts?.Select(p => new ServicePartDto
            {
                ProductId = p.ProductId,
                ProductName = p.ProductName,
                Quantity = p.Quantity,
                UnitPrice = p.UnitPrice
            }).ToList() ?? new List<ServicePartDto>(),
            WorkReports = request.WorkReports?.Select(h => new WorkReportDto
            {
                Id = h.Id,
                ServiceRequestId = h.ServiceRequestId,
                PreviousStatus = h.PreviousStatus,
                NewStatus = h.NewStatus,
                Comment = h.Comment,
                ChangedBy = h.ChangedBy,
                ChangedAt = h.ChangedAt
            }).ToList() ?? new List<WorkReportDto>()
        };
    }

    private static bool IsValidStatusTransition(ServiceRequestStatus from, ServiceRequestStatus to)
    {
        if (to == ServiceRequestStatus.Cancelled)
            return from == ServiceRequestStatus.Submitted;

        return from switch
        {
            ServiceRequestStatus.Submitted => to == ServiceRequestStatus.InProgress,
            ServiceRequestStatus.InProgress => to == ServiceRequestStatus.PartsPending || to == ServiceRequestStatus.ReadyForPickup,
            ServiceRequestStatus.PartsPending => to == ServiceRequestStatus.InProgress,
            ServiceRequestStatus.ReadyForPickup => to == ServiceRequestStatus.Completed,
            ServiceRequestStatus.Completed => false,
            ServiceRequestStatus.Cancelled => false,
            _ => false
        };
    }

    private static string GetStatusName(ServiceRequestStatus status)
    {
        return status switch
        {
            ServiceRequestStatus.Submitted => "Подана",
            ServiceRequestStatus.InProgress => "В работе",
            ServiceRequestStatus.PartsPending => "Ожидание запчастей",
            ServiceRequestStatus.ReadyForPickup => "Готова к выдаче",
            ServiceRequestStatus.Completed => "Завершена",
            ServiceRequestStatus.Cancelled => "Отменена",
            _ => status.ToString()
        };
    }
}