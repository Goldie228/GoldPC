using GoldPC.ServicesService.Services;
using GoldPC.SharedKernel.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using System.Security.Claims;

namespace GoldPC.ServicesService.Hubs;

/// <summary>
/// SignalR Hub для чата в рамках заявки на услугу.
/// Клиенты подключаются к группе ticket:{ticketId} для обмена сообщениями в реальном времени.
/// </summary>
[Authorize]
public class ChatHub : Hub
{
    private readonly IServicesService _servicesService;
    private readonly ILogger<ChatHub> _logger;

    public ChatHub(IServicesService servicesService, ILogger<ChatHub> logger)
    {
        _servicesService = servicesService;
        _logger = logger;
    }

    /// <summary>
    /// Подключиться к чату заявки
    /// </summary>
    public async Task JoinTicket(string ticketId)
    {
        if (!Guid.TryParse(ticketId, out _)) return;
        var groupName = $"ticket:{ticketId}";
        await Groups.AddToGroupAsync(Context.ConnectionId, groupName);
        _logger.LogInformation("User {UserId} joined group {Group}", GetUserId(), groupName);
    }

    /// <summary>
    /// Покинуть чат заявки
    /// </summary>
    public async Task LeaveTicket(string ticketId)
    {
        var groupName = $"ticket:{ticketId}";
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, groupName);
    }

    /// <summary>
    /// Отправить сообщение в чат заявки
    /// </summary>
    public async Task SendMessage(string ticketId, string content, string? fileUrl = null, string? fileName = null, long? fileSize = null, string? contentType = null)
    {
        if (!Guid.TryParse(ticketId, out var guid)) return;
        if (string.IsNullOrWhiteSpace(content) && string.IsNullOrEmpty(fileUrl)) return;

        var userId = GetUserId();
        if (userId == null) return;

        var role = Context.User?.FindAll(ClaimTypes.Role).Select(c => c.Value).Contains("Master") == true
            ? "Master" : "Client";

        var message = await _servicesService.SendMessageAsync(guid, userId.Value, role, content.Trim(), fileUrl, fileName, fileSize, contentType);
        if (message == null) return;

        var groupName = $"ticket:{ticketId}";
        await Clients.Group(groupName).SendAsync("ReceiveMessage", message);
    }

    /// <summary>
    /// Отправить уведомление о наборе текста
    /// </summary>
    public async Task SendTyping(string ticketId)
    {
        var userId = GetUserId();
        if (userId == null) return;

        var groupName = $"ticket:{ticketId}";
        await Clients.OthersInGroup(groupName).SendAsync("UserTyping", new
        {
            TicketId = ticketId,
            UserId = userId.Value
        });
    }

    /// <summary>
    /// Отметить сообщения как прочитанные
    /// </summary>
    public async Task MarkRead(string ticketId)
    {
        if (!Guid.TryParse(ticketId, out var guid)) return;
        var userId = GetUserId();
        if (userId == null) return;

        var groupName = $"ticket:{ticketId}";
        await Clients.OthersInGroup(groupName).SendAsync("MessageRead", new
        {
            TicketId = ticketId,
            UserId = userId.Value
        });
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        _logger.LogInformation("User {UserId} disconnected: {Reason}", GetUserId(), exception?.Message);
        await base.OnDisconnectedAsync(exception);
    }

    private Guid? GetUserId()
    {
        var userIdClaim = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value
                         ?? Context.User?.FindFirst("sub")?.Value;
        return userIdClaim != null && Guid.TryParse(userIdClaim, out var userId) ? userId : null;
    }
}
