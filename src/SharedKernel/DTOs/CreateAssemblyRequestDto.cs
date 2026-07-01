#pragma warning disable CS1591, SA1600
namespace GoldPC.SharedKernel.DTOs;

/// <summary>
/// DTO для создания заявки на сборку ПК.
/// </summary>
public class CreateAssemblyRequestDto
{
    public Guid ClientId { get; set; }

    public Guid OrderId { get; set; }

    public Guid PCConfigurationId { get; set; }

    public string? ClientPhone { get; set; }
}
#pragma warning restore CS1591, SA1600
