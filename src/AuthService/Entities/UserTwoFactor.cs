using GoldPC.SharedKernel.Entities;

namespace GoldPC.AuthService.Entities;

public class UserTwoFactor : BaseEntity
{
    public Guid UserId { get; set; }
    public string? TOTPSecret { get; set; }
    public bool IsEnabled { get; set; }
    public string? RecoveryCodes { get; set; }
    public DateTime CreatedAt { get; set; }

    public virtual User? User { get; set; }
}