#pragma warning disable CA2227, CS1591, SA1600
namespace GoldPC.SharedKernel.Models;

/// <summary>
/// Пагинированный результат
/// </summary>
public class PagedResult<T>
{
    public ICollection<T> Items { get; set; } = new List<T>();

    public int TotalCount { get; set; }

    public int PageNumber { get; set; }

    public int PageSize { get; set; }

    public int TotalPages => (int)Math.Ceiling((double)TotalCount / PageSize);

    public bool HasPrevious => PageNumber > 1;

    public bool HasNext => PageNumber < TotalPages;
}
#pragma warning restore CA2227, CS1591, SA1600
