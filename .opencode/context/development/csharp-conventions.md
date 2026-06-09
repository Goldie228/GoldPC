<!-- Context: development/csharp-conventions | Priority: high | Version: 1.0 | Updated: 2026-06-09 -->

# C# Conventions — GoldPC Backend

**Scope**: Shared coding standards for all ASP.NET Core 8 microservices.

---

## Table of Contents
- [Project Structure](#project-structure)
- [Namespaces](#namespaces)
- [Controllers](#controllers)
- [Services & Repositories](#services--repositories)
- [Entities & DbContext](#entities--dbcontext)
- [DTOs & SharedKernel](#dtos--sharedkernel)
- [DI Registration](#di-registration)
- [Naming Conventions](#naming-conventions)
- [Response Types](#response-types)
- [Security](#security)
- [File Organization](#file-organization)
- [Thread Safety](#thread-safety)
- [Work in Progress](#work-in-progress)

---

## Project Structure

Backend consists of **8 microservices** under `src/`:

```
src/
├── GoldPC.Api/              # API Gateway
├── AuthService/
├── CatalogService/
├── OrdersService/
├── PCBuilderService/
├── ReportingService/
├── ServicesService/
├── WarrantyService/
├── Shared/                  # Shared code (utilities, helpers)
└── SharedKernel/            # Shared DTOs, enums, models
```

Inside each service, standard folder layout:

```
{Service}/
├── Controllers/
├── Services/
│   └── Interfaces/
├── Data/
├── Entities/
├── Models/
├── Migrations/
├── Program.cs
└── {Service}.csproj
```

### Folders by layer

| Layer | Folder | Purpose |
|-------|--------|---------|
| Controllers | `Controllers/` | API endpoints |
| Business logic | `Services/` | Service implementations |
| Service contracts | `Services/Interfaces/` | Service interfaces |
| Persistence | `Data/` | DbContext, configurations |
| Domain models | `Entities/` | EF Core entity classes |
| View models | `Models/` | Request/response models (service-specific) |
| DB migrations | `Migrations/` | EF Core migrations |

---

## Namespaces

**Standard** — `GoldPC.{ServiceName}.{Layer}`

```csharp
namespace GoldPC.AuthService.Controllers;
namespace GoldPC.AuthService.Services;
namespace GoldPC.AuthService.Services.Interfaces;
namespace GoldPC.AuthService.Data;
namespace GoldPC.AuthService.Entities;
```

**Exception** — `CatalogService` uses a **flat namespace** (no `GoldPC.` prefix):

```csharp
namespace CatalogService.Controllers;
namespace CatalogService.Services;
namespace CatalogService.Repositories;
namespace CatalogService.Repositories.Interfaces;
```

Interfaces reside in an `Interfaces/` subfolder within their layer:

```
Services/
├── AuthService.cs
└── Interfaces/
    └── IAuthService.cs
```

```csharp
namespace GoldPC.AuthService.Services.Interfaces;

public interface IAuthService { ... }
```

```csharp
namespace GoldPC.AuthService.Services;

public class AuthService : IAuthService { ... }
```

---

## Controllers

- Inherit from `ControllerBase`
- Decorated with `[ApiController]` and `[Route("api/v1/[controller]")]`
- All actions are `async Task<ActionResult<T>>` or `async Task<IActionResult>`
- **Explicit `[Authorize(Roles = "...")]`** on each action (not class-level)

```csharp
[ApiController]
[Route("api/v1/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    [HttpPost("register")]
    [ProducesResponseType(typeof(ApiResponse<AuthResponse>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request)
    {
        var (response, error) = await _authService.RegisterAsync(request);
        if (error != null)
            return BadRequest(ApiResponse.Fail(error));
        return CreatedAtAction(nameof(Register), ApiResponse.Success(response));
    }

    [Authorize(Roles = "Admin")]
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteUser(Guid id)
    {
        var result = await _userService.DeleteUserAsync(id);
        if (!result) return NotFound(new { error = "User not found" });
        return NoContent();
    }
}
```

---

## Services & Repositories

### Service pattern

Each service has an **interface** in `Services/Interfaces/` and an **implementation** in `Services/`:

```csharp
// Services/Interfaces/IAuthService.cs
public interface IAuthService
{
    Task<(AuthResponse? Response, string? Error)> RegisterAsync(RegisterRequest request);
    Task<(AuthResponse? Response, string? Error)> LoginAsync(LoginRequest request);
}
```

```csharp
// Services/AuthService.cs
public class AuthService : IAuthService
{
    private readonly AuthDbContext _context;
    private readonly IJwtService _jwtService;
    private readonly ILogger<AuthService> _logger;

    public AuthService(
        AuthDbContext context,
        IJwtService jwtService,
        ILogger<AuthService> logger)
    {
        _context = context;
        _jwtService = jwtService;
        _logger = logger;
    }

    public async Task<(AuthResponse? Response, string? Error)> RegisterAsync(RegisterRequest request)
    {
        // implementation
    }
}
```

### Repository pattern

Same interface + implementation structure in `Repositories/`:

```csharp
// Repositories/Interfaces/IProductRepository.cs
public interface IProductRepository
{
    Task<PagedResult<Product>> GetProductsAsync(ProductFilter filter);
    Task<Product?> GetByIdAsync(Guid id);
}
```

---

## Entities & DbContext

### Entity classes

```csharp
namespace GoldPC.AuthService.Entities;

public class User
{
    public Guid Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime? LastLoginAt { get; set; }
}
```

### DbContext with Fluent API

```csharp
public class AuthDbContext : DbContext
{
    public DbSet<User> Users => Set<User>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.Email).IsUnique();
            entity.Property(e => e.Email).HasMaxLength(256).IsRequired();
        });
    }
}
```

Migrations stored in `Migrations/` folder, generated via `dotnet ef migrations add`.

---

## DTOs & SharedKernel

Cross-service DTOs live in `src/SharedKernel/` under namespace `GoldPC.SharedKernel.DTOs`.

**Use `record` types with `{ get; init; }` for all DTOs:**

```csharp
namespace GoldPC.SharedKernel.DTOs;

public record AuthResponse
{
    public string Token { get; init; } = string.Empty;
    public string RefreshToken { get; init; } = string.Empty;
    public DateTime ExpiresAt { get; init; }
    public UserProfile User { get; init; } = null!;
}

public record UserProfile
{
    public Guid Id { get; init; }
    public string Email { get; init; } = string.Empty;
    public string FullName { get; init; } = string.Empty;
}
```

**Serialization** uses `System.Text.Json` (not Newtonsoft).

---

## DI Registration

All dependencies registered explicitly in `Program.cs` using `AddScoped`:

```csharp
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IJwtService, JwtService>();
builder.Services.AddScoped<IProductRepository, ProductRepository>();
```

Also configured in `Program.cs`:
- **CORS** — `builder.Services.AddCors(...)`
- **JWT auth** — `builder.Services.AddAuthentication().AddJwtBearer(...)`
- **SignalR** — `builder.Services.AddSignalR()`
- **DbContext** — `builder.Services.AddDbContext<TDbContext>(...)`

---

## Naming Conventions

| Element | Convention | Example |
|---------|-----------|---------|
| Interfaces | `I` prefix + PascalCase | `ICatalogService` |
| Private fields | `_camelCase` with underscore prefix | `_authService`, `_logger` |
| Local variables | `camelCase` | `request`, `response`, `error` |
| Methods | `PascalCase` | `RegisterAsync`, `GetByIdAsync` |
| Async methods | `Async` suffix | `GetUsersAsync`, `SaveChangesAsync` |
| Public properties | `PascalCase` with `{ get; init; }` for DTOs | `public string Token { get; init; }` |
| Constants | `PascalCase` | `private const int MaxFailedAttempts = 5;` |
| Parameters | `camelCase` | `(RegisterRequest request)` |

```csharp
public class AuthService : IAuthService
{
    private readonly IAuthRepository _authRepository;
    private readonly ILogger<AuthService> _logger;
    private const int MaxFailedAttempts = 5;

    public async Task<AuthResponse?> LoginAsync(LoginRequest request)
    {
        var user = await _authRepository.GetByEmailAsync(request.Email);
        // ...
    }
}
```

---

## Response Types

### PagedResult\<T\>

Used for paginated list responses:

```csharp
public record PagedResult<T>
{
    public List<T> Data { get; init; } = [];
    public PaginationMeta Meta { get; init; } = null!;
}

public record PaginationMeta
{
    public int Page { get; init; }
    public int PageSize { get; init; }
    public int TotalCount { get; init; }
    public int TotalPages => (int)Math.Ceiling((double)TotalCount / PageSize);
}
```

### Standard HTTP responses

| Situation | Return |
|-----------|--------|
| Success with body | `Ok(result)` |
| Created resource | `CreatedAtAction(nameof(Action), result)` |
| Empty success | `NoContent()` |
| Not found | `NotFound(new { error = "message" })` |
| Bad request | `BadRequest(new { error = "message" })` |
| Conflict | `Conflict(new { error = "message" })` |

```csharp
return Ok(new { data = products, total = count });
return NotFound(new { error = $"User with id {id} not found" });
return BadRequest(ApiResponse.Fail("Invalid credentials"));
```

---

## Security

- **JWT Bearer** authentication configured globally
- **Role-based authorization** per-action with `[Authorize(Roles = "...")]`
- Passwords hashed with `System.Security.Cryptography` (SHA256/PBKDF2)
- Input validation via `[FromBody]` + model binding attributes
- No secrets in code — all via `IConfiguration` / environment variables

---

## File Organization

- **One class per file** (exceptions noted in [Work in Progress](#work-in-progress))
- **File name matches class name** — `AuthService.cs` contains `class AuthService`
- Controllers inherit from `ControllerBase`
- Service implementations mirror interface in `Services/Interfaces/`
- Same-layer interfaces in `*/Interfaces/` subfolder

---

## Thread Safety

Use `lock` statement for thread safety on shared mutable state:

```csharp
private readonly object _lock = new();
private static List<T> _cache = [];

public T GetOrAdd(string key, Func<T> factory)
{
    lock (_lock)
    {
        var item = _cache.Find(x => x.Key == key);
        if (item != null) return item;
        item = factory();
        _cache.Add(item);
        return item;
    }
}
```

Prefer immutable data (`record`, `IReadOnlyList<T>`) where possible.

---

## Work in Progress

The following items are known technical debt or incomplete work:

### 🔴 AdminController.cs — God Module
`AdminController.cs` is approximately **1350 lines** combining admin logic, DTOs, and service calls. Scheduled for splitting into:
- `AdminController.cs` — endpoints only
- `AdminService.cs` — business logic
- Separate DTO files

### 🟡 OrderService — Not Yet Connected
The `OrdersService` dashboard statistics currently use **placeholder/seed data**. Real database integration and event wiring are not yet complete. Stats like "total orders", "revenue today" return static values until connected.

### 🟡 In-Memory Storage
Some services (notably early-stage ones) use **in-memory collections** (`static List<T>`, `ConcurrentDictionary`) instead of EF Core + a real database. These are temporary until:
- The database schema is finalized
- Migrations are generated
- DbContext registration is added in `Program.cs`

### 🟡 Split Refactoring
`AdminService` and several DTO classes are currently co-located in the same file as `AdminController`. These are being extracted into their own files as part of ongoing refactoring.
