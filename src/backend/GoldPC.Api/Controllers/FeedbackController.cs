using System.Security.Claims;
using System.Text.Encodings.Web;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GoldPC.Api.Controllers;

/// <summary>
/// Контроллер для сбора обратной связи от пользователей
/// </summary>
[ApiController]
[Route("api/v1/feedback")]
public class FeedbackController : ControllerBase
{
    private readonly IFeedbackService _feedbackService;
    private readonly ILogger<FeedbackController> _logger;

    public FeedbackController(IFeedbackService feedbackService, ILogger<FeedbackController> logger)
    {
        _feedbackService = feedbackService;
        _logger = logger;
    }

    /// <summary>
    /// Отправить обратную связь
    /// </summary>
    /// <param name="request">Данные обратной связи</param>
    /// <returns>Результат операции</returns>
    [HttpPost]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> SubmitFeedback([FromBody] FeedbackRequest request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                          ?? User.FindFirst("sub")?.Value;

        if (userIdClaim == null || !Guid.TryParse(userIdClaim, out var userId))
        {
            return Unauthorized(new { error = "Пользователь не авторизован" });
        }

        try
        {
            // Санитарная обработка данных для предотвращения XSS
            var sanitizedComment = HtmlEncoder.Default.Encode(request.Comment ?? string.Empty);
            var sanitizedPage = HtmlEncoder.Default.Encode(request.Page ?? string.Empty);

            await _feedbackService.SubmitAsync(new Feedback
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                Type = request.Type,
                Rating = request.Rating,
                Comment = sanitizedComment,
                Page = sanitizedPage,
                UserAgent = HtmlEncoder.Default.Encode(Request.Headers.UserAgent.ToString()),
                Timestamp = DateTime.UtcNow
            });

            _logger.LogInformation(
                "Feedback received from user {UserId}: {Type} - Rating: {Rating}",
                userId, request.Type, request.Rating);

            return Ok(new { message = "Спасибо за ваш отзыв!" });
        }
#pragma warning disable CA1031 // Ловим все исключения на уровне контроллера для обработки ошибок сервиса
        catch (Exception ex)
#pragma warning restore CA1031
        {
            _logger.LogError(ex, "Failed to submit feedback for user {UserId}", userId);
            return StatusCode(500, new { error = "Не удалось отправить отзыв. Попробуйте позже." });
        }
    }

    /// <summary>
    /// Получить список отзывов (только для администраторов)
    /// </summary>
    /// <param name="page">Номер страницы</param>
    /// <param name="pageSize">Размер страницы</param>
    /// <param name="type">Фильтр по типу</param>
    /// <returns>Список отзывов</returns>
    [HttpGet]
    [Authorize(Roles = "Admin,Manager")]
    [ProducesResponseType(typeof(PagedResult<Feedback>), StatusCodes.Status200OK)]
    public async Task<ActionResult<PagedResult<Feedback>>> GetFeedbacks(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] FeedbackType? type = null)
    {
        var result = await _feedbackService.GetFeedbacksAsync(page, pageSize, type);
        return Ok(result);
    }
}

/// <summary>
/// Тип обратной связи
/// </summary>
public enum FeedbackType
{
    /// <summary>
    /// Отчёт об ошибке
    /// </summary>
    BugReport = 1,

    /// <summary>
    /// Предложение новой функции
    /// </summary>
    FeatureRequest = 2,

    /// <summary>
    /// Общий отзыв
    /// </summary>
    GeneralFeedback = 3,

    /// <summary>
    /// Жалоба
    /// </summary>
    Complaint = 4,

    /// <summary>
    /// Благодарность
    /// </summary>
    Praise = 5
}

/// <summary>
/// Модель запроса обратной связи
/// </summary>
public record FeedbackRequest
{
    /// <summary>
    /// Получает тип обратной связи
    /// </summary>
    public FeedbackType Type { get; init; }

    /// <summary>
    /// Получает оценка от 1 до 5
    /// </summary>
    public int Rating { get; init; }

    /// <summary>
    /// Получает комментарий пользователя
    /// </summary>
    public string? Comment { get; init; }

    /// <summary>
    /// Получает страница, с которой отправлен отзыв
    /// </summary>
    public string? Page { get; init; }
}

/// <summary>
/// Модель обратной связи
/// </summary>
public class Feedback
{
    /// <summary>
    /// Получает или задаёт уникальный идентификатор
    /// </summary>
    public Guid Id { get; set; }

    /// <summary>
    /// Получает или задаёт iD пользователя
    /// </summary>
    public Guid UserId { get; set; }

    /// <summary>
    /// Получает или задаёт тип обратной связи
    /// </summary>
    public FeedbackType Type { get; set; }

    /// <summary>
    /// Получает или задаёт оценка от 1 до 5
    /// </summary>
    public int Rating { get; set; }

    /// <summary>
    /// Получает или задаёт комментарий
    /// </summary>
    public string? Comment { get; set; }

    /// <summary>
    /// Получает или задаёт страница, с которой отправлен отзыв
    /// </summary>
    public string? Page { get; set; }

    /// <summary>
    /// Получает или задаёт user-Agent браузера
    /// </summary>
    public string? UserAgent { get; set; }

    /// <summary>
    /// Получает или задаёт время создания
    /// </summary>
    public DateTime Timestamp { get; set; }
}

/// <summary>
/// Пагинированный результат
/// </summary>
public class PagedResult<T>
{
    /// <summary>
    /// Получает или задаёт данные
    /// </summary>
    public IEnumerable<T> Data { get; set; } = Enumerable.Empty<T>();

    /// <summary>
    /// Получает или задаёт метаданные пагинации
    /// </summary>
    public PaginationMeta Meta { get; set; } = new();
}

/// <summary>
/// Метаданные пагинации
/// </summary>
public class PaginationMeta
{
    /// <summary>
    /// Получает или задаёт текущая страница
    /// </summary>
    public int Page { get; set; }

    /// <summary>
    /// Получает или задаёт размер страницы
    /// </summary>
    public int PageSize { get; set; }

    /// <summary>
    /// Получает или задаёт всего элементов
    /// </summary>
    public int TotalItems { get; set; }

    /// <summary>
    /// Получает или задаёт всего страниц
    /// </summary>
    public int TotalPages { get; set; }

    /// <summary>
    /// Получает или задаёт значение, указывающее, есть следующая страница
    /// </summary>
    public bool HasNextPage { get; set; }

    /// <summary>
    /// Получает или задаёт значение, указывающее, есть предыдущая страница
    /// </summary>
    public bool HasPrevPage { get; set; }
}

/// <summary>
/// Интерфейс сервиса обратной связи
/// </summary>
public interface IFeedbackService
{
    /// <summary>
    /// Сохранить обратную связь
    /// </summary>
    /// <returns>A <see cref="Task"/> representing the asynchronous operation.</returns>
    Task SubmitAsync(Feedback feedback);

    /// <summary>
    /// Получить список обратной связи
    /// </summary>
    /// <returns>A <see cref="Task"/> representing the asynchronous operation.</returns>
    Task<PagedResult<Feedback>> GetFeedbacksAsync(int page, int pageSize, FeedbackType? typeFilter);
}

/// <summary>
/// Реализация сервиса обратной связи
/// </summary>
public class FeedbackService : IFeedbackService
{
    private readonly ILogger<FeedbackService> _logger;
    private readonly List<Feedback> _feedbackStorage = new();

    public FeedbackService(ILogger<FeedbackService> logger)
    {
        _logger = logger;
    }

    /// <inheritdoc/>
    public Task SubmitAsync(Feedback feedback)
    {
        _feedbackStorage.Add(feedback);
        _logger.LogInformation(
            "Feedback saved: {FeedbackId} from user {UserId}",
            feedback.Id, feedback.UserId);
        return Task.CompletedTask;
    }

    /// <inheritdoc/>
    public Task<PagedResult<Feedback>> GetFeedbacksAsync(int page, int pageSize, FeedbackType? typeFilter)
    {
        var query = _feedbackStorage.AsEnumerable();

        if (typeFilter.HasValue)
        {
            query = query.Where(f => f.Type == typeFilter.Value);
        }

        // Материализуем запрос для избежания повторной итерации (CA1851)
        var orderedList = query.OrderByDescending(f => f.Timestamp).ToList();
        var totalItems = orderedList.Count;
        var totalPages = (int)Math.Ceiling(totalItems / (double)pageSize);

        var data = orderedList
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToList();

        return Task.FromResult(new PagedResult<Feedback>
        {
            Data = data,
            Meta = new PaginationMeta
            {
                Page = page,
                PageSize = pageSize,
                TotalItems = totalItems,
                TotalPages = totalPages,
                HasNextPage = page < totalPages,
                HasPrevPage = page > 1
            }
        });
    }
}
