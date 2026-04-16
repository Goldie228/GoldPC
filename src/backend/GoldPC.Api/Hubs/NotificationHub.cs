using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using GoldPC.Shared.Entities;

namespace GoldPC.Api.Hubs;

/// <summary>
/// SignalR hub for real-time notifications
/// </summary>
[Authorize]
public class NotificationHub : Hub
{
    /// <summary>
    /// Send notification to a specific user
    /// </summary>
    public async Task SendNotificationToUser(Guid userId, Notification notification)
    {
        await Clients.User(userId.ToString()).SendAsync("ReceiveNotification", notification);
    }

    /// <summary>
    /// Send notification to all users in a specific role
    /// </summary>
    public async Task SendNotificationToRole(string role, Notification notification)
    {
        await Clients.Group(role).SendAsync("ReceiveNotification", notification);
    }

    /// <summary>
    /// Send system announcement to all connected users
    /// Only administrators can call this method
    /// </summary>
    [Authorize(Roles = Roles.Admin)]
    public async Task SendSystemAnnouncement(Notification notification)
    {
        notification.Type = NotificationType.SystemAnnouncement;
        await Clients.All.SendAsync("ReceiveNotification", notification);
    }

    public override async Task OnConnectedAsync()
    {
        var userId = Context.UserIdentifier;
        var roles = Context.User?.Claims
            .Where(c => c.Type == System.Security.Claims.ClaimTypes.Role)
            .Select(c => c.Value)
            .ToList();

        if (roles != null)
        {
            foreach (var role in roles)
            {
                await Groups.AddToGroupAsync(Context.ConnectionId, role);
            }
        }

        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var roles = Context.User?.Claims
            .Where(c => c.Type == System.Security.Claims.ClaimTypes.Role)
            .Select(c => c.Value)
            .ToList();

        if (roles != null)
        {
            foreach (var role in roles)
            {
                await Groups.RemoveFromGroupAsync(Context.ConnectionId, role);
            }
        }

        await base.OnDisconnectedAsync(exception);
    }
}
