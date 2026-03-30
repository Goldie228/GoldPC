#pragma warning disable CS1591, SA1600
namespace GoldPC.SharedKernel.Models;

/// <summary>
/// Ошибка API
/// </summary>
public class ApiError
{
    public string Code { get; set; } = string.Empty;

    public string Message { get; set; } = string.Empty;

    public string? Field { get; set; }

    public static ApiError Create(string code, string message, string? field = null)
        => new() { Code = code, Message = message, Field = field };
}
#pragma warning restore CS1591, SA1600
