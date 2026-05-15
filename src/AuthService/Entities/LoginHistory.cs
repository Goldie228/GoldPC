using GoldPC.SharedKernel.Entities;

namespace GoldPC.AuthService.Entities;

public class LoginHistory : BaseEntity
{
    public Guid UserId { get; set; }
    public string IpAddress { get; set; } = string.Empty;
    public string? UserAgent { get; set; }
    public DateTime Timestamp { get; set; }
    public bool Success { get; set; }
    public string? FailureReason { get; set; }

    public virtual User? User { get; set; }
}