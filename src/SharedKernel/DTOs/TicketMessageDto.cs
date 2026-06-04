#pragma warning disable CA2227, CS1591, SA1600

namespace GoldPC.SharedKernel.DTOs;

/// <summary>
/// DTO сообщения в чате заявки для обмена между сервисами.
/// </summary>
public class TicketMessageDto
{
    public Guid Id { get; set; }
    public Guid ServiceRequestId { get; set; }
    public Guid AuthorId { get; set; }
    public string AuthorRole { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public string? FileUrl { get; set; }
    public string? FileName { get; set; }
    public long? FileSize { get; set; }
    public string? ContentType { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? ReadAt { get; set; }
}

/// <summary>
/// Запрос на отправку сообщения (REST fallback)
/// </summary>
public class SendMessageRequest
{
    public string Content { get; set; } = string.Empty;
    public string? FileUrl { get; set; }
    public string? FileName { get; set; }
    public long? FileSize { get; set; }
    public string? ContentType { get; set; }
}
#pragma warning restore CA2227, CS1591, SA1600
