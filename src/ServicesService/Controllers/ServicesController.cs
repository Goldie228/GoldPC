using GoldPC.SharedKernel.DTOs;
using GoldPC.SharedKernel.Enums;
using GoldPC.SharedKernel.Models;
using GoldPC.ServicesService.Services;
using GoldPC.Shared.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using FileUploadResult = GoldPC.SharedKernel.DTOs.FileUploadResult;
using PagedResultServiceRequest = GoldPC.SharedKernel.Models.PagedResult<GoldPC.SharedKernel.DTOs.ServiceRequestDto>;

namespace GoldPC.ServicesService.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
[Authorize]
public class ServicesController : ControllerBase
{
    private readonly IServicesService _servicesService;
    private readonly IOrderEmailService? _orderEmailService;
    private readonly ILogger<ServicesController> _logger;

    public ServicesController(
        IServicesService servicesService,
        ILogger<ServicesController> logger,
        IOrderEmailService? orderEmailService = null)
    {
        _servicesService = servicesService;
        _logger = logger;
        _orderEmailService = orderEmailService;
    }

    [HttpGet("types")]
    [AllowAnonymous]
    public async Task<IActionResult> GetServiceTypes()
    {
        var types = await _servicesService.GetServiceTypesAsync();
        return Ok(ApiResponse<List<ServiceTypeDto>>.Ok(types));
    }

    [HttpGet("types/{slug}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetBySlug(string slug)
    {
        var serviceType = await _servicesService.GetServiceTypeBySlugAsync(slug);
        if (serviceType == null)
            return NotFound(ApiResponse.Fail("Услуга не найдена"));

        return Ok(ApiResponse<ServiceTypeDto>.Ok(serviceType));
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var request = await _servicesService.GetByIdAsync(id);
        if (request == null)
            return NotFound(ApiResponse.Fail("Заявка не найдена"));

        if (!HasAccess(request.ClientId, request.MasterId))
            return Forbid();

        return Ok(ApiResponse<ServiceRequestDto>.Ok(request));
    }

    [HttpGet("my")]
    public async Task<IActionResult> GetMyRequests([FromQuery] int page = 1, [FromQuery] int pageSize = 10, [FromQuery] ServiceRequestStatus? status = null)
    {
        var userId = GetCurrentUserId();
        if (userId == null)
            return Unauthorized(ApiResponse.Fail("Пользователь не авторизован"));

        var result = await _servicesService.GetByClientIdAsync(userId.Value, page, pageSize, status);
        return Ok(ApiResponse<PagedResultServiceRequest>.Ok(result));
    }

    [HttpGet("master")]
    [Authorize(Roles = "Master,Admin")]
    public async Task<IActionResult> GetMasterRequests([FromQuery] int page = 1, [FromQuery] int pageSize = 10)
    {
        var userId = GetCurrentUserId();
        if (userId == null)
            return Unauthorized(ApiResponse.Fail("Пользователь не авторизован"));

        var result = await _servicesService.GetByMasterIdAsync(userId.Value, page, pageSize);
        return Ok(ApiResponse<PagedResultServiceRequest>.Ok(result));
    }

    [HttpGet]
    [Authorize(Roles = "Manager,Admin,Courier")]
    public async Task<IActionResult> GetAll([FromQuery] int page = 1, [FromQuery] int pageSize = 10, [FromQuery] ServiceRequestStatus? status = null)
    {
        var roles = User.FindAll(ClaimTypes.Role).Select(c => c.Value).ToList();
        if (roles.Contains("Courier"))
        {
            var userId = GetCurrentUserId();
            if (userId == null)
                return Unauthorized(ApiResponse.Fail("Пользователь не авторизован"));

            var result = await _servicesService.GetCourierDeliveriesAsync(userId.Value, page, pageSize, status);
            return Ok(ApiResponse<PagedResultServiceRequest>.Ok(result));
        }

        var allResult = await _servicesService.GetAllAsync(page, pageSize, status);
        return Ok(ApiResponse<PagedResultServiceRequest>.Ok(allResult));
    }

    /// <summary>
    /// Получить неназначенные заявки (для мастеров — самоназначение)
    /// </summary>
    [HttpGet("unassigned")]
    [Authorize(Roles = "Master,Manager,Admin")]
    public async Task<IActionResult> GetUnassigned([FromQuery] int page = 1, [FromQuery] int pageSize = 10)
    {
        var result = await _servicesService.GetAllAsync(page, pageSize, ServiceRequestStatus.Submitted);
        return Ok(ApiResponse<PagedResultServiceRequest>.Ok(result));
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateServiceRequestRequest request)
    {
        var userId = GetCurrentUserId();
        if (userId == null)
            return Unauthorized(ApiResponse.Fail("Пользователь не авторизован"));

        var (result, error) = await _servicesService.CreateAsync(userId.Value, request);
        if (error != null)
            return BadRequest(ApiResponse.Fail(error));

        return CreatedAtAction(nameof(GetById), new { id = result!.Id }, ApiResponse<ServiceRequestDto>.Ok(result, "Заявка создана"));
    }

    [HttpPost("{id}/assign/{masterId}")]
    [Authorize(Roles = "Manager,Admin,Master")]
    public async Task<IActionResult> AssignMaster(Guid id, Guid masterId)
    {
        var userId = GetCurrentUserId();
        if (userId == null)
            return Unauthorized(ApiResponse.Fail("Пользователь не авторизован"));

        var (result, error) = await _servicesService.AssignMasterAsync(id, masterId, userId.Value);
        if (error != null)
            return BadRequest(ApiResponse.Fail(error));

        // Отправить уведомление клиенту о назначении мастера (fire-and-forget)
        if (result != null && _orderEmailService != null)
        {
            try
            {
                var clientEmail = result.ClientEmail ?? string.Empty;
                var masterName = result.MasterName ?? "Не указан";
                if (!string.IsNullOrWhiteSpace(clientEmail))
                {
                    await _orderEmailService.SendServiceAssignedAsync(result, masterName, clientEmail);
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Не удалось отправить уведомление о назначении мастера для заявки {RequestNumber}", result.RequestNumber);
            }
        }

        return Ok(ApiResponse<ServiceRequestDto>.Ok(result!));
    }

    /// <summary>
    /// Завершение работы мастером (ФТ-4.9)
    /// Переводит в статус ReadyForPickup
    /// </summary>
    [HttpPut("{id}/complete")]
    [Authorize(Roles = "Master")]
    public async Task<IActionResult> Complete(Guid id, [FromBody] UpdateServiceRequestRequest request)
    {
        var userId = GetCurrentUserId();
        if (userId == null)
            return Unauthorized(ApiResponse.Fail("Пользователь не авторизован"));

        var (result, error) = await _servicesService.CompleteAsync(id, userId.Value, request);
        if (error != null)
            return BadRequest(ApiResponse.Fail(error));

        return Ok(ApiResponse<ServiceRequestDto>.Ok(result!, "Работа завершена, ожидает выдачи"));
    }

    /// <summary>
    /// Обновление статуса (общий эндпоинт)
    /// </summary>
    [HttpPatch("{id}/status")]
    [Authorize(Roles = "Manager,Admin,Master")]
    public async Task<IActionResult> UpdateStatus(Guid id, [FromQuery] ServiceRequestStatus status, [FromQuery] string? comment = null)
    {
        var userId = GetCurrentUserId();
        if (userId == null)
            return Unauthorized(ApiResponse.Fail("Пользователь не авторизован"));

        var (result, error) = await _servicesService.UpdateStatusAsync(id, status, userId.Value, comment);
        if (error != null)
            return BadRequest(ApiResponse.Fail(error));

        return Ok(ApiResponse<ServiceRequestDto>.Ok(result!, "Статус успешно обновлен"));
    }

    /// <summary>
    /// Добавление запчасти к заявке (ФТ-4.8)
    /// </summary>
    [HttpPost("{id}/parts")]
    [Authorize(Roles = "Master,Manager,Admin")]
    public async Task<IActionResult> AddPart(Guid id, [FromBody] ServicePartDto partDto)
    {
        var userId = GetCurrentUserId();
        if (userId == null)
            return Unauthorized(ApiResponse.Fail("Пользователь не авторизован"));

        var (result, error) = await _servicesService.AddPartAsync(id, userId.Value, partDto);
        if (error != null)
            return BadRequest(ApiResponse.Fail(error));

        return Ok(ApiResponse<ServiceRequestDto>.Ok(result!, "Запчасть добавлена"));
    }

    /// <summary>
    /// Получение отчета о работе (ФТ-4.11)
    /// </summary>
    [HttpGet("{id}/report")]
    public async Task<IActionResult> GetReport(Guid id)
    {
        var report = await _servicesService.GenerateReportAsync(id);
        if (report == null)
            return NotFound(ApiResponse.Fail("Отчет не найден"));

        return Ok(ApiResponse<WorkReportDto>.Ok(report));
    }

    /// <summary>
    /// Получить историю сообщений заявки
    /// </summary>
    [HttpGet("{id}/messages")]
    public async Task<IActionResult> GetMessages(Guid id, [FromQuery] int page = 1, [FromQuery] int pageSize = 50)
    {
        var userId = GetCurrentUserId();
        if (userId == null) return Unauthorized(ApiResponse.Fail("Пользователь не авторизован"));

        var messages = await _servicesService.GetMessagesAsync(id, userId.Value, page, pageSize);
        return Ok(ApiResponse<List<TicketMessageDto>>.Ok(messages));
    }

    /// <summary>
    /// Отправить сообщение (REST fallback)
    /// </summary>
    [HttpPost("{id}/messages")]
    public async Task<IActionResult> SendMessage(Guid id, [FromBody] SendMessageRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Content) && string.IsNullOrEmpty(request.FileUrl))
            return BadRequest(ApiResponse.Fail("Пустое сообщение"));

        var userId = GetCurrentUserId();
        if (userId == null) return Unauthorized(ApiResponse.Fail("Пользователь не авторизован"));

        var role = User.FindAll(ClaimTypes.Role).Select(c => c.Value).Contains("Master") ? "Master" : "Client";

        var message = await _servicesService.SendMessageAsync(
            id, userId.Value, role,
            request.Content?.Trim() ?? string.Empty,
            request.FileUrl,
            request.FileName,
            request.FileSize,
            request.ContentType);
        if (message == null) return BadRequest(ApiResponse.Fail("Не удалось отправить сообщение"));

        return Ok(ApiResponse<TicketMessageDto>.Ok(message, "Сообщение отправлено"));
    }

    /// <summary>
    /// Получить количество непрочитанных сообщений
    /// </summary>
    [HttpGet("{id}/messages/unread-count")]
    public async Task<IActionResult> GetUnreadCount(Guid id)
    {
        var userId = GetCurrentUserId();
        if (userId == null) return Unauthorized(ApiResponse.Fail("Пользователь не авторизован"));

        var count = await _servicesService.GetUnreadCountAsync(id, userId.Value);
        return Ok(ApiResponse<int>.Ok(count));
    }

    /// <summary>
    /// Загрузить файл для чата заявки
    /// </summary>
    [HttpPost("{id}/upload")]
    [Authorize]
    [RequestSizeLimit(30 * 1024 * 1024)] // 30 MB
    public async Task<IActionResult> UploadFile(Guid id, IFormFile file)
    {
        if (file == null || file.Length == 0)
            return BadRequest(ApiResponse.Fail("Файл не выбран"));

        var userId = GetCurrentUserId();
        if (userId == null) return Unauthorized(ApiResponse.Fail("Пользователь не авторизован"));

        // Check that the ticket exists
        var ticket = await _servicesService.GetByIdAsync(id);
        if (ticket == null)
            return NotFound(ApiResponse.Fail("Заявка не найдена"));

        // Save to uploads/tickets/{id}/
        var uploadDir = Path.Combine(Directory.GetCurrentDirectory(), "uploads", "tickets", id.ToString());
        Directory.CreateDirectory(uploadDir);

        // Sanitize filename — keep extension, add GUID prefix to avoid collisions
        var ext = Path.GetExtension(file.FileName);
        var safeName = $"{Guid.NewGuid():N}{ext}";
        var filePath = Path.Combine(uploadDir, safeName);

        await using var stream = new FileStream(filePath, FileMode.Create);
        await file.CopyToAsync(stream);

        var fileUrl = $"/uploads/tickets/{id}/{safeName}";

        _logger.LogInformation("File uploaded: {FileUrl} ({Size} bytes) for ticket {TicketId}", fileUrl, file.Length, id);

        return Ok(ApiResponse<FileUploadResult>.Ok(new FileUploadResult
        {
            FileUrl = fileUrl,
            FileName = file.FileName,
            FileSize = file.Length,
            ContentType = file.ContentType,
        }));
    }

    [HttpPost("{id}/cancel")]
    public async Task<IActionResult> Cancel(Guid id)
    {
        var userId = GetCurrentUserId();
        if (userId == null)
            return Unauthorized(ApiResponse.Fail("Пользователь не авторизован"));

        var (success, error) = await _servicesService.CancelAsync(id, userId.Value);
        if (!success)
            return BadRequest(ApiResponse.Fail(error!));

        return Ok(ApiResponse.Ok("Заявка отменена"));
    }

    /// <summary>
    /// Выдача оборудования клиенту (ФТ-4.10)
    /// Переводит в финальный статус Completed
    /// </summary>
    [HttpPost("{id}/close")]
    [Authorize(Roles = "Manager,Admin")]
    public async Task<IActionResult> Close(Guid id, [FromBody] CloseServiceRequestRequest? request = null)
    {
        var userId = GetCurrentUserId();
        if (userId == null)
            return Unauthorized(ApiResponse.Fail("Пользователь не авторизован"));

        var (result, error) = await _servicesService.UpdateStatusAsync(
            id, 
            ServiceRequestStatus.Completed, 
            userId.Value, 
            request?.Comment ?? "Оборудование выдано клиенту, оплата получена");
        
        if (error != null)
            return BadRequest(ApiResponse.Fail(error));

        return Ok(ApiResponse<ServiceRequestDto>.Ok(result!, "Заявка успешно закрыта"));
    }

    // ──────────────────────────────────────────────
    // Assembly endpoints
    // ──────────────────────────────────────────────

    /// <summary>
    /// Создать заявку на сборку ПК (системный вызов из OrderPaidConsumer)
    /// </summary>
    [HttpPost("assembly")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> CreateAssemblyRequest([FromBody] CreateAssemblyRequestDto request)
    {
        var (result, error) = await _servicesService.CreateAssemblyRequestAsync(
            request.ClientId, request.OrderId, request.PCConfigurationId, request.ClientPhone);
        
        if (error != null)
            return BadRequest(ApiResponse.Fail(error));

        return CreatedAtAction(nameof(GetById), new { id = result!.Id }, ApiResponse<ServiceRequestDto>.Ok(result, "Заявка на сборку создана"));
    }

    /// <summary>
    /// Получить комплектующие заявки на сборку
    /// </summary>
    [HttpGet("{id}/assembly-parts")]
    [Authorize(Roles = "Master,Manager,Admin")]
    public async Task<IActionResult> GetAssemblyParts(Guid id)
    {
        var parts = await _servicesService.GetAssemblyPartsAsync(id);
        return Ok(ApiResponse<List<AssemblyPartDto>>.Ok(parts));
    }

    /// <summary>
    /// Отметить комплектующую как полученную со склада
    /// </summary>
    [HttpPost("{id}/parts/{partId}/collect")]
    [Authorize(Roles = "Master")]
    public async Task<IActionResult> CollectPart(Guid id, Guid partId)
    {
        var userId = GetCurrentUserId();
        if (userId == null)
            return Unauthorized(ApiResponse.Fail("Пользователь не авторизован"));

        var (result, error) = await _servicesService.CollectPartAsync(id, partId, userId.Value);
        if (error != null)
            return BadRequest(ApiResponse.Fail(error));

        return Ok(ApiResponse<ServiceRequestDto>.Ok(result!, "Комплектующая получена со склада"));
    }

    /// <summary>
    /// Отметить комплектующую как установленную
    /// </summary>
    [HttpPost("{id}/parts/{partId}/install")]
    [Authorize(Roles = "Master")]
    public async Task<IActionResult> InstallPart(Guid id, Guid partId)
    {
        var userId = GetCurrentUserId();
        if (userId == null)
            return Unauthorized(ApiResponse.Fail("Пользователь не авторизован"));

        var (result, error) = await _servicesService.InstallPartAsync(id, partId, userId.Value);
        if (error != null)
            return BadRequest(ApiResponse.Fail(error));

        return Ok(ApiResponse<ServiceRequestDto>.Ok(result!, "Комплектующая установлена"));
    }

    /// <summary>
    /// Начать сборку ПК
    /// </summary>
    [HttpPost("{id}/start-assembly")]
    [Authorize(Roles = "Master")]
    public async Task<IActionResult> StartAssembly(Guid id)
    {
        var userId = GetCurrentUserId();
        if (userId == null)
            return Unauthorized(ApiResponse.Fail("Пользователь не авторизован"));

        var (result, error) = await _servicesService.StartAssemblyAsync(id, userId.Value);
        if (error != null)
            return BadRequest(ApiResponse.Fail(error));

        return Ok(ApiResponse<ServiceRequestDto>.Ok(result!, "Сборка начата"));
    }

    /// <summary>
    /// Завершить сборку ПК (указать серийный номер)
    /// </summary>
    [HttpPost("{id}/complete-assembly")]
    [Authorize(Roles = "Master")]
    public async Task<IActionResult> CompleteAssembly(Guid id, [FromBody] CompleteAssemblyRequest request)
    {
        var userId = GetCurrentUserId();
        if (userId == null)
            return Unauthorized(ApiResponse.Fail("Пользователь не авторизован"));

        var (result, error) = await _servicesService.CompleteAssemblyAsync(id, userId.Value, request.SerialNumber);
        if (error != null)
            return BadRequest(ApiResponse.Fail(error));

        return Ok(ApiResponse<ServiceRequestDto>.Ok(result!, "Сборка завершена"));
    }

    /// <summary>
    /// Передать собранный ПК в доставку
    /// </summary>
    [HttpPost("{id}/hand-to-delivery")]
    [Authorize(Roles = "Master")]
    public async Task<IActionResult> HandToDelivery(Guid id)
    {
        var userId = GetCurrentUserId();
        if (userId == null)
            return Unauthorized(ApiResponse.Fail("Пользователь не авторизован"));

        var (result, error) = await _servicesService.HandToDeliveryAsync(id, userId.Value);
        if (error != null)
            return BadRequest(ApiResponse.Fail(error));

        return Ok(ApiResponse<ServiceRequestDto>.Ok(result!, "ПК передан в доставку"));
    }

    /// <summary>
    /// Переназначить мастера (для менеджера/координатора)
    /// </summary>
    [HttpPost("{id}/reassign/{newMasterId}")]
    [Authorize(Roles = "Manager,Admin")]
    public async Task<IActionResult> ReassignMaster(Guid id, Guid newMasterId)
    {
        var userId = GetCurrentUserId();
        if (userId == null)
            return Unauthorized(ApiResponse.Fail("Пользователь не авторизован"));

        var (result, error) = await _servicesService.ReassignMasterAsync(id, newMasterId, userId.Value);
        if (error != null)
            return BadRequest(ApiResponse.Fail(error));

        return Ok(ApiResponse<ServiceRequestDto>.Ok(result!, "Мастер переназначен"));
    }

    private Guid? GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("sub")?.Value;
        return userIdClaim != null && Guid.TryParse(userIdClaim, out var userId) ? userId : null;
    }

    private bool HasAccess(Guid clientId, Guid? masterId)
    {
        var currentUserId = GetCurrentUserId();
        var roles = User.FindAll(ClaimTypes.Role).Select(c => c.Value).ToList();

        return currentUserId == clientId || 
               currentUserId == masterId ||
               roles.Contains("Manager") || 
               roles.Contains("Admin");
    }
}