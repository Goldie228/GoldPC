#pragma warning disable CA1002, CS1591, SA1402, SA1600, SA1649
namespace GoldPC.SharedKernel.DTOs;

public sealed record FilterFacetOptionDto
{
    public string Value { get; init; } = string.Empty;

    public int Count { get; init; }
}

public sealed record FilterFacetAttributeDto
{
    public string Key { get; init; } = string.Empty;

    public string DisplayName { get; init; } = string.Empty;

    public string FilterType { get; init; } = "select"; // select|range

    public int SortOrder { get; init; }

    // For select
    public List<FilterFacetOptionDto>? Options { get; init; }

    // For range (current context)
    public decimal? MinValue { get; init; }

    public decimal? MaxValue { get; init; }
}

#pragma warning restore CA1002, CS1591, SA1402, SA1600, SA1649
