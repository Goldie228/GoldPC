using GoldPC.OrdersService.Data;
using GoldPC.OrdersService.Services;
using GoldPC.SharedKernel.DTOs;
using GoldPC.SharedKernel.Enums;
using GoldPC.SharedKernel.Models;
using FluentAssertions;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Moq;
using Shared.Protos;
using System.Net;
using System.Net.Http.Json;
using Xunit;
using Grpc.Core;

namespace GoldPC.IntegrationTests.Orders;

public class OrderStockReservationTests : IClassFixture<OrdersApiFactory>
{
    private readonly HttpClient _client;
    private readonly Mock<CatalogGrpc.CatalogGrpcClient> _grpcClientMock;

    public OrderStockReservationTests(OrdersApiFactory factory)
    {
        _grpcClientMock = factory.CatalogGrpcClientMock;
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task CreateOrder_ShouldCallCatalogServiceToReserveStock()
    {
        // Подготовка
        var productId = Guid.NewGuid();
        var request = new CreateOrderRequest
        {
            Items = new List<OrderItemDto>
            {
                new OrderItemDto { ProductId = productId, Quantity = 2 }
            },
            DeliveryMethod = "Delivery",
            PaymentMethod = "Online",
            Address = new AddressDto { City = "Moscow", Street = "Tverskaya", House = "10" }
        };

        // Мок gRPC ответа
        _grpcClientMock.Setup(x => x.ReserveStockAsync(
            It.IsAny<ReserveStockRequest>(),
            null, null, default))
            .Returns(new AsyncUnaryCall<StockResponse>(
                Task.FromResult(new StockResponse { Success = true }),
                Task.FromResult(new Metadata()),
                () => Status.DefaultSuccess,
                () => new Metadata(),
                () => { }));

        // Действие
        // Необходимо обойти авторизацию или использовать тестовый токен. 
        // Для простоты в этом тесте предполагаем, что фабрика обрабатывает мок авторизации.
        var response = await _client.PostAsJsonAsync("/api/v1/orders", request);

        // Проверка
        response.StatusCode.Should().Be(HttpStatusCode.Created);
        
        // Проверка gRPC вызова
        _grpcClientMock.Verify(x => x.ReserveStockAsync(
            It.Is<ReserveStockRequest>(r => r.Items.Any(i => i.ProductId == productId.ToString() && i.Quantity == 2)),
            null, null, default), Times.Once);
    }
}

public class OrdersApiFactory : WebApplicationFactory<Program>
{
    public Mock<CatalogGrpc.CatalogGrpcClient> CatalogGrpcClientMock { get; } = new();

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");

        builder.ConfigureTestServices(services =>
        {
            // Мок БД
            var dbDescriptor = services.SingleOrDefault(d => d.ServiceType == typeof(DbContextOptions<OrdersDbContext>));
            if (dbDescriptor != null) services.Remove(dbDescriptor);
            services.AddDbContext<OrdersDbContext>(options => options.UseInMemoryDatabase("TestOrdersDb"));

            // Мок gRPC клиента
            var grpcDescriptor = services.SingleOrDefault(d => d.ServiceType == typeof(CatalogGrpc.CatalogGrpcClient));
            if (grpcDescriptor != null) services.Remove(grpcDescriptor);
            services.AddSingleton(CatalogGrpcClientMock.Object);

            // Мок Auth при необходимости - здесь можно добавить кастомный обработчик auth для тестирования
        });
    }
}
