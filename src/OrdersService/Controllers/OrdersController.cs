using GoldPC.SharedKernel.DTOs;
using GoldPC.SharedKernel.Enums;
using GoldPC.SharedKernel.Models;
using PagedResultOrder = GoldPC.SharedKernel.Models.PagedResult<GoldPC.SharedKernel.DTOs.OrderDto>;
using GoldPC.OrdersService.Services;
using GoldPC.Shared.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace GoldPC.OrdersService.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
[Authorize]
public class OrdersController : ControllerBase
{
    private readonly IOrdersService _ordersService;
    private readonly IPaymentService _paymentService;
    private readonly ILogger<OrdersController> _logger;

    public OrdersController(IOrdersService ordersService, IPaymentService paymentService, ILogger<OrdersController> logger)
    {
        _ordersService = ordersService;
        _paymentService = paymentService;
        _logger = logger;
    }

    /// <summary>
    /// Получение заказа по ID
    /// </summary>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(ApiResponse<OrderDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetById(Guid id)
    {
        var order = await _ordersService.GetByIdAsync(id);
        if (order == null)
        {
            return NotFound(ApiResponse.Fail("Заказ не найден"));
        }

        if (!HasAccess(order.UserId))
        {
            return Forbid();
        }

        return Ok(ApiResponse<OrderDto>.Ok(order));
    }

    /// <summary>
    /// Получение заказа по номеру
    /// </summary>
    [HttpGet("number/{orderNumber}")]
    [ProducesResponseType(typeof(ApiResponse<OrderDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetByNumber(string orderNumber)
    {
        var order = await _ordersService.GetByNumberAsync(orderNumber);
        if (order == null)
        {
            return NotFound(ApiResponse.Fail("Заказ не найден"));
        }

        if (!HasAccess(order.UserId))
        {
            return Forbid();
        }

        return Ok(ApiResponse<OrderDto>.Ok(order));
    }

    /// <summary>
    /// Получение списка заказов пользователя
    /// </summary>
    [HttpGet("my")]
    public async Task<IActionResult> GetMyOrders([FromQuery] int page = 1, [FromQuery] int pageSize = 10)
    {
        var userId = GetCurrentUserId();
        if (userId == null)
        {
            return Unauthorized(ApiResponse.Fail("Пользователь не авторизован"));
        }

        var result = await _ordersService.GetByUserIdAsync(userId.Value, page, pageSize);
        return Ok(ApiResponse<PagedResultOrder>.Ok(result));
    }

    /// <summary>
    /// Получение всех заказов (для менеджеров/админов)
    /// </summary>
    [HttpGet]
    [Authorize(Roles = "Manager,Admin,Accountant")]
    public async Task<IActionResult> GetAll([FromQuery] int page = 1, [FromQuery] int pageSize = 10, [FromQuery] OrderStatus? status = null)
    {
        var result = await _ordersService.GetAllAsync(page, pageSize, status);
        return Ok(ApiResponse<PagedResultOrder>.Ok(result));
    }

    /// <summary>
    /// Создание заказа
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(ApiResponse<OrderDto>), StatusCodes.Status201Created)]
    public async Task<IActionResult> Create([FromBody] CreateOrderRequest request)
    {
        var userId = GetCurrentUserId();
        if (userId == null)
        {
            return Unauthorized(ApiResponse.Fail("Пользователь не авторизован"));
        }

        var (order, error) = await _ordersService.CreateAsync(userId.Value, request);
        if (error != null)
        {
            return BadRequest(ApiResponse.Fail(error));
        }

        return CreatedAtAction(nameof(GetById), new { id = order!.Id }, ApiResponse<OrderDto>.Ok(order, "Заказ успешно создан"));
    }

    /// <summary>
    /// Предварительный расчет стоимости доставки.
    /// </summary>
    [HttpPost("delivery/quote")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(ApiResponse<DeliveryQuoteResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetDeliveryQuote([FromBody] DeliveryQuoteRequest request)
    {
        var quote = await _ordersService.CalculateDeliveryQuoteAsync(request);
        return Ok(ApiResponse<DeliveryQuoteResponse>.Ok(quote));
    }

    /// <summary>
    /// Изменение статуса заказа
    /// </summary>
    [HttpPut("{id}/status")]
    [Authorize(Roles = "Manager,Admin,Master")]
    public async Task<IActionResult> UpdateStatus(Guid id, [FromBody] UpdateOrderStatusRequest request)
    {
        var userId = GetCurrentUserId();
        if (userId == null)
        {
            return Unauthorized(ApiResponse.Fail("Пользователь не авторизован"));
        }

        var (order, error) = await _ordersService.UpdateStatusAsync(id, request.Status, userId.Value, request.Comment);
        if (error != null)
        {
            return BadRequest(ApiResponse.Fail(error));
        }

        return Ok(ApiResponse<OrderDto>.Ok(order!));
    }

    /// <summary>
    /// Отмена заказа
    /// </summary>
    [HttpPost("{id}/cancel")]
    public async Task<IActionResult> Cancel(Guid id)
    {
        var userId = GetCurrentUserId();
        if (userId == null)
        {
            return Unauthorized(ApiResponse.Fail("Пользователь не авторизован"));
        }

        var (success, error) = await _ordersService.CancelAsync(id, userId.Value);
        if (!success)
        {
            return BadRequest(ApiResponse.Fail(error!));
        }

        return Ok(ApiResponse.Ok("Заказ отменён"));
    }

    /// <summary>
    /// Оплата заказа
    /// </summary>
    [HttpPost("{id}/pay")]
    public async Task<IActionResult> Pay(Guid id)
    {
        var order = await _ordersService.GetByIdAsync(id);
        if (order == null)
        {
            return NotFound(ApiResponse.Fail("Заказ не найден"));
        }

        if (!HasAccess(order.UserId))
        {
            return Forbid();
        }

        if (order.PaymentMethod != "Online")
        {
            return BadRequest(ApiResponse.Fail("Этот заказ не оплачивается онлайн"));
        }

        var (paymentUrl, error) = await _paymentService.CreatePaymentAsync(id, order.Total);
        if (error != null)
        {
            return BadRequest(ApiResponse.Fail(error));
        }

        return Ok(ApiResponse<object>.Ok(new { paymentUrl }));
    }

    private Guid? GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("sub")?.Value;
        return userIdClaim != null && Guid.TryParse(userIdClaim, out var userId) ? userId : null;
    }

    private bool HasAccess(Guid orderUserId)
    {
        var currentUserId = GetCurrentUserId();
        var roles = User.FindAll(ClaimTypes.Role).Select(c => c.Value).ToList();
        
        return currentUserId == orderUserId || 
               roles.Contains("Manager") || 
               roles.Contains("Admin") ||
               roles.Contains("Master");
    }
}