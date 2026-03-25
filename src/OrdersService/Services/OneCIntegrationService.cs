using System.Text;
using System.Xml.Linq;
using GoldPC.OrdersService.Data;
using GoldPC.Shared.Services.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace GoldPC.OrdersService.Services;

/// <summary>
/// Реализация интеграции с 1С:Предприятие
/// </summary>
public class OneCIntegrationService : IOneCIntegrationService
{
    private readonly OrdersDbContext _context;
    private readonly ILogger<OneCIntegrationService> _logger;
    private readonly string _oneCApiKey;

    public OneCIntegrationService(OrdersDbContext context, ILogger<OneCIntegrationService> logger, IConfiguration configuration)
    {
        _context = context;
        _logger = logger;
        _oneCApiKey = configuration["OneC:ApiKey"] ?? throw new ArgumentNullException("OneC:ApiKey is not configured");
    }

    public async Task<string> ExportOrdersToXmlAsync(DateTime from, DateTime to)
    {
        _logger.LogInformation("Exporting orders to XML (CommerceML) from {From} to {To}", from, to);

        var orders = await _context.Orders
            .Include(o => o.Items)
            .Where(o => o.CreatedAt >= from && o.CreatedAt <= to)
            .ToListAsync();

        var xmlDoc = new XDocument(
            new XElement("КоммерческаяИнформация",
                new XAttribute("ВерсияСхемы", "2.03"),
                new XAttribute("ДатаФормирования", DateTime.UtcNow.ToString("s")),
                new XElement("Документ",
                    orders.Select(o => new XElement("Заказ",
                        new XElement("Ид", o.Id),
                        new XElement("Номер", o.OrderNumber),
                        new XElement("Дата", o.CreatedAt.ToString("yyyy-MM-dd")),
                        new XElement("ХозОперация", "Заказ товара"),
                        new XElement("Роль", "Продавец"),
                        new XElement("Валюта", "USD"),
                        new XElement("Курс", "1"),
                        new XElement("Сумма", o.Total),
                        new XElement("Контрагенты",
                            new XElement("Контрагент",
                                new XElement("Ид", o.UserId),
                                new XElement("Наименование", $"Клиент {o.UserId}"), // Здесь можно добавить реальные данные клиента
                                new XElement("Роль", "Покупатель")
                            )
                        ),
                        new XElement("Товары",
                            o.Items.Select(i => new XElement("Товар",
                                new XElement("Ид", i.ProductId),
                                new XElement("Наименование", i.ProductName),
                                new XElement("ЦенаЗаЕдиницу", i.UnitPrice),
                                new XElement("Количество", i.Quantity),
                                new XElement("Сумма", i.TotalPrice)
                            ))
                        )
                    ))
                )
            )
        );

        return xmlDoc.ToString();
    }

    public async Task<string> ExportOrdersToCsvAsync(DateTime from, DateTime to)
    {
        _logger.LogInformation("Exporting orders to CSV from {From} to {To}", from, to);

        var orders = await _context.Orders
            .Include(o => o.Items)
            .Where(o => o.CreatedAt >= from && o.CreatedAt <= to)
            .ToListAsync();

        var csv = new StringBuilder();
        csv.AppendLine("OrderNumber,Date,UserId,Total,ItemsCount");

        foreach (var o in orders)
        {
            csv.AppendLine($"{o.OrderNumber},{o.CreatedAt:yyyy-MM-dd HH:mm:ss},{o.UserId},{o.Total},{o.Items.Count}");
        }

        return csv.ToString();
    }

    public async Task<(bool Success, string? Error)> ImportStockFromXmlAsync(string xmlContent)
    {
        try
        {
            _logger.LogInformation("Importing stock levels from XML (not implemented: requires CatalogService integration)");
            // В реальном приложении здесь был бы вызов к CatalogService через gRPC или RabbitMQ
            // Для примера просто вернем успех.
            return (true, null);
        }
        catch (Exception e)
        {
            _logger.LogError(e, "Error importing stock levels");
            return (false, "Ошибка при импорте данных");
        }
    }

    public bool ValidateOneCApiKey(string apiKey)
    {
        return !string.IsNullOrEmpty(apiKey) && apiKey == _oneCApiKey;
    }
}
