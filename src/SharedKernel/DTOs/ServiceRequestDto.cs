#pragma warning disable CA2227, CS1591, SA1600
// Copyright (c) GoldPC. All rights reserved.

using GoldPC.SharedKernel.Enums;

namespace GoldPC.SharedKernel.DTOs;

/// <summary>
/// DTO заявки на услугу для обмена между сервисами.
/// </summary>
public class ServiceRequestDto
{
    public Guid Id { get; set; }

    public string RequestNumber { get; set; } = string.Empty;

    public Guid ClientId { get; set; }

    public Guid? MasterId { get; set; }

    public Guid ServiceTypeId { get; set; }

    public string ServiceTypeName { get; set; } = string.Empty;

    public ServiceRequestStatus Status { get; set; }

    public string Description { get; set; } = string.Empty;

    public string? DeviceModel { get; set; }

    public string? SerialNumber { get; set; }

    public decimal EstimatedCost { get; set; }

    public decimal ActualCost { get; set; }

    public string? MasterComment { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime? CompletedAt { get; set; }

    public ICollection<ServicePartDto> ServiceParts { get; set; } = new List<ServicePartDto>();

    public ICollection<WorkReportDto> WorkReports { get; set; } = new List<WorkReportDto>();

    /// <summary>
    /// Email клиента для уведомлений (опционально, заполняется при необходимости)
    /// </summary>
    public string? ClientEmail { get; set; }

    /// <summary>
    /// Имя мастера для уведомлений (опционально, заполняется при необходимости)
    /// </summary>
    public string? MasterName { get; set; }

    /// <summary>
    /// ID заказа (связь с заказом)
    /// </summary>
    public Guid? OrderId { get; set; }

    /// <summary>
    /// ID конфигурации ПК (для сборки)
    /// </summary>
    public Guid? PCConfigurationId { get; set; }

    /// <summary>
    /// Телефон клиента (для связи мастера с клиентом)
    /// </summary>
    public string? ClientPhone { get; set; }

    /// <summary>
    /// ID курьера (для доставки)
    /// </summary>
    public Guid? CourierId { get; set; }

    /// <summary>
    /// Серийный номер собранного ПК
    /// </summary>
    public string? AssembledSerialNumber { get; set; }

    /// <summary>
    /// Комплектующие для сборки ПК (заполняется для заявок типа assembly)
    /// </summary>
    public ICollection<AssemblyPartDto> AssemblyParts { get; set; } = new List<AssemblyPartDto>();

    /// <summary>
    /// Информация о собранном ПК (заполняется после завершения сборки)
    /// </summary>
    public AssembledUnitDto? AssembledUnit { get; set; }
}
#pragma warning restore CA2227, CS1591, SA1600
