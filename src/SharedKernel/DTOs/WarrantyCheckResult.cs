#pragma warning disable CS1591, SA1600
namespace GoldPC.SharedKernel.DTOs;

/// <summary>
/// DTO результата проверки гарантии
/// </summary>
public class WarrantyCheckResult
{
    public bool IsValid { get; set; }

    public WarrantyDto? Warranty { get; set; }

    public string? Message { get; set; }

    public int? DaysRemaining { get; set; }
}
#pragma warning restore CS1591, SA1600
