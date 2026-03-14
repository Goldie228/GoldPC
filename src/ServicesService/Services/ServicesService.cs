using GoldPC.ServicesService.Data;
using GoldPC.ServicesService.Entities;
using GoldPC.SharedKernel.DTOs;
using GoldPC.SharedKernel.Enums;
using GoldPC.SharedKernel.Models;
using Microsoft.EntityFrameworkCore;

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
}

public class ServicesService : IServicesService
{
    private readonly ServicesDbContext _context;
    private readonly ILogger<ServicesService> _logger;
    private const int MaxActiveRequestsPerMaster = 3;

    public ServicesService(ServicesDbContext context, ILogger<ServicesService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<ServiceRequestDto?> GetByIdAsync(Guid id)
    {
        var request = await _context.ServiceRequests
            .Include(sr => sr.ServiceType)
            .Include(sr => sr.UsedParts)
            .Include(sr => sr.History)
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
            Status = ServiceRequestStatus.New,
            CreatedAt = DateTime.UtcNow
        };

        _context.ServiceRequests.Add(serviceRequest);

        var history = new ServiceHistory
        {
            Id = Guid.NewGuid(),
            ServiceRequestId = serviceRequest.Id,
            PreviousStatus = ServiceRequestStatus.New,
            NewStatus = ServiceRequestStatus.New,
            Comment = "Заявка создана",
            ChangedBy = clientId,
            ChangedAt = DateTime.UtcNow
        };
        _context.ServiceHistory.Add(history);

        await _context.SaveChangesAsync();

        _logger.LogInformation("Service request created: {RequestNumber}", requestNumber);

        return (MapToDto(serviceRequest), null);
    }

    public async Task<(ServiceRequestDto? Request, string? Error)> AssignMasterAsync(Guid id, Guid masterId)
    {
        var request = await _context.ServiceRequests.FindAsync(id);
        if (request == null)
            return (null, "Заявка не найдена");

        var activeCount = await _context.ServiceRequests
            .CountAsync(sr => sr.MasterId == masterId && 
                             (sr.Status == ServiceRequestStatus.New || sr.Status == ServiceRequestStatus.InProgress));
        
        if (activeCount >= MaxActiveRequestsPerMaster)
            return (null, $"У мастера уже {MaxActiveRequestsPerMaster} активных заявок");

        var previousStatus = request.Status;
        request.MasterId = masterId;
        request.Status = ServiceRequestStatus.InProgress;
        request.UpdatedAt = DateTime.UtcNow;

        var history = new ServiceHistory
        {
            Id = Guid.NewGuid(),
            ServiceRequestId = request.Id,
            PreviousStatus = previousStatus,
            NewStatus = request.Status,
            Comment = "Назначен мастер",
            ChangedBy = masterId,
            ChangedAt = DateTime.UtcNow
        };
        _context.ServiceHistory.Add(history);

        await _context.SaveChangesAsync();

        return (MapToDto(request), null);
    }

    public async Task<(ServiceRequestDto? Request, string? Error)> UpdateStatusAsync(Guid id, ServiceRequestStatus newStatus, Guid changedBy, string? comment = null)
    {
        var request = await _context.ServiceRequests.FindAsync(id);
        if (request == null)
            return (null, "Заявка не найдена");

        var previousStatus = request.Status;
        request.Status = newStatus;
        request.UpdatedAt = DateTime.UtcNow;

        var history = new ServiceHistory
        {
            Id = Guid.NewGuid(),
            ServiceRequestId = request.Id,
            PreviousStatus = previousStatus,
            NewStatus = newStatus,
            Comment = comment,
            ChangedBy = changedBy,
            ChangedAt = DateTime.UtcNow
        };
        _context.ServiceHistory.Add(history);

        await _context.SaveChangesAsync();

        return (MapToDto(request), null);
    }

    public async Task<(ServiceRequestDto? Request, string? Error)> CompleteAsync(Guid id, Guid masterId, UpdateServiceRequestRequest request)
    {
        var serviceRequest = await _context.ServiceRequests.FindAsync(id);
        if (serviceRequest == null)
            return (null, "Заявка не найдена");

        if (serviceRequest.MasterId != masterId)
            return (null, "Вы не назначены на эту заявку");

        var previousStatus = serviceRequest.Status;
        serviceRequest.Status = ServiceRequestStatus.Completed;
        serviceRequest.MasterComment = request.MasterComment;
        serviceRequest.ActualCost = request.ActualCost ?? serviceRequest.EstimatedCost;
        serviceRequest.CompletedAt = DateTime.UtcNow;
        serviceRequest.UpdatedAt = DateTime.UtcNow;

        if (request.UsedParts != null)
        {
            foreach (var part in request.UsedParts)
            {
                _context.UsedParts.Add(new UsedPart
                {
                    Id = Guid.NewGuid(),
                    ServiceRequestId = serviceRequest.Id,
                    ProductId = part.ProductId,
                    ProductName = part.ProductName,
                    Quantity = part.Quantity,
                    UnitPrice = part.UnitPrice
                });
            }
        }

        var history = new ServiceHistory
        {
            Id = Guid.NewGuid(),
            ServiceRequestId = serviceRequest.Id,
            PreviousStatus = previousStatus,
            NewStatus = ServiceRequestStatus.Completed,
            Comment = "Работа выполнена",
            ChangedBy = masterId,
            ChangedAt = DateTime.UtcNow
        };
        _context.ServiceHistory.Add(history);

        await _context.SaveChangesAsync();

        return (MapToDto(serviceRequest), null);
    }

    public async Task<(bool Success, string? Error)> CancelAsync(Guid id, Guid userId)
    {
        var request = await _context.ServiceRequests.FindAsync(id);
        if (request == null)
            return (false, "Заявка не найдена");

        if (request.Status != ServiceRequestStatus.New)
            return (false, "Заявку нельзя отменить в текущем статусе");

        var previousStatus = request.Status;
        request.Status = ServiceRequestStatus.Cancelled;
        request.UpdatedAt = DateTime.UtcNow;

        var history = new ServiceHistory
        {
            Id = Guid.NewGuid(),
            ServiceRequestId = request.Id,
            PreviousStatus = previousStatus,
            NewStatus = ServiceRequestStatus.Cancelled,
            Comment = "Заявка отменена",
            ChangedBy = userId,
            ChangedAt = DateTime.UtcNow
        };
        _context.ServiceHistory.Add(history);

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
            History = request.History?.Select(h => new ServiceHistoryDto
            {
                Id = h.Id,
                ServiceRequestId = h.ServiceRequestId,
                PreviousStatus = h.PreviousStatus,
                NewStatus = h.NewStatus,
                Comment = h.Comment,
                ChangedBy = h.ChangedBy,
                ChangedAt = h.ChangedAt
            }).ToList() ?? new List<ServiceHistoryDto>()
        };
    }
}