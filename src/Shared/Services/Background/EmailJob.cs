#pragma warning disable CS1591, SA1600
namespace GoldPC.Shared.Services.Background;

public record EmailJob(
    string Recipient,
    string Subject,
    string Body,
    bool IsHtml = true);
#pragma warning restore CS1591, SA1600
