<!-- Context: standards/csharp-project-structure | Priority: high | Version: 1.0 | Updated: 2026-06-09 -->
# ASP.NET Core Project Structure

## Quick Reference
Standard folder layout for microservices in the GoldPC project.

## Standard Project Layout
```
src/{ServiceName}/
├── Controllers/       # API endpoints
├── Services/          # Business logic
│   └── Interfaces/    # Service interfaces
├── Data/              # EF Core DbContext
├── Entities/          # EF Core entities
├── Models/            # Non-EF models / DTOs (service-specific)
├── Hubs/              # SignalR hubs
├── Migrations/        # EF Core migrations (auto-generated)
├── Validators/        # FluentValidation validators
├── Infrastructure/    # Cross-cutting (caching, external clients)
├── Program.cs         # Startup + DI registration
├── {Service}.csproj   # Project file
└── appsettings.json   # Configuration
```

Alternative layer names used in the project:
- `Models/` sometimes holds entities directly (CatalogService pattern)
- `Services/Interfaces/` — convention for interface files by layer
- Gateway (`GoldPC.Api`) may combine DTOs + interface + implementation in one file for simple cases (temporary — being refactored)

## Shared Projects
```
src/Shared/            # Shared services and implementations
├── Services/          # Shared interfaces + implementations
│   ├── Interfaces/
│   ├── Implementations/
│   └── Mocks/         # Mock implementations for dev
├── Authorization/     # Role constants, policies
└── {Service}.csproj

src/SharedKernel/      # Shared DTOs across microservices
├── DTOs/              # One file per DTO group
├── Utilities/         # Helper classes
└── {Service}.csproj
```

## Microservice Communication
- Gateway pattern: GoldPC.Api is the single entry point
- CatalogService called via `ICatalogServiceClient` (typed HttpClient with `AuthForwardingHandler`)
- Other services (AuthService, WarrantyService) called via direct HTTP or SignalR
- SharedKernel DTOs used across service boundaries
- No direct database access from Gateway

## DI Registration Pattern
All registrations in `Program.cs`:
```csharp
builder.Services.AddScoped<IInterface, Implementation>();
builder.Services.AddHttpClient<IClient, Client>(client => {
    client.BaseAddress = new Uri(builder.Configuration["ServiceUrls:Target"]);
});
```

## Configuration
- `appsettings.json` per service
- Connection strings in `ConnectionStrings` section
- Service URLs in `ServiceUrls` section
- JWT config in `Jwt` section (issuer, audience, secret)
- Environment-specific: `appsettings.{Environment}.json`
- Secrets: `dotnet user-secrets` for local dev

## Migration Pattern
- `dotnet ef migrations add Name`
- `dotnet ef database update`
- Migration files in `Migrations/` folder
- DbContextFactory for design-time migrations

## Response Envelope
```csharp
public class PagedResult<T> {
    public List<T> Data { get; init; } = [];
    public PaginationMeta Meta { get; init; } = new();
}

public class PaginationMeta {
    public int Page { get; init; }
    public int PageSize { get; init; }
    public int TotalItems { get; init; }
    public int TotalPages { get; init; }
    public bool HasNextPage { get; init; }
    public bool HasPrevPage { get; init; }
}
```
