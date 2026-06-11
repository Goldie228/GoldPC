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
        catch (Exception ex)
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
    /// Gets тип обратной связи
    /// </summary>
    public FeedbackType Type { get; init; }

    /// <summary>
    /// Gets оценка от 1 до 5
    /// </summary>
    public int Rating { get; init; }

    /// <summary>
    /// Gets комментарий пользователя
    /// </summary>
    public string? Comment { get; init; }

    /// <summary>
    /// Gets страница, с которой отправлен отзыв
    /// </summary>
    public string? Page { get; init; }
}

/// <summary>
/// Модель обратной связи
/// </summary>
public class Feedback
{
    /// <summary>
    /// Gets or sets уникальный идентификатор
    /// </summary>
    public Guid Id { get; set; }

    /// <summary>
    /// Gets or sets iD пользователя
    /// </summary>
    public Guid UserId { get; set; }

    /// <summary>
    /// Gets or sets тип обратной связи
    /// </summary>
    public FeedbackType Type { get; set; }

    /// <summary>
    /// Gets or sets оценка от 1 до 5
    /// </summary>
    public int Rating { get; set; }

    /// <summary>
    /// Gets or sets комментарий
    /// </summary>
    public string? Comment { get; set; }

    /// <summary>
    /// Gets or sets страница, с которой отправлен отзыв
    /// </summary>
    public string? Page { get; set; }

    /// <summary>
    /// Gets or sets user-Agent браузера
    /// </summary>
    public string? UserAgent { get; set; }

    /// <summary>
    /// Gets or sets время создания
    /// </summary>
    public DateTime Timestamp { get; set; }
}

/// <summary>
/// Пагинированный результат
/// </summary>
public class PagedResult<T>
{
    /// <summary>
    /// Gets or sets данные
    /// </summary>
    public IEnumerable<T> Data { get; set; } = Enumerable.Empty<T>();

    /// <summary>
    /// Gets or sets метаданные пагинации
    /// </summary>
    public PaginationMeta Meta { get; set; } = new();
}

/// <summary>
/// Метаданные пагинации
/// </summary>
public class PaginationMeta
{
    /// <summary>
    /// Gets or sets текущая страница
    /// </summary>
    public int Page { get; set; }

    /// <summary>
    /// Gets or sets размер страницы
    /// </summary>
    public int PageSize { get; set; }

    /// <summary>
    /// Gets or sets всего элементов
    /// </summary>
    public int TotalItems { get; set; }

    /// <summary>
    /// Gets or sets всего страниц
    /// </summary>
    public int TotalPages { get; set; }

    /// <summary>
    /// Gets or sets a value indicating whether есть следующая страница
    /// </summary>
    public bool HasNextPage { get; set; }

    /// <summary>
    /// Gets or sets a value indicating whether есть предыдущая страница
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
    private static readonly List<Feedback> _feedbackStorage = new();

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

        var orderedQuery = query.OrderByDescending(f => f.Timestamp);
        var totalItems = orderedQuery.Count();
        var totalPages = (int)Math.Ceiling(totalItems / (double)pageSize);

        var data = orderedQuery
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
