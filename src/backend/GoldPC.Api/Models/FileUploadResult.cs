namespace GoldPC.Api.Models;

/// <summary>Результат загрузки файла</summary>
public record FileUploadResult
{
    public bool Success { get; init; }
    public string? Error { get; init; }
    public ProductImageDto? Image { get; init; }
}
