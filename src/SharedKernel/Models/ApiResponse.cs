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
    public List<ApiError>? Errors { get; set; }
    
    public static ApiResponse<T> Ok(T data, string? message = null)
        => new() { Success = true, Data = data, Message = message };
    
    public static ApiResponse<T> Fail(string message, List<ApiError>? errors = null)
        => new() { Success = false, Message = message, Errors = errors };
}

/// <summary>
/// API ответ без данных
/// </summary>
public class ApiResponse
{
    public bool Success { get; set; }
    public string? Message { get; set; }
    public List<ApiError>? Errors { get; set; }
    
    public static ApiResponse Ok(string? message = null)
        => new() { Success = true, Message = message };
    
    public static ApiResponse Fail(string message, List<ApiError>? errors = null)
        => new() { Success = false, Message = message, Errors = errors };
}

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

/// <summary>
/// Пагинированный результат
/// </summary>
public class PagedResult<T>
{
    public List<T> Items { get; set; } = new();
    public int TotalCount { get; set; }
    public int PageNumber { get; set; }
    public int PageSize { get; set; }
    public int TotalPages => (int)Math.Ceiling((double)TotalCount / PageSize);
    public bool HasPrevious => PageNumber > 1;
    public bool HasNext => PageNumber < TotalPages;
}

/// <summary>
/// Параметры пагинации
/// </summary>
public class PaginationParams
{
    private const int MaxPageSize = 100;
    private int _pageSize = 10;
    
    public int PageNumber { get; set; } = 1;
    
    public int PageSize
    {
        get => _pageSize;
        set => _pageSize = value > MaxPageSize ? MaxPageSize : value;
    }
}