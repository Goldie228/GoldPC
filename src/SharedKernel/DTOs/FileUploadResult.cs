#pragma warning disable CS1591, SA1600
namespace GoldPC.SharedKernel.DTOs;

/// <summary>
/// Результат загрузки файла в чат заявки
/// </summary>
public class FileUploadResult
{
    public string FileUrl { get; set; } = string.Empty;
    public string FileName { get; set; } = string.Empty;
    public long FileSize { get; set; }
    public string ContentType { get; set; } = string.Empty;
}
#pragma warning restore CS1591, SA1600
