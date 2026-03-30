#pragma warning disable CS1591, SA1600
namespace GoldPC.SharedKernel.Models;

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
#pragma warning restore CS1591, SA1600
