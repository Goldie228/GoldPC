using CatalogService.Services.Interfaces;
using Grpc.Core;
using Shared.Protos;

namespace CatalogService.Grpc;

public class CatalogGrpcService : CatalogGrpc.CatalogGrpcBase
{
    private readonly ICatalogService _catalogService;
    private readonly ILogger<CatalogGrpcService> _logger;

    public CatalogGrpcService(ICatalogService catalogService, ILogger<CatalogGrpcService> logger)
    {
        _catalogService = catalogService;
        _logger = logger;
    }

    public override async Task<ProductResponse> GetProductById(GetProductRequest request, ServerCallContext context)
    {
        _logger.LogInformation("gRPC: GetProductById called for {ProductId}", request.Id);

        if (!Guid.TryParse(request.Id, out var productId))
        {
            throw new RpcException(new Status(StatusCode.InvalidArgument, "Invalid ProductId format"));
        }

        var product = await _catalogService.GetProductByIdAsync(productId);

        if (product == null)
        {
            throw new RpcException(new Status(StatusCode.NotFound, $"Product with ID {request.Id} not found"));
        }

        return new ProductResponse
        {
            Id = product.Id.ToString(),
            Name = product.Name,
            Price = (double)product.Price,
            Category = product.Category,
            IsAvailable = product.Stock > 0 && product.IsActive
        };
    }

    public override async Task<ProductsResponse> GetProductsByIds(GetProductsRequest request, ServerCallContext context)
    {
        _logger.LogInformation("gRPC: GetProductsByIds called for {ProductCount} products", request.Ids.Count);

        var productIds = new List<Guid>();
        foreach (var idStr in request.Ids)
        {
            if (Guid.TryParse(idStr, out var id))
            {
                productIds.Add(id);
            }
        }

        var products = await _catalogService.GetProductsByIdsAsync(productIds);

        var response = new ProductsResponse();
        response.Products.AddRange(products.Select(p => new ProductResponse
        {
            Id = p.Id.ToString(),
            Name = p.Name,
            Price = (double)p.Price,
            Category = p.Category,
            IsAvailable = p.Stock > 0 && p.IsActive
        }));

        return response;
    }

    public override async Task<StockResponse> ReserveStock(ReserveStockRequest request, ServerCallContext context)
    {
        _logger.LogInformation("gRPC: ReserveStock called for {ItemCount} items", request.Items.Count);

        var items = request.Items.Select(i => (Guid.Parse(i.ProductId), i.Quantity)).ToList();
        var (success, error) = await _catalogService.ReserveStockAsync(items);

        return new StockResponse
        {
            Success = success,
            ErrorMessage = error ?? string.Empty
        };
    }

    public override async Task<StockResponse> ReleaseStock(ReleaseStockRequest request, ServerCallContext context)
    {
        _logger.LogInformation("gRPC: ReleaseStock called for {ItemCount} items", request.Items.Count);

        var items = request.Items.Select(i => (Guid.Parse(i.ProductId), i.Quantity)).ToList();
        var (success, error) = await _catalogService.ReleaseStockAsync(items);

        return new StockResponse
        {
            Success = success,
            ErrorMessage = error ?? string.Empty
        };
    }
}
