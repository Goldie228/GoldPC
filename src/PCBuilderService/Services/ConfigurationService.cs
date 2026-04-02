using Microsoft.EntityFrameworkCore;
using PCBuilderService.Data;
using PCBuilderService.DTOs;
using PCBuilderService.Models;
using Shared.Protos;

namespace PCBuilderService.Services;

public class ConfigurationService : IConfigurationService
{
    private readonly PCBuilderDbContext _db;
    private readonly ILogger<ConfigurationService> _logger;
    private readonly CatalogGrpc.CatalogGrpcClient _catalogClient;

    public ConfigurationService(
        PCBuilderDbContext db,
        ILogger<ConfigurationService> logger,
        CatalogGrpc.CatalogGrpcClient catalogClient)
    {
        _db = db;
        _logger = logger;
        _catalogClient = catalogClient;
    }

    public async Task<PCConfiguration?> GetConfigurationAsync(Guid id)
    {
        return await _db.PCConfigurations.AsNoTracking().FirstOrDefaultAsync(c => c.Id == id);
    }

    public async Task<IEnumerable<PCConfiguration>> GetUserConfigurationsAsync(Guid userId)
    {
        return await _db.PCConfigurations.AsNoTracking()
            .Where(c => c.UserId == userId)
            .OrderByDescending(c => c.CreatedAt)
            .ToListAsync();
    }

    public async Task<PCConfiguration> SaveConfigurationAsync(PCConfiguration config)
    {
        if (config.Id == Guid.Empty)
        {
            config.Id = Guid.NewGuid();
            config.CreatedAt = DateTime.UtcNow;
            _db.PCConfigurations.Add(config);
            _logger.LogInformation("Создана новая конфигурация {ConfigId}", config.Id);
        }
        else
        {
            config.UpdatedAt = DateTime.UtcNow;
            var existing = await _db.PCConfigurations.FindAsync(config.Id);
            if (existing != null)
            {
                _db.Entry(existing).CurrentValues.SetValues(config);
                _logger.LogInformation("Обновлена конфигурация {ConfigId}", config.Id);
            }
            else
            {
                _db.PCConfigurations.Add(config);
            }
        }
        await _db.SaveChangesAsync();
        return config;
    }

    public async Task<bool> DeleteConfigurationAsync(Guid id)
    {
        var config = await _db.PCConfigurations.FindAsync(id);
        if (config == null) return false;
        _db.PCConfigurations.Remove(config);
        await _db.SaveChangesAsync();
        return true;
    }

    public async Task<decimal> CalculateTotalPriceAsync(PCConfigurationDto dto)
    {
        var result = await CalculatePriceWithDetailsAsync(dto);
        return result.TotalPrice;
    }

    public async Task<ConfigurationPriceResult> CalculatePriceWithDetailsAsync(
        PCConfigurationDto dto, string? promoCode = null)
    {
        var componentMap = BuildComponentMap(dto);
        var ids = componentMap.Values.Select(v => v.ToString()).ToList();
        var result = new ConfigurationPriceResult();

        if (!ids.Any()) return result;

        ProductsResponse grpcResponse;
        try
        {
            var request = new GetProductsRequest();
            request.Ids.AddRange(ids);
            grpcResponse = await _catalogClient.GetProductsByIdsAsync(request);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "gRPC: failed to get product data");
            throw new InvalidOperationException("Catalog Service unavailable", ex);
        }

        var productById = grpcResponse.Products.ToDictionary(p => p.Id);

        decimal basePrice = 0m;
        decimal saleDiscount = 0m;

        foreach (var pair in componentMap)
        {
            var componentType = pair.Key;
            var productId = pair.Value;

            if (!productById.TryGetValue(productId.ToString(), out var product))
            {
                result.UnavailableComponents.Add(componentType + " (" + productId + ")");
                continue;
            }

            var price = (decimal)product.Price;
            var oldPrice = product.OldPrice > 0 ? (decimal?)product.OldPrice : null;
            var inStock = product.IsAvailable && product.Stock > 0;

            result.Components.Add(new ComponentPriceDto
            {
                ProductId = productId,
                ComponentType = componentType,
                ProductName = product.Name,
                Price = price,
                OldPrice = oldPrice,
                InStock = inStock,
                StockQuantity = product.Stock
            });

            basePrice += oldPrice ?? price;
            if (oldPrice.HasValue && oldPrice.Value > price)
                saleDiscount += oldPrice.Value - price;

            if (!inStock)
                result.UnavailableComponents.Add(componentType + ": " + product.Name);
        }

        decimal promoDiscount = 0m;
        if (!string.IsNullOrWhiteSpace(promoCode))
        {
            promoDiscount = ValidateAndGetPromoDiscount(promoCode, basePrice - saleDiscount);
            if (promoDiscount > 0)
                result.AppliedPromoCode = promoCode.ToUpperInvariant();
        }

        result.BasePrice = basePrice;
        result.SaleDiscount = saleDiscount;
        result.PromoDiscount = promoDiscount;
        result.TotalPrice = basePrice - saleDiscount - promoDiscount;
        result.AllComponentsAvailable = result.UnavailableComponents.Count == 0;
        return result;
    }

    public async Task<PCConfiguration?> GetConfigurationByShareTokenAsync(string shareToken)
    {
        if (string.IsNullOrWhiteSpace(shareToken)) return null;
        return await _db.PCConfigurations.AsNoTracking()
            .FirstOrDefaultAsync(c => c.ShareToken == shareToken);
    }

    public async Task<string?> GenerateShareTokenAsync(Guid configurationId, Guid userId)
    {
        var config = await _db.PCConfigurations.FindAsync(configurationId);
        if (config == null) return null;
        if (config.UserId != userId) return null;

        if (string.IsNullOrEmpty(config.ShareToken))
        {
            config.ShareToken = GenerateUniqueToken();
            await _db.SaveChangesAsync();
        }
        return config.ShareToken;
    }

    private static Dictionary<string, Guid> BuildComponentMap(PCConfigurationDto dto)
    {
        var map = new Dictionary<string, Guid>();
        if (dto.ProcessorId.HasValue) map["Processor"] = dto.ProcessorId.Value;
        if (dto.MotherboardId.HasValue) map["Motherboard"] = dto.MotherboardId.Value;
        if (dto.RamId.HasValue) map["RAM"] = dto.RamId.Value;
        if (dto.GpuId.HasValue) map["GPU"] = dto.GpuId.Value;
        if (dto.PsuId.HasValue) map["PSU"] = dto.PsuId.Value;
        if (dto.StorageId.HasValue) map["Storage"] = dto.StorageId.Value;
        if (dto.CaseId.HasValue) map["Case"] = dto.CaseId.Value;
        if (dto.CoolerId.HasValue) map["Cooler"] = dto.CoolerId.Value;
        return map;
    }

    private static decimal ValidateAndGetPromoDiscount(string code, decimal currentPrice)
    {
        var upper = code.Trim().ToUpperInvariant();
        if (upper == "GOLDPC10") return currentPrice * 0.10m;
        if (upper == "PC5") return currentPrice * 0.05m;
        if (upper == "SALE15") return currentPrice * 0.15m;
        if (upper == "BUILDER20") return currentPrice * 0.20m;
        if (upper == "WELCOME") return currentPrice * 0.07m;
        return 0m;
    }

    private static string GenerateUniqueToken()
    {
        var bytes = new byte[18];
        using var rng = System.Security.Cryptography.RandomNumberGenerator.Create();
        rng.GetBytes(bytes);
        return Convert.ToBase64String(bytes).Replace('+', '-').Replace('/', '_').TrimEnd('=');
    }
}
