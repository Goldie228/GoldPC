namespace GoldPC.SharedKernel.Models;

/// <summary>
/// Стандартный API ответ
/// </summary>
/// <typeparam name="T">Тип данных</typeparam>
public class ApiResponse<T>
{
    public bool Success { get; set; }

    public string? Message { get; set; }

    public T? Data { get; set; }

    public ICollection<ApiError>? Errors { get; set; }

    public static ApiResponse<T> Ok(T data, string? message = null)
        => new() { Success = true, Data = data, Message = message };

    public static ApiResponse<T> Fail(string message, ICollection<ApiError>? errors = null)
        => new() { Success = false, Message = message, Errors = errors };
}
