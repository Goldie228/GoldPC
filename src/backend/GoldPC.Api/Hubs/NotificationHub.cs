using GoldPC.Shared.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace GoldPC.Api.Hubs;

/// <summary>
/// SignalR hub для доставки уведомлений в реальном времени.
/// Поддерживает отправку уведомлений конкретному пользователю, по роли и глобальную рассылку.
/// </summary>
[Authorize]
public class NotificationHub : Hub
{
    /// <summary>
    /// Отправляет уведомление конкретному пользователю по его идентификатору.
    /// </summary>
    /// <param name="userId">Идентификатор пользователя.</param>
    /// <param name="notification">Уведомление для отправки.</param>
    /// <returns>Задачу, представляющую асинхронную операцию.</returns>
    public async Task SendNotificationToUser(Guid userId, Notification notification)
    {
        await Clients.User(userId.ToString()).SendAsync("ReceiveNotification", notification);
    }

    /// <summary>
    /// Отправляет уведомление всем пользователям в указанной роли.
    /// </summary>
    /// <param name="role">Роль пользователей.</param>
    /// <param name="notification">Уведомление для отправки.</param>
    /// <returns>Задачу, представляющую асинхронную операцию.</returns>
    public async Task SendNotificationToRole(string role, Notification notification)
    {
        await Clients.Group(role).SendAsync("ReceiveNotification", notification);
    }

    /// <summary>
    /// Отправляет системное объявление всем подключённым пользователям.
    /// Доступно только администраторам.
    /// </summary>
    /// <param name="notification">Системное уведомление. Тип автоматически устанавливается как <see cref="NotificationType.SystemAnnouncement"/>.</param>
    /// <returns>Задачу, представляющую асинхронную операцию.</returns>
    [Authorize(Roles = "Admin")]
    public async Task SendSystemAnnouncement(Notification notification)
    {
        notification.Type = NotificationType.SystemAnnouncement;
        await Clients.All.SendAsync("ReceiveNotification", notification);
    }

    /// <summary>
    /// Обрабатывает подключение клиента к hub.
    /// Добавляет клиента во все группы по его ролям.
    /// </summary>
    /// <returns>Задачу, представляющую асинхронную операцию.</returns>
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

    /// <summary>
    /// Обрабатывает отключение клиента от hub.
    /// Удаляет клиента из всех групп по его ролям.
    /// </summary>
    /// <param name="exception">Исключение, вызвавшее отключение (если есть).</param>
    /// <returns>Задачу, представляющую асинхронную операцию.</returns>
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
