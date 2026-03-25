namespace GoldPC.Shared.Services.Background;

public record EmailJob(
    string Recipient,
    string Subject,
    string Body,
    bool IsHtml = true
);
