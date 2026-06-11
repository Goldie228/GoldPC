using GoldPC.SharedKernel.Entities;

namespace GoldPC.AuthService.Entities;

public class NotificationPreference : BaseEntity
{
    public Guid UserId { get; set; }
    public bool EmailNotifications { get; set; }
    public bool SmsNotifications { get; set; }
    public bool TelegramNotifications { get; set; }
    public bool OrderStatusNotifications { get; set; } = true;
    public bool MarketingNotifications { get; set; }
    public new DateTime UpdatedAt { get; set; }

    public virtual User? User { get; set; }
}