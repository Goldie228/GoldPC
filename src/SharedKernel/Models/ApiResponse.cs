namespace GoldPC.SharedKernel.Models;

/// <summary>
/// API ответ без данных
/// </summary>
public class ApiResponse
{
    public bool Success { get; set; }

    public string? Message { get; set; }

    public ICollection<ApiError>? Errors { get; set; }

    public static ApiResponse Ok(string? message = null)
        => new() { Success = true, Message = message };

    public static ApiResponse Fail(string message, ICollection<ApiError>? errors = null)
        => new() { Success = false, Message = message, Errors = errors };
}
