using GoldPC.SharedKernel.Entities;
using GoldPC.SharedKernel.Enums;

namespace GoldPC.ServicesService.Entities;

/// <summary>
/// Комплектующая в заявке на сборку ПК
/// </summary>
public class AssemblyPart : BaseEntity
{
    /// <summary>
    /// ID заявки на сборку
    /// </summary>
    public Guid ServiceRequestId { get; set; }

    /// <summary>
    /// ID товара (компонента) из каталога
    /// </summary>
    public Guid ProductId { get; set; }

    /// <summary>
    /// Название комплектующей (снапшот)
    /// </summary>
    public string ProductName { get; set; } = string.Empty;

    /// <summary>
    /// Тип компонента (cpu, gpu, motherboard и т.д.)
    /// </summary>
    public string ComponentType { get; set; } = string.Empty;

    /// <summary>
    /// Количество
    /// </summary>
    public int Quantity { get; set; }

    /// <summary>
    /// Цена за единицу
    /// </summary>
    public decimal UnitPrice { get; set; }

    /// <summary>
    /// Статус комплектующей (требуется / получена / установлена)
    /// </summary>
    public AssemblyPartStatus PartStatus { get; set; } = AssemblyPartStatus.Required;

    /// <summary>
    /// Навигационное свойство к заявке
    /// </summary>
    public ServiceRequest ServiceRequest { get; set; } = null!;
}
