using GoldPC.OrdersService.Services.Interfaces;
using GoldPC.SharedKernel.DTOs;
using GoldPC.SharedKernel.Models;
using Microsoft.AspNetCore.Mvc;

namespace GoldPC.OrdersService.Controllers;

[ApiController]
[Route("api/v1/promo")]
public class PromoController : ControllerBase
{
    private readonly IPromoCodeService _promoCodeService;
    private readonly ILogger<PromoController> _logger;

    public PromoController(IPromoCodeService promoCodeService, ILogger<PromoController> logger)
    {
        _promoCodeService = promoCodeService;
        _logger = logger;
    }

    /// <summary>
    /// Валидация промокода
    /// </summary>
    /// <param name="request">Данные для валидации промокода</param>
    /// <returns>Результат валидации</returns>
    [HttpPost("validate")]
    [ProducesResponseType(typeof(ApiResponse<ValidatePromoCodeResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ValidatePromoCode([FromBody] ValidatePromoCodeRequest request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ApiResponse.Fail("Неверные данные запроса"));
        }

        var result = await _promoCodeService.ValidatePromoCodeAsync(request.Code, request.OrderAmount);

        return Ok(ApiResponse<ValidatePromoCodeResponse>.Ok(result));
    }
}
