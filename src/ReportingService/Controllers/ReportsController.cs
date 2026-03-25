using System.Globalization;
using CsvHelper;
using GoldPC.ReportingService.Data;
using GoldPC.ReportingService.Models;
using GoldPC.Shared.Authorization;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace GoldPC.ReportingService.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ReportsController : ControllerBase
{
    private readonly ReportingDbContext _context;
    private readonly ILogger<ReportsController> _logger;

    public ReportsController(ReportingDbContext context, ILogger<ReportsController> logger)
    {
        _context = context;
        _logger = logger;
    }

    [HttpGet("sales")]
    [Authorize(Policy = Permissions.ReportsView)]
    public async Task<ActionResult<IEnumerable<SalesPerformanceReport>>> GetSalesPerformance([FromQuery] DateTime? from, [FromQuery] DateTime? to)
    {
        var query = _context.SalesPerformance.AsQueryable();

        if (from.HasValue)
            query = query.Where(r => r.Date >= from.Value);
        
        if (to.HasValue)
            query = query.Where(r => r.Date <= to.Value);

        return await query.OrderByDescending(r => r.Date).ToListAsync();
    }

    [HttpGet("services")]
    [Authorize(Policy = Permissions.ReportsView)]
    public async Task<ActionResult<IEnumerable<ServiceEfficiencyReport>>> GetServiceEfficiency()
    {
        return await _context.ServiceEfficiency.ToListAsync();
    }

    [HttpGet("inventory")]
    [Authorize(Policy = Permissions.ReportsView)]
    public async Task<ActionResult<IEnumerable<InventoryAnalyticsReport>>> GetInventoryAnalytics()
    {
        return await _context.InventoryAnalytics.ToListAsync();
    }

    [HttpGet("export/csv/{type}")]
    [Authorize(Policy = Permissions.ReportsExport)]
    public async Task<IActionResult> ExportToCsv(string type)
    {
        IEnumerable<object> data = type.ToLower() switch
        {
            "sales" => await _context.SalesPerformance.ToListAsync(),
            "services" => await _context.ServiceEfficiency.ToListAsync(),
            "inventory" => await _context.InventoryAnalytics.ToListAsync(),
            _ => throw new ArgumentException("Invalid report type")
        };

        using var memoryStream = new MemoryStream();
        using (var writer = new StreamWriter(memoryStream))
        using (var csv = new CsvWriter(writer, CultureInfo.InvariantCulture))
        {
            await csv.WriteRecordsAsync(data);
        }

        return File(memoryStream.ToArray(), "text/csv", $"report_{type}_{DateTime.Now:yyyyMMdd}.csv");
    }

    [HttpGet("audit")]
    [Authorize(Policy = Permissions.AuditView)]
    public async Task<ActionResult<IEnumerable<AuditEntry>>> GetAuditLog()
    {
        // For demo, we aggregate from order_history through FDW
        // In a full implementation, we'd have a separate AuditService or aggregate all history tables
        
        var auditLog = await _context.Database.SqlQuery<AuditEntry>($@"
            SELECT 
                id as Id,
                'OrdersService' as ServiceName,
                'StatusChange' as Action,
                'Order' as EntityName,
                order_id as EntityId,
                'User ' || changed_by::text as ChangedBy,
                changed_at as ChangedAt,
                comment as Details
            FROM fdw_orders.order_history
            ORDER BY changed_at DESC
            LIMIT 100
        ").ToListAsync();

        return auditLog;
    }
}
