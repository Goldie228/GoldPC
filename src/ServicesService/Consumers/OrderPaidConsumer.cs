using GoldPC.ServicesService.Data;
using GoldPC.ServicesService.Entities;
using GoldPC.SharedKernel.Enums;
using MassTransit;
using Microsoft.EntityFrameworkCore;
using SharedKernel.Events;

namespace GoldPC.ServicesService.Consumers;

/// <summary>
/// Consumer для обработки события оплаты заказа.
/// Создаёт заявки на сборку ПК для каждого PCBundle в заказе.
/// </summary>
public class OrderPaidConsumer : IConsumer<OrderPaidEvent>
{
    private readonly ServicesDbContext _context;
    private readonly ILogger<OrderPaidConsumer> _logger;

    public OrderPaidConsumer(ServicesDbContext context, ILogger<OrderPaidConsumer> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task Consume(ConsumeContext<OrderPaidEvent> context)
    {
        var message = context.Message;

        _logger.LogInformation(
            "Processing OrderPaidEvent for Order {OrderId}, Amount: {Amount}",
            message.OrderId, message.AmountPaid);

        // Only process if there are assembly bundles
        if (message.AssemblyBundles == null || !message.AssemblyBundles.Any())
        {
            _logger.LogInformation("No assembly bundles in order {OrderId}, skipping", message.OrderId);
            return;
        }

        // Find the assembly service type
        var assemblyServiceType = await _context.ServiceTypes
            .FirstOrDefaultAsync(st => st.Slug == "assembly" && st.IsActive);

        if (assemblyServiceType == null)
        {
            _logger.LogWarning("Assembly service type not found, skipping");
            return;
        }

        // Process each assembly bundle
        foreach (var bundle in message.AssemblyBundles)
        {
            // Dedup: skip if a service request already exists for this order+configuration
            var existingRequest = await _context.ServiceRequests
                .FirstOrDefaultAsync(sr => sr.OrderId == message.OrderId && sr.PCConfigurationId == bundle.PCConfigurationId);
            if (existingRequest != null)
            {
                _logger.LogInformation("Service request already exists for Order {OrderId}, config {ConfigId}, skipping",
                    message.OrderId, bundle.PCConfigurationId);
                continue;
            }

            // Generate request number
            var year = DateTime.UtcNow.Year;
            var lastRequest = await _context.ServiceRequests
                .Where(sr => sr.RequestNumber.StartsWith($"SR-{year}-"))
                .OrderByDescending(sr => sr.RequestNumber)
                .FirstOrDefaultAsync();

            var nextNumber = lastRequest != null ? int.Parse(lastRequest.RequestNumber.Split('-')[2]) + 1 : 1;
            var requestNumber = $"SR-{year}-{nextNumber:D6}";

            // Create service request for assembly
            var serviceRequest = new ServiceRequest
            {
                Id = Guid.NewGuid(),
                RequestNumber = requestNumber,
                ClientId = message.CustomerId,
                ServiceTypeId = assemblyServiceType.Id,
                Description = $"Сборка ПК на заказ (заказ {message.OrderId}, конфигурация {bundle.PCConfigurationId})",
                EstimatedCost = assemblyServiceType.BasePrice,
                Status = ServiceRequestStatus.Submitted,
                OrderId = message.OrderId,
                PCConfigurationId = bundle.PCConfigurationId,
                ClientPhone = message.ClientPhone,
                CreatedAt = DateTime.UtcNow
            };

            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                _context.ServiceRequests.Add(serviceRequest);

                // Create work report
                var report = new WorkReport
                {
                    Id = Guid.NewGuid(),
                    ServiceRequestId = serviceRequest.Id,
                    PreviousStatus = ServiceRequestStatus.Submitted,
                    NewStatus = ServiceRequestStatus.Submitted,
                    Comment = "Заявка на сборку ПК создана автоматически из оплаченного заказа",
                    ChangedBy = message.CustomerId,
                    ChangedAt = DateTime.UtcNow
                };
                _context.WorkReports.Add(report);

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                _logger.LogInformation(
                    "Assembly service request created: {RequestNumber} for Order {OrderId}",
                    requestNumber, message.OrderId);

                // Try to auto-assign a master
                await AutoAssignMasterAsync(serviceRequest.Id);
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                _logger.LogError(ex, "Error creating assembly service request for Order {OrderId}", message.OrderId);
                throw;
            }
        }
    }

    private async Task AutoAssignMasterAsync(Guid serviceRequestId)
    {
        var request = await _context.ServiceRequests.FindAsync(serviceRequestId);
        if (request == null || request.Status != ServiceRequestStatus.Submitted)
            return;

        // Find master with least active requests
        var masters = await _context.ServiceRequests
            .Where(sr => sr.MasterId.HasValue && 
                        (sr.Status == ServiceRequestStatus.Assigned ||
                         sr.Status == ServiceRequestStatus.InProgress ||
                         sr.Status == ServiceRequestStatus.PartsPending ||
                         sr.Status == ServiceRequestStatus.PartsReady ||
                         sr.Status == ServiceRequestStatus.AwaitingParts))
            .GroupBy(sr => sr.MasterId)
            .Select(g => new { MasterId = g.Key!.Value, ActiveCount = g.Count() })
            .OrderBy(x => x.ActiveCount)
            .ToListAsync();

        // Get all masters from the system (simplified - in real app would query AuthService)
        // For now, just find any master with capacity
        var availableMaster = masters.FirstOrDefault(m => m.ActiveCount < 3 /* must match MaxActiveRequestsPerMaster */);

        if (availableMaster != null)
        {
            request.MasterId = availableMaster.MasterId;
            request.Status = ServiceRequestStatus.Assigned;
            request.UpdatedAt = DateTime.UtcNow;

            var report = new WorkReport
            {
                Id = Guid.NewGuid(),
                ServiceRequestId = request.Id,
                PreviousStatus = ServiceRequestStatus.Submitted,
                NewStatus = ServiceRequestStatus.Assigned,
                Comment = "Автоназначение: мастер назначен системой",
                ChangedBy = availableMaster.MasterId,
                ChangedAt = DateTime.UtcNow
            };
            _context.WorkReports.Add(report);

            await _context.SaveChangesAsync();

            _logger.LogInformation(
                "Master {MasterId} auto-assigned to request {RequestNumber}",
                availableMaster.MasterId, request.RequestNumber);
        }
        else
        {
            _logger.LogInformation(
                "No available master for request {RequestNumber}, staying in Submitted status",
                request.RequestNumber);
        }
    }
}
