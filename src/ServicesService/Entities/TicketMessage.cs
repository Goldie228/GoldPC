namespace GoldPC.ServicesService.Entities;

/// <summary>
/// Сообщение в чате заявки (переписка клиента и мастера)
/// </summary>
public class TicketMessage
{
    public Guid Id { get; set; }
    public Guid ServiceRequestId { get; set; }
    public Guid AuthorId { get; set; }
    public string AuthorRole { get; set; } = "Client";
    public string Content { get; set; } = string.Empty;
    public string? FileUrl { get; set; }
    public string? FileName { get; set; }
    public long? FileSize { get; set; }
    public string? ContentType { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ReadAt { get; set; }

    public ServiceRequest ServiceRequest { get; set; } = null!;
}
