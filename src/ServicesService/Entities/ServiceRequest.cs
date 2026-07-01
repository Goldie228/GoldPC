using GoldPC.SharedKernel.Entities;
using GoldPC.SharedKernel.Enums;

namespace GoldPC.ServicesService.Entities;

/// <summary>
/// Заявка на услугу (ремонт, диагностика, сборка)
/// </summary>
public class ServiceRequest : BaseEntity
{
    public string RequestNumber { get; set; } = string.Empty;
    public Guid ClientId { get; set; }
    public Guid? MasterId { get; set; }
    public Guid ServiceTypeId { get; set; }
    public ServiceRequestStatus Status { get; set; } = ServiceRequestStatus.Submitted;
    public string Description { get; set; } = string.Empty;
    public string? DeviceModel { get; set; }
    public string? SerialNumber { get; set; }
    public decimal EstimatedCost { get; set; }
    public decimal ActualCost { get; set; }
    public string? MasterComment { get; set; }
    public DateTime? CompletedAt { get; set; }

    /// <summary>
    /// ID заказа (связь с OrdersService)
    /// </summary>
    public Guid? OrderId { get; set; }

    /// <summary>
    /// ID конфигурации ПК (для заявок типа сборка)
    /// </summary>
    public Guid? PCConfigurationId { get; set; }

    /// <summary>
    /// Телефон клиента (снапшот для связи)
    /// </summary>
    public string? ClientPhone { get; set; }

    /// <summary>
    /// ID курьера (для доставки)
    /// </summary>
    public Guid? CourierId { get; set; }

    /// <summary>
    /// Серийный номер собранного ПК (заполняется при завершении сборки)
    /// </summary>
    public string? AssembledSerialNumber { get; set; }
    
    public ServiceType ServiceType { get; set; } = null!;
    public ICollection<ServicePart> ServiceParts { get; set; } = new List<ServicePart>();
    public ICollection<AssemblyPart> AssemblyParts { get; set; } = new List<AssemblyPart>();
    public ICollection<WorkReport> WorkReports { get; set; } = new List<WorkReport>();
    public ICollection<TicketMessage> TicketMessages { get; set; } = new List<TicketMessage>();
    public AssembledUnit? AssembledUnit { get; set; }
}

/// <summary>
/// Тип услуги
/// </summary>
public class ServiceType
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal BasePrice { get; set; }
    public int EstimatedDurationMinutes { get; set; }
    public bool IsActive { get; set; } = true;
    
    public ICollection<ServiceRequest> ServiceRequests { get; set; } = new List<ServiceRequest>();
}

/// <summary>
/// Использованные запчасти (ФТ-4.8)
/// </summary>
public class ServicePart
{
    public Guid Id { get; set; }
    public Guid ServiceRequestId { get; set; }
    public Guid ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    
    public ServiceRequest ServiceRequest { get; set; } = null!;
}

/// <summary>
/// Отчет о работе / История изменений (ФТ-4.11)
/// </summary>
public class WorkReport
{
    public Guid Id { get; set; }
    public Guid ServiceRequestId { get; set; }
    public ServiceRequestStatus PreviousStatus { get; set; }
    public ServiceRequestStatus NewStatus { get; set; }
    public string? Comment { get; set; }
    public Guid ChangedBy { get; set; }
    public DateTime ChangedAt { get; set; } = DateTime.UtcNow;
    
    public ServiceRequest ServiceRequest { get; set; } = null!;
}