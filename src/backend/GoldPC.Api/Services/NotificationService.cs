using Microsoft.AspNetCore.SignalR;
using GoldPC.Api.Hubs;
using GoldPC.Shared.Entities;
using GoldPC.Shared.Services;
using Microsoft.EntityFrameworkCore;

namespace GoldPC.Api.Services;

public class NotificationService : INotificationService
{
    private readonly IHubContext<NotificationHub> _hubContext;
    private readonly DbContext _dbContext;

    public NotificationService(IHubContext<NotificationHub> hubContext, DbContext dbContext)
    {
        _hubContext = hubContext;
        _dbContext = dbContext;
    }

    public async Task<Notification> CreateNotificationAsync(Notification notification)
    {
        notification.Id = Guid.NewGuid();
        notification.CreatedAt = DateTime.UtcNow;
        notification.IsRead = false;

        await _dbContext.Set<Notification>().AddAsync(notification);
        await _dbContext.SaveChangesAsync();

        return notification;
    }

    public async Task<IEnumerable<Notification>> GetUserNotificationsAsync(Guid userId, bool unreadOnly = false, int limit = 50)
    {
        var query = _dbContext.Set<Notification>()
            .Where(n => n.UserId == userId)
            .OrderByDescending(n => n.CreatedAt);

        if (unreadOnly)
        {
            query = (IOrderedQueryable<Notification>)query.Where(n => !n.IsRead);
        }

        return await query.Take(limit).ToListAsync();
    }

    public async Task MarkAsReadAsync(Guid notificationId)
    {
        var notification = await _dbContext.Set<Notification>().FindAsync(notificationId);
        if (notification != null)
        {
            notification.IsRead = true;
            notification.ReadAt = DateTime.UtcNow;
            await _dbContext.SaveChangesAsync();
        }
    }

    public async Task MarkAllAsReadAsync(Guid userId)
    {
        var notifications = await _dbContext.Set<Notification>()
            .Where(n => n.UserId == userId && !n.IsRead)
            .ToListAsync();

        foreach (var notification in notifications)
        {
            notification.IsRead = true;
            notification.ReadAt = DateTime.UtcNow;
        }

        await _dbContext.SaveChangesAsync();
    }

    public async Task DeleteNotificationAsync(Guid notificationId)
    {
        var notification = await _dbContext.Set<Notification>().FindAsync(notificationId);
        if (notification != null)
        {
            _dbContext.Set<Notification>().Remove(notification);
            await _dbContext.SaveChangesAsync();
        }
    }

    public async Task SendNotificationAsync(Notification notification)
    {
        await CreateNotificationAsync(notification);
        await _hubContext.Clients.User(notification.UserId.ToString())
            .SendAsync("ReceiveNotification", notification);
    }

    public async Task SendNotificationToRoleAsync(string role, Notification notification)
    {
        await _hubContext.Clients.Group(role)
            .SendAsync("ReceiveNotification", notification);
    }

    public async Task BroadcastNotificationAsync(Notification notification)
    {
        await _hubContext.Clients.All
            .SendAsync("ReceiveNotification", notification);
    }
}
