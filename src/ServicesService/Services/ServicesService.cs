using GoldPC.ServicesService.Data;
using GoldPC.ServicesService.Entities;
using GoldPC.SharedKernel.DTOs;
using GoldPC.SharedKernel.Enums;
using GoldPC.SharedKernel.Models;
using Microsoft.EntityFrameworkCore;
using GoldPC.Shared.Services.Interfaces;
using GoldPC.Shared.Services;
using PagedResultServiceRequest = GoldPC.SharedKernel.Models.PagedResult<GoldPC.SharedKernel.DTOs.ServiceRequestDto>;

namespace GoldPC.ServicesService.Services;

public interface IServicesService
{
    Task<ServiceRequestDto?> GetByIdAsync(Guid id);
    Task<PagedResultServiceRequest> GetByClientIdAsync(Guid clientId, int page, int pageSize, ServiceRequestStatus? status = null);
    Task<PagedResultServiceRequest> GetByMasterIdAsync(Guid masterId, int page, int pageSize);
    Task<PagedResultServiceRequest> GetAllAsync(int page, int pageSize, ServiceRequestStatus? status = null);
    Task<(ServiceRequestDto? Request, string? Error)> CreateAsync(Guid clientId, CreateServiceRequestRequest request);
    Task<(ServiceRequestDto? Request, string? Error)> AssignMasterAsync(Guid id, Guid masterId, Guid changedBy);
    Task<(ServiceRequestDto? Request, string? Error)> UpdateStatusAsync(Guid id, ServiceRequestStatus status, Guid changedBy, string? comment = null);
    Task<(ServiceRequestDto? Request, string? Error)> CompleteAsync(Guid id, Guid masterId, UpdateServiceRequestRequest request);
    Task<(bool Success, string? Error)> CancelAsync(Guid id, Guid userId);
    Task<List<ServiceTypeDto>> GetServiceTypesAsync();
    Task<ServiceTypeDto?> GetServiceTypeBySlugAsync(string slug);
    Task<(ServiceRequestDto? Request, string? Error)> AddPartAsync(Guid id, Guid masterId, ServicePartDto partDto);
    Task<WorkReportDto?> GenerateReportAsync(Guid id);
    
    // Chat
    Task<List<TicketMessageDto>> GetMessagesAsync(Guid serviceRequestId, Guid userId, int page = 1, int pageSize = 50);
    Task<TicketMessageDto?> SendMessageAsync(Guid serviceRequestId, Guid userId, string authorRole, string content, string? fileUrl = null, string? fileName = null, long? fileSize = null, string? contentType = null);
    Task<int> GetUnreadCountAsync(Guid serviceRequestId, Guid userId);

    // Assembly methods
    Task<(ServiceRequestDto? Request, string? Error)> CreateAssemblyRequestAsync(Guid clientId, Guid orderId, Guid pcConfigurationId, string? clientPhone);
    Task<(ServiceRequestDto? Request, string? Error)> CollectPartAsync(Guid requestId, Guid partId, Guid masterId);
    Task<(ServiceRequestDto? Request, string? Error)> InstallPartAsync(Guid requestId, Guid partId, Guid masterId);
    Task<(ServiceRequestDto? Request, string? Error)> StartAssemblyAsync(Guid requestId, Guid masterId);
    Task<(ServiceRequestDto? Request, string? Error)> CompleteAssemblyAsync(Guid requestId, Guid masterId, string serialNumber);
    Task<(ServiceRequestDto? Request, string? Error)> HandToDeliveryAsync(Guid requestId, Guid masterId);
    Task<List<AssemblyPartDto>> GetAssemblyPartsAsync(Guid requestId);
    Task<(ServiceRequestDto? Request, string? Error)> ReassignMasterAsync(Guid requestId, Guid newMasterId, Guid managerId);
    Task<PagedResultServiceRequest> GetCourierDeliveriesAsync(Guid courierId, int page, int pageSize, ServiceRequestStatus? status = null);
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
    private readonly IWarrantyClient? _warrantyClient;
    
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
            .Include(sr => sr.AssemblyParts)
            .Include(sr => sr.WorkReports)
            .Include(sr => sr.AssembledUnit)
            .FirstOrDefaultAsync(sr => sr.Id == id);
        
        return request != null ? MapToDto(request) : null;
    }

    public async Task<PagedResultServiceRequest> GetByClientIdAsync(Guid clientId, int page, int pageSize, ServiceRequestStatus? status = null)
    {
        var query = _context.ServiceRequests
            .Include(sr => sr.ServiceType)
            .Where(sr => sr.ClientId == clientId);

        if (status.HasValue)
            query = query.Where(sr => sr.Status == status.Value);

        query = query.OrderByDescending(sr => sr.CreatedAt);

        var totalCount = await query.CountAsync();
        var items = await query.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();

        return new PagedResultServiceRequest
        {
            Items = items.Select(MapToDto).ToList(),
            TotalCount = totalCount,
            PageNumber = page,
            PageSize = pageSize
        };
    }

    public async Task<PagedResultServiceRequest> GetByMasterIdAsync(Guid masterId, int page, int pageSize)
    {
        var query = _context.ServiceRequests
            .Include(sr => sr.ServiceType)
            .Where(sr => sr.MasterId == masterId)
            .OrderByDescending(sr => sr.CreatedAt);

        var totalCount = await query.CountAsync();
        var items = await query.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();

        return new PagedResultServiceRequest
        {
            Items = items.Select(MapToDto).ToList(),
            TotalCount = totalCount,
            PageNumber = page,
            PageSize = pageSize
        };
    }

    public async Task<PagedResultServiceRequest> GetAllAsync(int page, int pageSize, ServiceRequestStatus? status = null)
    {
        var query = _context.ServiceRequests.Include(sr => sr.ServiceType).AsQueryable();

        if (status.HasValue)
            query = query.Where(sr => sr.Status == status.Value);

        query = query.OrderByDescending(sr => sr.CreatedAt);

        var totalCount = await query.CountAsync();
        var items = await query.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();

        return new PagedResultServiceRequest
        {
            Items = items.Select(MapToDto).ToList(),
            TotalCount = totalCount,
            PageNumber = page,
            PageSize = pageSize
        };
    }

    public async Task<PagedResultServiceRequest> GetCourierDeliveriesAsync(Guid courierId, int page, int pageSize, ServiceRequestStatus? status = null)
    {
        var deliveryStatuses = new[] { ServiceRequestStatus.ReadyForDelivery, ServiceRequestStatus.InDelivery };

        IQueryable<ServiceRequest> query = _context.ServiceRequests
            .Include(sr => sr.ServiceType)
            .Where(sr => deliveryStatuses.Contains(sr.Status) &&
                         (sr.CourierId == courierId || sr.CourierId == null));

        if (status.HasValue)
            query = query.Where(sr => sr.Status == status.Value);

        query = query.OrderByDescending(sr => sr.CreatedAt);

        var totalCount = await query.CountAsync();
        var items = await query.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();

        return new PagedResultServiceRequest
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

    public async Task<(ServiceRequestDto? Request, string? Error)> AssignMasterAsync(Guid id, Guid masterId, Guid changedBy)
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

            var activeCount = await GetMasterActiveCountAsync(masterId);
            
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
                ChangedBy = changedBy,
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
        if (request.Status != ServiceRequestStatus.InProgress)
            return (null, "Запчасти можно добавить только в заявке 'В работе'");
        
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

        var requestWithIncludes = await _context.ServiceRequests
            .Include(sr => sr.ServiceType)
            .Include(sr => sr.ServiceParts)
            .Include(sr => sr.AssemblyParts)
            .Include(sr => sr.WorkReports)
            .Include(sr => sr.AssembledUnit)
            .FirstOrDefaultAsync(sr => sr.Id == id);

        return (MapToDto(requestWithIncludes!), null);
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
        var request = await _context.ServiceRequests
            .Include(sr => sr.ServiceType)
            .FirstOrDefaultAsync(sr => sr.Id == id);
        if (request == null)
            return (false, "Заявка не найдена");

        if (request.Status != ServiceRequestStatus.Submitted && request.Status != ServiceRequestStatus.Assigned)
            return (false, "Заявку можно отменить только в статусе 'Подана' или 'Назначена'");

        // For assembly tickets in InProgress or later: reject cancellation, warn about parts
        var isAssembly = request.ServiceType?.Slug == "assembly";
        var blockingStatuses = new[] {
            ServiceRequestStatus.InProgress,
            ServiceRequestStatus.PartsPending,
            ServiceRequestStatus.AwaitingParts,
            ServiceRequestStatus.PartsReady,
            ServiceRequestStatus.Assembled,
            ServiceRequestStatus.ReadyForDelivery,
            ServiceRequestStatus.InDelivery,
            ServiceRequestStatus.Delivered
        };
        if (isAssembly && blockingStatuses.Contains(request.Status))
        {
            _logger.LogWarning("Attempted to cancel assembly request {RequestId} in status {Status} — parts may need to be returned",
                request.Id, request.Status);
            return (false, "Невозможно отменить заявку на сборку в статусе 'В работе' или позже. Необходимо вернуть комплектующие на склад.");
        }

        var previousStatus = request.Status;
        request.Status = ServiceRequestStatus.Cancelled;
        request.UpdatedAt = DateTime.UtcNow;

        var comment = isAssembly
            ? "Заявка на сборку отменена. Частичная работа может потребовать возврата комплектующих."
            : "Заявка отменена пользователем";

        var report = new WorkReport
        {
            Id = Guid.NewGuid(),
            ServiceRequestId = request.Id,
            PreviousStatus = previousStatus,
            NewStatus = ServiceRequestStatus.Cancelled,
            Comment = comment,
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
                Slug = st.Slug,
                Description = st.Description,
                BasePrice = st.BasePrice,
                EstimatedDurationMinutes = st.EstimatedDurationMinutes
            })
            .ToListAsync();
    }

    public async Task<ServiceTypeDto?> GetServiceTypeBySlugAsync(string slug)
    {
        return await _context.ServiceTypes
            .Where(st => st.IsActive && st.Slug == slug.ToLower())
            .Select(st => new ServiceTypeDto
            {
                Id = st.Id,
                Name = st.Name,
                Slug = st.Slug,
                Description = st.Description,
                BasePrice = st.BasePrice,
                EstimatedDurationMinutes = st.EstimatedDurationMinutes
            })
            .FirstOrDefaultAsync();
    }

    // ──────────────────────────────────────────────
    // Assembly methods
    // ──────────────────────────────────────────────

    public async Task<(ServiceRequestDto? Request, string? Error)> CreateAssemblyRequestAsync(Guid clientId, Guid orderId, Guid pcConfigurationId, string? clientPhone)
    {
        var assemblyServiceType = await _context.ServiceTypes
            .FirstOrDefaultAsync(st => st.Slug == "assembly" && st.IsActive);

        if (assemblyServiceType == null)
            return (null, "Тип услуги 'Сборка ПК' не найден");

        // Check if request already exists for this order
        var existing = await _context.ServiceRequests
            .FirstOrDefaultAsync(sr => sr.OrderId == orderId && sr.ServiceTypeId == assemblyServiceType.Id);
        if (existing != null)
            return (null, "Заявка на сборку для этого заказа уже существует");

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
            ServiceTypeId = assemblyServiceType.Id,
            Description = $"Сборка ПК на заказ (заказ {orderId})",
            EstimatedCost = assemblyServiceType.BasePrice,
            Status = ServiceRequestStatus.Submitted,
            OrderId = orderId,
            PCConfigurationId = pcConfigurationId,
            ClientPhone = clientPhone,
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
                Comment = "Заявка на сборку ПК создана",
                ChangedBy = clientId,
                ChangedAt = DateTime.UtcNow
            };
            _context.WorkReports.Add(report);

            try
            {
                await _context.SaveChangesAsync();

                // Auto-assign master
                await AutoAssignMasterInternalAsync(serviceRequest.Id);

                await transaction.CommitAsync();

                _logger.LogInformation("Assembly request created: {RequestNumber}", requestNumber);
                return (MapToDto(serviceRequest), null);
            }
            catch (DbUpdateException)
            {
                await transaction.RollbackAsync();
                _logger.LogInformation("Assembly request already exists for Order {OrderId}", orderId);
                var duplicate = await _context.ServiceRequests
                    .FirstOrDefaultAsync(sr => sr.OrderId == orderId && sr.ServiceTypeId == assemblyServiceType.Id);
                return (duplicate != null ? MapToDto(duplicate) : null, null);
            }
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            _logger.LogError(ex, "Error creating assembly request");
            return (null, "Ошибка при создании заявки на сборку");
        }
    }

    public async Task<(ServiceRequestDto? Request, string? Error)> CollectPartAsync(Guid requestId, Guid partId, Guid masterId)
    {
        var request = await _context.ServiceRequests.FindAsync(requestId);
        if (request == null) return (null, "Заявка не найдена");
        if (request.MasterId != masterId) return (null, "Вы не назначены на эту заявку");

        var part = await _context.AssemblyParts.FirstOrDefaultAsync(p => p.Id == partId && p.ServiceRequestId == requestId);
        if (part == null) return (null, "Комплектующая не найдена");
        if (part.PartStatus != AssemblyPartStatus.Required)
            return (null, "Комплектующая уже получена или установлена");

        part.PartStatus = AssemblyPartStatus.Collected;
        part.UpdatedAt = DateTime.UtcNow;
        request.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        _logger.LogInformation("Part {PartId} collected for request {RequestId}", partId, requestId);

        var requestWithIncludes = await _context.ServiceRequests
            .Include(sr => sr.ServiceType)
            .Include(sr => sr.ServiceParts)
            .Include(sr => sr.AssemblyParts)
            .Include(sr => sr.WorkReports)
            .Include(sr => sr.AssembledUnit)
            .FirstOrDefaultAsync(sr => sr.Id == requestId);

        return (MapToDto(requestWithIncludes!), null);
    }

    public async Task<(ServiceRequestDto? Request, string? Error)> InstallPartAsync(Guid requestId, Guid partId, Guid masterId)
    {
        var request = await _context.ServiceRequests.FindAsync(requestId);
        if (request == null) return (null, "Заявка не найдена");
        if (request.MasterId != masterId) return (null, "Вы не назначены на эту заявку");

        var part = await _context.AssemblyParts.FirstOrDefaultAsync(p => p.Id == partId && p.ServiceRequestId == requestId);
        if (part == null) return (null, "Комплектующая не найдена");
        if (part.PartStatus != AssemblyPartStatus.Collected)
            return (null, "Комплектующая ещё не получена");

        part.PartStatus = AssemblyPartStatus.Installed;
        part.UpdatedAt = DateTime.UtcNow;
        request.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        _logger.LogInformation("Part {PartId} installed for request {RequestId}", partId, requestId);

        var requestWithIncludes = await _context.ServiceRequests
            .Include(sr => sr.ServiceType)
            .Include(sr => sr.ServiceParts)
            .Include(sr => sr.AssemblyParts)
            .Include(sr => sr.WorkReports)
            .Include(sr => sr.AssembledUnit)
            .FirstOrDefaultAsync(sr => sr.Id == requestId);

        return (MapToDto(requestWithIncludes!), null);
    }

    public async Task<(ServiceRequestDto? Request, string? Error)> StartAssemblyAsync(Guid requestId, Guid masterId)
    {
        var request = await _context.ServiceRequests
            .Include(sr => sr.AssemblyParts)
            .FirstOrDefaultAsync(sr => sr.Id == requestId);

        if (request == null) return (null, "Заявка не найдена");
        if (request.MasterId != masterId) return (null, "Вы не назначены на эту заявку");
        if (request.Status != ServiceRequestStatus.Assigned)
            return (null, "Можно начать сборку только из статуса 'Назначена'");

        request.Status = ServiceRequestStatus.InProgress;
        request.UpdatedAt = DateTime.UtcNow;

        var report = new WorkReport
        {
            Id = Guid.NewGuid(),
            ServiceRequestId = request.Id,
            PreviousStatus = ServiceRequestStatus.Assigned,
            NewStatus = ServiceRequestStatus.InProgress,
            Comment = "Мастер начал сборку ПК",
            ChangedBy = masterId,
            ChangedAt = DateTime.UtcNow
        };
        _context.WorkReports.Add(report);

        await _context.SaveChangesAsync();

        _logger.LogInformation("Assembly started for request {RequestId}", requestId);
        return (MapToDto(request), null);
    }

    public async Task<(ServiceRequestDto? Request, string? Error)> CompleteAssemblyAsync(Guid requestId, Guid masterId, string serialNumber)
    {
        var request = await _context.ServiceRequests
            .Include(sr => sr.ServiceType)
            .Include(sr => sr.AssemblyParts)
            .FirstOrDefaultAsync(sr => sr.Id == requestId);

        if (request == null) return (null, "Заявка не найдена");
        if (request.MasterId != masterId) return (null, "Вы не назначены на эту заявку");
        if (request.Status != ServiceRequestStatus.InProgress)
            return (null, "Можно завершить сборку только из статуса 'В работе'");

        // Check all parts are installed
        var allInstalled = request.AssemblyParts.All(p => p.PartStatus == AssemblyPartStatus.Installed);
        if (!allInstalled)
            return (null, "Не все комплектующие установлены");

        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            request.Status = ServiceRequestStatus.Assembled;
            request.AssembledSerialNumber = serialNumber;
            request.CompletedAt = DateTime.UtcNow;
            request.ActualCost = request.EstimatedCost;
            request.UpdatedAt = DateTime.UtcNow;

            var assembledUnit = new AssembledUnit
            {
                Id = Guid.NewGuid(),
                ServiceRequestId = request.Id,
                PCConfigurationId = request.PCConfigurationId ?? Guid.Empty,
                SerialNumber = serialNumber,
                Status = AssembledUnitStatus.Stored,
                AssembledAt = DateTime.UtcNow,
                CreatedAt = DateTime.UtcNow
            };
            _context.AssembledUnits.Add(assembledUnit);

            var report = new WorkReport
            {
                Id = Guid.NewGuid(),
                ServiceRequestId = request.Id,
                PreviousStatus = ServiceRequestStatus.InProgress,
                NewStatus = ServiceRequestStatus.Assembled,
                Comment = $"Сборка ПК завершена. Серийный номер: {serialNumber}",
                ChangedBy = masterId,
                ChangedAt = DateTime.UtcNow
            };
            _context.WorkReports.Add(report);

            await _context.SaveChangesAsync();
            await transaction.CommitAsync();

            _logger.LogInformation("Assembly completed for request {RequestId}, serial: {Serial}", requestId, serialNumber);
            return (MapToDto(request), null);
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    public async Task<(ServiceRequestDto? Request, string? Error)> HandToDeliveryAsync(Guid requestId, Guid masterId)
    {
        var request = await _context.ServiceRequests.FindAsync(requestId);
        if (request == null) return (null, "Заявка не найдена");
        if (request.MasterId != masterId) return (null, "Вы не назначены на эту заявку");
        if (request.Status != ServiceRequestStatus.Assembled)
            return (null, "Можно передать в доставку только из статуса 'Собран'");

        request.Status = ServiceRequestStatus.ReadyForDelivery;
        request.UpdatedAt = DateTime.UtcNow;

        var report = new WorkReport
        {
            Id = Guid.NewGuid(),
            ServiceRequestId = request.Id,
            PreviousStatus = ServiceRequestStatus.Assembled,
            NewStatus = ServiceRequestStatus.ReadyForDelivery,
            Comment = "ПК передан в доставку",
            ChangedBy = masterId,
            ChangedAt = DateTime.UtcNow
        };
        _context.WorkReports.Add(report);

        await _context.SaveChangesAsync();

        _logger.LogInformation("Request {RequestId} handed to delivery", requestId);

        var requestWithIncludes = await _context.ServiceRequests
            .Include(sr => sr.ServiceType)
            .Include(sr => sr.ServiceParts)
            .Include(sr => sr.AssemblyParts)
            .Include(sr => sr.WorkReports)
            .Include(sr => sr.AssembledUnit)
            .FirstOrDefaultAsync(sr => sr.Id == requestId);

        return (MapToDto(requestWithIncludes!), null);
    }

    public async Task<List<AssemblyPartDto>> GetAssemblyPartsAsync(Guid requestId)
    {
        return await _context.AssemblyParts
            .Where(p => p.ServiceRequestId == requestId)
            .Select(p => new AssemblyPartDto
            {
                Id = p.Id,
                ProductId = p.ProductId,
                ProductName = p.ProductName,
                ComponentType = p.ComponentType,
                Quantity = p.Quantity,
                UnitPrice = p.UnitPrice,
                PartStatus = p.PartStatus
            })
            .ToListAsync();
    }

    public async Task<(ServiceRequestDto? Request, string? Error)> ReassignMasterAsync(Guid requestId, Guid newMasterId, Guid managerId)
    {
        var request = await _context.ServiceRequests.FindAsync(requestId);
        if (request == null) return (null, "Заявка не найдена");
        if (request.Status != ServiceRequestStatus.Assigned && request.Status != ServiceRequestStatus.Submitted)
            return (null, "Можно переназначить только заявку в статусе 'Назначена' или 'Подана'");

        // Check new master capacity
        var activeCount = await GetMasterActiveCountAsync(newMasterId);

        if (activeCount >= MaxActiveRequestsPerMaster)
            return (null, $"У мастера уже {MaxActiveRequestsPerMaster} активных заявок");

        var previousMasterId = request.MasterId;
        var previousStatus = request.Status;
        request.MasterId = newMasterId;
        if (request.Status == ServiceRequestStatus.Submitted)
            request.Status = ServiceRequestStatus.Assigned;
        request.UpdatedAt = DateTime.UtcNow;

        var report = new WorkReport
        {
            Id = Guid.NewGuid(),
            ServiceRequestId = request.Id,
            PreviousStatus = previousStatus,
            NewStatus = request.Status,
            Comment = $"Переназначение мастера с {previousMasterId} на {newMasterId}",
            ChangedBy = managerId,
            ChangedAt = DateTime.UtcNow
        };
        _context.WorkReports.Add(report);

        await _context.SaveChangesAsync();

        _logger.LogInformation("Request {RequestId} reassigned to master {MasterId}", requestId, newMasterId);

        var requestWithIncludes = await _context.ServiceRequests
            .Include(sr => sr.ServiceType)
            .Include(sr => sr.ServiceParts)
            .Include(sr => sr.AssemblyParts)
            .Include(sr => sr.WorkReports)
            .Include(sr => sr.AssembledUnit)
            .FirstOrDefaultAsync(sr => sr.Id == requestId);

        return (MapToDto(requestWithIncludes!), null);
    }

    private async Task<int> GetMasterActiveCountAsync(Guid masterId)
    {
        return await _context.ServiceRequests
            .CountAsync(sr => sr.MasterId == masterId &&
                             (sr.Status == ServiceRequestStatus.Assigned ||
                              sr.Status == ServiceRequestStatus.InProgress ||
                              sr.Status == ServiceRequestStatus.PartsPending ||
                              sr.Status == ServiceRequestStatus.PartsReady ||
                              sr.Status == ServiceRequestStatus.AwaitingParts));
    }

    private async Task AutoAssignMasterInternalAsync(Guid serviceRequestId)
    {
        var request = await _context.ServiceRequests.FindAsync(serviceRequestId);
        if (request == null || request.Status != ServiceRequestStatus.Submitted)
            return;

        var masters = await _context.ServiceRequests
            .Where(sr => sr.MasterId.HasValue &&
                        (sr.Status == ServiceRequestStatus.Assigned ||
                         sr.Status == ServiceRequestStatus.InProgress ||
                         sr.Status == ServiceRequestStatus.PartsPending ||
                         sr.Status == ServiceRequestStatus.PartsReady ||
                         sr.Status == ServiceRequestStatus.AwaitingParts))
            .GroupBy(sr => sr.MasterId)
            .Select(g => new { MasterId = g.Key!.Value, ActiveCount = g.Count() })
            .OrderBy(x => x.ActiveCount)
            .ToListAsync();

        var availableMaster = masters.FirstOrDefault(m => m.ActiveCount < MaxActiveRequestsPerMaster);

        if (availableMaster != null)
        {
            request.MasterId = availableMaster.MasterId;
            request.Status = ServiceRequestStatus.Assigned;
            request.UpdatedAt = DateTime.UtcNow;

            var report = new WorkReport
            {
                Id = Guid.NewGuid(),
                ServiceRequestId = request.Id,
                PreviousStatus = ServiceRequestStatus.Submitted,
                NewStatus = ServiceRequestStatus.Assigned,
                Comment = "Автоназначение: мастер назначен системой",
                ChangedBy = availableMaster.MasterId,
                ChangedAt = DateTime.UtcNow
            };
            _context.WorkReports.Add(report);

            await _context.SaveChangesAsync();

            _logger.LogInformation("Master auto-assigned to request {RequestNumber}", request.RequestNumber);
        }
    }

    public async Task<List<TicketMessageDto>> GetMessagesAsync(Guid serviceRequestId, Guid userId, int page = 1, int pageSize = 50)
    {
        if (!await HasAccessToTicket(serviceRequestId, userId))
            return new List<TicketMessageDto>();

        var messages = await _context.TicketMessages
            .Where(m => m.ServiceRequestId == serviceRequestId)
            .OrderByDescending(m => m.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return messages.Select(MapToMessageDto).ToList();
    }

    public async Task<TicketMessageDto?> SendMessageAsync(Guid serviceRequestId, Guid userId, string authorRole, string content, string? fileUrl = null, string? fileName = null, long? fileSize = null, string? contentType = null)
    {
        if (!await HasAccessToTicket(serviceRequestId, userId, authorRole))
            return null;

        var message = new TicketMessage
        {
            Id = Guid.NewGuid(),
            ServiceRequestId = serviceRequestId,
            AuthorId = userId,
            AuthorRole = authorRole,
            Content = content,
            FileUrl = fileUrl,
            FileName = fileName,
            FileSize = fileSize,
            ContentType = contentType,
            CreatedAt = DateTime.UtcNow
        };

        _context.TicketMessages.Add(message);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Message sent to ticket {TicketId} by user {UserId}", serviceRequestId, userId);
        return MapToMessageDto(message);
    }

    public async Task<int> GetUnreadCountAsync(Guid serviceRequestId, Guid userId)
    {
        return await _context.TicketMessages
            .CountAsync(m => m.ServiceRequestId == serviceRequestId
                          && m.AuthorId != userId
                          && m.ReadAt == null);
    }

    private async Task<bool> HasAccessToTicket(Guid serviceRequestId, Guid userId, string? role = null)
    {
        var request = await _context.ServiceRequests.FindAsync(serviceRequestId);
        if (request == null) return false;
        return request.ClientId == userId ||
               request.MasterId == userId ||
               role is "Manager" or "Admin";
    }

    private static TicketMessageDto MapToMessageDto(TicketMessage message)
    {
        return new TicketMessageDto
        {
            Id = message.Id,
            ServiceRequestId = message.ServiceRequestId,
            AuthorId = message.AuthorId,
            AuthorRole = message.AuthorRole,
            Content = message.Content,
            FileUrl = message.FileUrl,
            FileName = message.FileName,
            FileSize = message.FileSize,
            ContentType = message.ContentType,
            CreatedAt = message.CreatedAt,
            ReadAt = message.ReadAt
        };
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
            MasterComment = request.MasterComment,
            CreatedAt = request.CreatedAt,
            CompletedAt = request.CompletedAt,
            OrderId = request.OrderId,
            PCConfigurationId = request.PCConfigurationId,
            ClientPhone = request.ServiceType?.Slug == "assembly" ? request.ClientPhone : null,
            CourierId = request.CourierId,
            AssembledSerialNumber = request.AssembledSerialNumber,
            ServiceParts = request.ServiceParts?.Select(p => new ServicePartDto
            {
                ProductId = p.ProductId,
                ProductName = p.ProductName,
                Quantity = p.Quantity,
                UnitPrice = p.UnitPrice
            }).ToList() ?? new List<ServicePartDto>(),
            AssemblyParts = request.AssemblyParts?.Select(p => new AssemblyPartDto
            {
                Id = p.Id,
                ProductId = p.ProductId,
                ProductName = p.ProductName,
                ComponentType = p.ComponentType,
                Quantity = p.Quantity,
                UnitPrice = p.UnitPrice,
                PartStatus = p.PartStatus
            }).ToList() ?? new List<AssemblyPartDto>(),
            WorkReports = request.WorkReports?.Select(h => new WorkReportDto
            {
                Id = h.Id,
                ServiceRequestId = h.ServiceRequestId,
                PreviousStatus = h.PreviousStatus,
                NewStatus = h.NewStatus,
                Comment = h.Comment,
                ChangedBy = h.ChangedBy,
                ChangedAt = h.ChangedAt
            }).ToList() ?? new List<WorkReportDto>(),
            ClientEmail = null,
            MasterName = null,
            AssembledUnit = request.AssembledUnit != null ? new AssembledUnitDto
            {
                Id = request.AssembledUnit.Id,
                ServiceRequestId = request.AssembledUnit.ServiceRequestId,
                PCConfigurationId = request.AssembledUnit.PCConfigurationId,
                SerialNumber = request.AssembledUnit.SerialNumber,
                Status = request.AssembledUnit.Status,
                AssembledAt = request.AssembledUnit.AssembledAt,
                DeliveredAt = request.AssembledUnit.DeliveredAt
            } : null
        };
    }

    private static bool IsValidStatusTransition(ServiceRequestStatus from, ServiceRequestStatus to)
    {
        if (to == ServiceRequestStatus.Cancelled)
            return from == ServiceRequestStatus.Submitted || from == ServiceRequestStatus.Assigned;

        return from switch
        {
            ServiceRequestStatus.Submitted => to == ServiceRequestStatus.InProgress || to == ServiceRequestStatus.Assigned,
            ServiceRequestStatus.Assigned => to == ServiceRequestStatus.InProgress || to == ServiceRequestStatus.AwaitingParts,
            ServiceRequestStatus.InProgress => to == ServiceRequestStatus.PartsPending || to == ServiceRequestStatus.ReadyForPickup || to == ServiceRequestStatus.Assembled || to == ServiceRequestStatus.AwaitingParts,
            ServiceRequestStatus.AwaitingParts => to == ServiceRequestStatus.PartsReady || to == ServiceRequestStatus.InProgress,
            ServiceRequestStatus.PartsReady => to == ServiceRequestStatus.InProgress,
            ServiceRequestStatus.PartsPending => to == ServiceRequestStatus.InProgress,
            ServiceRequestStatus.Assembled => to == ServiceRequestStatus.ReadyForDelivery || to == ServiceRequestStatus.ReadyForPickup,
            ServiceRequestStatus.ReadyForDelivery => to == ServiceRequestStatus.InDelivery,
            ServiceRequestStatus.InDelivery => to == ServiceRequestStatus.Delivered,
            ServiceRequestStatus.Delivered => to == ServiceRequestStatus.Completed,
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
            ServiceRequestStatus.Assigned => "Назначена",
            ServiceRequestStatus.AwaitingParts => "Ожидание комплектующих",
            ServiceRequestStatus.PartsReady => "Комплектующие готовы",
            ServiceRequestStatus.Assembled => "Собран",
            ServiceRequestStatus.ReadyForDelivery => "Готов к доставке",
            ServiceRequestStatus.InDelivery => "В доставке",
            ServiceRequestStatus.Delivered => "Доставлен",
            _ => status.ToString()
        };
    }
}