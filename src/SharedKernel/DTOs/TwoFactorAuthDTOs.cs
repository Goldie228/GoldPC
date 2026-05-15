#pragma warning disable CS1591, SA1600
// Copyright (c) GoldPC. All rights reserved.

using GoldPC.SharedKernel.DTOs;

namespace GoldPC.SharedKernel.DTOs;

/// <summary>
/// DTO для двухфакторной аутентификации.
/// </summary>
public class TwoFactorEnableRequest
{
    public string TOTPCode { get; set; } = string.Empty;
}

public class TwoFactorVerifyRequest
{
    public string TOTPCode { get; set; } = string.Empty;
}

public class TwoFactorDisableRequest
{
    public string Password { get; set; } = string.Empty;
}

public class TwoFactorStatusResponse
{
    public bool IsEnabled { get; set; }
    public List<string> RecoveryCodes { get; set; } = new List<string>();
    public string? QRCodeUrl { get; set; }
}