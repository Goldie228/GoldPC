namespace GoldPC.Api.Models;

/// <summary>DTO изображения товара</summary>
public record ProductImageDto
{
    public string Id { get; init; } = string.Empty;
    public string ProductId { get; init; } = string.Empty;
    public string Url { get; init; } = string.Empty;
    public bool IsPrimary { get; init; }
    public bool IsActive { get; init; } = true;
    public int SortOrder { get; init; }
    public DateTime CreatedAt { get; init; }
}
