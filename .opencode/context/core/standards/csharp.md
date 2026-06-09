<!-- Context: standards/csharp | Priority: high | Version: 1.0 | Updated: 2026-06-09 -->
# C# / .NET Standards

## Quick Reference

**Core Philosophy**: Explicit, Immutable, Async-First, Fail-Fast.
**Golden Rule**: Make incorrect usage impossible at compile time.

**Critical Patterns**: ✅ Records for DTOs | ✅ `readonly` / `{ get; init; }` | ✅ `async Task<T>` + `Async` suffix | ✅ Constructor injection | ✅ `ArgumentNullException.ThrowIfNull()` | ✅ `Result<T>` for expected failures

**Anti-Patterns**: ❌ `.Result` / `.Wait()` | ❌ Service locator | ❌ Static mutable state | ❌ Silent `catch { }` | ❌ God classes > 500 lines | ❌ Magic strings | ❌ Constructor doing real work | ❌ `async void` (except event handlers) | ❌ `throw ex` (destroys stack trace)

---

## Principles

- **Immutability**: `record` over `class`, `readonly fields`, `{ get; init; }`, `IReadOnlyList<T>`, `with` expressions
- **Async-first**: All I/O is async, `Async` suffix, never `.Result`/`.Wait()`, `ConfigureAwait(false)` in lib code (not needed in ASP.NET Core)
- **Explicit dependencies**: Constructor injection only, no `IServiceProvider.GetService()` in app code, register with explicit lifetime
- **Composition over inheritance**: Interfaces + DI over base classes, no deep hierarchies
- **Fail-fast validation**: Guard clauses at boundaries, `ArgumentNullException.ThrowIfNull()`, never let invalid state propagate

## Language Patterns

### Records & Immutability
```csharp
public record UserDto(Guid Id, string Email, string Role);
public record ProductDto { public required Guid Id { get; init; } public required string Name { get; init; } }
var updated = original with { Email = "new@example.com" };
```
- `readonly struct` for small value types; `readonly ref struct` for performance paths
- `FrozenDictionary`/`FrozenSet` for static lookup data (NET 8+)

### Async/Await
```csharp
public async Task<User?> GetByIdAsync(Guid id, CancellationToken ct = default)
    => await _dbContext.Users.FindAsync(new object[] { id }, ct);
```
- `CancellationToken` as last parameter, propagate through stack
- `Task.WhenAll()` for concurrent independent ops
- `Task.Run()` only for CPU-bound offloading, never as async wrapper in ASP.NET

### Null Safety
- `<Nullable>enable</Nullable>` in project file
- `string?` annotates nullable refs; guard clauses at public boundaries
- `?.` / `??` operators; `[NotNull]`, `[MaybeNull]`, `[MemberNotNull]` attributes

### Dependency Injection
```csharp
public class OrderService(IOrderRepository repo, ILogger<OrderService> logger)
{
    private readonly IOrderRepository _repo = repo;
}
```
- `AddScoped<TI, T>()`, `AddSingleton()`, `AddTransient()`
- `TimeProvider` abstraction (NET 8+) over `DateTime.UtcNow` for testability

### Error Handling
```csharp
// Exception at boundaries
try { return Ok(await _service.GetAsync(id, ct)); }
catch (DomainException ex) { return BadRequest(new ProblemDetails { Detail = ex.Message }); }

// Result<T> for expected failures
public sealed record Result<T>
{
    public T? Value { get; }
    public string? Error { get; }
    public bool IsSuccess => Error is null;
    private Result(T value) => Value = value;
    private Result(string error) => Error = error;
    public static Result<T> Success(T value) => new(value);
    public static Result<T> Failure(string error) => new(error);
}
```
- Custom exceptions inherit `Exception` (not `ApplicationException`)
- Log at boundary, rethrow or translate, never swallow
- Exception for exceptional cases, Result for expected business failures

### Pattern Matching
```csharp
var status = order.Status switch { OrderStatus.Shipped => "Shipped", _ => "Unknown" };
if (order is { Status: OrderStatus.Shipped, Paid: true }) { }
if (items is [var first, .. var rest]) { }           // NET 8+
```

### Primary Constructors (NET 12+)
```csharp
public class UserService(IUserRepository _repo, ILogger<UserService> _logger) : IUserService
{
    public async Task<User?> GetByIdAsync(Guid id, CancellationToken ct)
        => await _repo.FindAsync(id, ct);
}
```
- `_` prefix for captured params; keep lean — dependencies only

---

## ASP.NET Core Patterns

```csharp
[ApiController]
[Route("api/v1/[controller]")]
public class UsersController : ControllerBase
{
    [HttpGet("{id:guid}")]
    public async Task<ActionResult<UserDto>> GetById(Guid id, CancellationToken ct)
    {
        var user = await _userService.GetByIdAsync(id, ct);
        return user is null ? NotFound() : Ok(user);
    }

    [HttpPost]
    public async Task<ActionResult<UserDto>> Create(CreateUserRequest request, CancellationToken ct)
    {
        var result = await _userService.CreateAsync(request, ct);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
    }
}
```
- Return `Ok()`, `NotFound()`, `BadRequest()`, `NoContent()`, `CreatedAtAction()`
- `[Authorize(Roles = "...")]` per-action
- `[FromQuery]`, `[FromBody]`, `[FromRoute]` for model binding
- `ProblemDetails` RFC 7807 for errors (built-in NET 8+)
- Exception middleware as outermost layer; custom middleware = single responsibility

---

## EF Core Patterns

```csharp
public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<User> Users => Set<User>();
    protected override void OnModelCreating(ModelBuilder mb)
        => mb.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);
}

// Registration
builder.Services.AddDbContext<AppDbContext>(opts =>
    opts.UseNpgsql(builder.Configuration.GetConnectionString("Default")));
```
- Fluent API in `IEntityTypeConfiguration<T>` classes; migrations in `Migrations/` folder
- `AsNoTracking()` for reads; `.Include()` / `.ThenInclude()` for eager loading
- Pagination: `.Skip()` + `.Take()` + `CountAsync()` in one query
- `AsSplitQuery()` for large includes; `ExecuteUpdate()` / `ExecuteDelete()` for bulk (NET 7+)
- Never `.AsEnumerable()` before filtering; no N+1
- One `SaveChangesAsync()` per unit of work

---

## Testing (xUnit)

```csharp
[Fact]
public async Task CalculateTotal_ShouldReturnSum_WhenItemsPresent()
{
    // Arrange / Act / Assert
}

[Theory]
[InlineData(0)]
[InlineData(-1)]
public void Validate_ShouldThrow_WhenQuantityInvalid(int qty)
    => Assert.Throws<ArgumentException>(() => service.Validate(qty));
```
- `[Fact]` / `[Theory]` + `[InlineData]`; AAA pattern
- Mock interfaces only (`Mock<T>`); FluentAssertions or built-in Assert
- Naming: `MethodName_ShouldExpected_WhenCondition`
- `AutoFixture` for test data, `Bogus` for realistic fakes, `Testcontainers` for integration tests

## File Organization

```
{Project}/
├── Controllers/          # API endpoints
├── Services/             # Business logic
│   └── Interfaces/       # Service interfaces
├── Data/                 # DbContext, migrations, EF configs
├── Entities/             # Domain entities (behavior-rich, not anemic)
├── Models/               # DTOs, request/response
├── Middleware/            # Pipeline middleware
└── Tests/{Project}.Tests/  # Mirror source structure
```
- One public type per file, filename = type name
- Folder by layer; interfaces in `Interfaces/` subfolder
- Tests mirror: `Tests/{Project}.Tests/{Category}/{File}Tests.cs`
