using Bogus;
using GoldPC.SharedKernel.Entities;

namespace GoldPC.UnitTests.Fakers;

/// <summary>
/// Конфигурация ПК (тестовая модель)
/// </summary>
public class Configuration : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public Guid UserId { get; set; }
    public Guid ProcessorId { get; set; }
    public Guid MotherboardId { get; set; }
    public Guid RamId { get; set; }
    public Guid GpuId { get; set; }
    public Guid PsuId { get; set; }
    public Guid CaseId { get; set; }
    public Guid? CoolingId { get; set; }
    public List<Guid> StorageIds { get; set; } = new();
    public decimal TotalPrice { get; set; }
    public bool IsCompatible { get; set; }
}

/// <summary>
/// Faker для генерации тестовых данных конфигурации ПК
/// </summary>
public class ConfigurationFaker : Faker<Configuration>
{
    public ConfigurationFaker()
    {
        RuleFor(c => c.Id, f => f.Random.Guid());
        RuleFor(c => c.Name, f => f.Commerce.ProductName() + " Config");
        RuleFor(c => c.UserId, f => f.Random.Guid());
        RuleFor(c => c.ProcessorId, f => f.Random.Guid());
        RuleFor(c => c.MotherboardId, f => f.Random.Guid());
        RuleFor(c => c.RamId, f => f.Random.Guid());
        RuleFor(c => c.GpuId, f => f.Random.Guid());
        RuleFor(c => c.PsuId, f => f.Random.Guid());
        RuleFor(c => c.CaseId, f => f.Random.Guid());
        RuleFor(c => c.CoolingId, f => f.Random.Bool(0.8f) ? f.Random.Guid() : null);
        RuleFor(c => c.StorageIds, f => Enumerable.Range(0, f.Random.Int(1, 3)).Select(_ => f.Random.Guid()).ToList());
        RuleFor(c => c.TotalPrice, f => f.Random.Decimal(1000, 10000));
        RuleFor(c => c.IsCompatible, f => f.Random.Bool(0.9f));
        RuleFor(c => c.CreatedAt, f => f.Date.Past(1));
        RuleFor(c => c.UpdatedAt, f => f.Date.Recent(14));
    }

    #region Fluent Builder Methods

    public ConfigurationFaker ForUser(Guid userId)
    {
        RuleFor(c => c.UserId, userId);
        return this;
    }

    public ConfigurationFaker Compatible()
    {
        RuleFor(c => c.IsCompatible, true);
        return this;
    }

    public ConfigurationFaker Incompatible()
    {
        RuleFor(c => c.IsCompatible, false);
        return this;
    }

    #endregion
}
