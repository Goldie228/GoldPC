namespace GoldPC.ReportingService.Models;

public class SalesPerformanceReport
{
    public DateTime Date { get; set; }
    public decimal Revenue { get; set; }
    public decimal Profit { get; set; }
    public int OrdersCount { get; set; }
}

public class ServiceEfficiencyReport
{
    public Guid MasterId { get; set; }
    public string MasterName { get; set; } = string.Empty;
    public int ActiveTasks { get; set; }
    public int CompletedTasks { get; set; }
    public double EfficiencyRate { get; set; }
}

public class InventoryAnalyticsReport
{
    public Guid ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public int CurrentStock { get; set; }
    public int LowStockThreshold { get; set; }
    public double SalesVelocity { get; set; } // items sold per day
    public int SuggestedOrderQuantity { get; set; }
    public bool IsLowStock => CurrentStock <= LowStockThreshold;
}

public class AuditEntry
{
    public Guid Id { get; set; }
    public string ServiceName { get; set; } = string.Empty;
    public string Action { get; set; } = string.Empty;
    public string EntityName { get; set; } = string.Empty;
    public Guid? EntityId { get; set; }
    public string? ChangedBy { get; set; }
    public DateTime ChangedAt { get; set; }
    public string? Details { get; set; }
}
