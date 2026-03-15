# Repository Pattern в GoldPC

## 📋 Обзор

Repository Pattern используется в проекте GoldPC для абстрагирования слоя доступа к данным от бизнес-логики. Это обеспечивает тестируемость, поддерживаемость и следование принципам Clean Architecture.

---

## 🏗️ Архитектура

### Иерархия интерфейсов

```
IRepository<T> (базовый generic интерфейс)
    ↓
IProductRepository, ICategoryRepository, IOrderRepository... (специфичные интерфейсы)
    ↓
ProductRepository, CategoryRepository, OrderRepository... (реализации)
```

---

## 📐 Базовый интерфейс IRepository<T>

```csharp
namespace SharedKernel.Repositories;

/// <summary>
/// Базовый интерфейс репозитория для всех сущностей
/// </summary>
/// <typeparam name="T">Тип сущности, наследующий BaseEntity</typeparam>
public interface IRepository<T> where T : BaseEntity
{
    /// <summary>
    /// Получить сущность по ID
    /// </summary>
    Task<T?> GetByIdAsync(Guid id);
    
    /// <summary>
    /// Получить все сущности
    /// </summary>
    Task<IEnumerable<T>> GetAllAsync();
    
    /// <summary>
    /// Получить страницу сущностей с пагинацией
    /// </summary>
    Task<PagedResult<T>> GetPagedAsync(int page, int pageSize, Specification<T>? spec = null);
    
    /// <summary>
    /// Создать сущность
    /// </summary>
    Task<T> CreateAsync(T entity);
    
    /// <summary>
    /// Обновить сущность
    /// </summary>
    Task<T> UpdateAsync(T entity);
    
    /// <summary>
    /// Удалить сущность (soft delete)
    /// </summary>
    Task DeleteAsync(Guid id);
    
    /// <summary>
    /// Проверить существование сущности
    /// </summary>
    Task<bool> ExistsAsync(Guid id);
}
```

---

## 📐 Специфичные интерфейсы

Каждый репозиторий имеет свой специфичный интерфейс с методами, уникальными для данной сущности:

```csharp
namespace CatalogService.Repositories.Interfaces;

/// <summary>
/// Интерфейс репозитория товаров
/// </summary>
public interface IProductRepository
{
    // Базовые CRUD операции
    Task<Product?> GetByIdAsync(Guid id);
    Task<Product> CreateAsync(Product product);
    Task<Product> UpdateAsync(Product product);
    Task DeleteAsync(Guid id);
    Task<bool> ExistsAsync(Guid id);
    
    // Специфичные методы для товаров
    Task<Product?> GetBySkuAsync(string sku);
    Task<Product?> GetDetailByIdAsync(Guid id);
    Task<RepositoryPagedResult<Product>> GetFilteredAsync(ProductFilterDto filter);
    Task<IEnumerable<Product>> GetByIdsAsync(IEnumerable<Guid> ids);
    Task<IEnumerable<Product>> GetByCategoryAsync(Guid categoryId);
    Task<bool> SkuExistsAsync(string sku, Guid? excludeId = null);
    Task UpdateStockAsync(Guid id, int quantity);
}
```

---

## 🔧 Реализация репозитория

### Шаблон реализации

```csharp
namespace CatalogService.Repositories;

/// <summary>
/// Реализация репозитория товаров
/// </summary>
public class ProductRepository : IProductRepository
{
    private readonly CatalogDbContext _context;
    private readonly ILogger<ProductRepository> _logger;

    public ProductRepository(CatalogDbContext context, ILogger<ProductRepository> logger)
    {
        _context = context;
        _logger = logger;
    }
    
    // Реализация методов...
}
```

### Ключевые принципы реализации

1. **Асинхронность** — все методы должны быть асинхронными
2. **Логирование** — логировать важные операции (создание, обновление, удаление)
3. **Soft Delete** — использовать мягкое удаление где возможно
4. **Include** — явно загружать навигационные свойства

---

## 📦 Результат пагинации

```csharp
/// <summary>
/// Результат пагинации для репозитория
/// </summary>
public class RepositoryPagedResult<T>
{
    public List<T> Items { get; init; } = new();
    public int TotalCount { get; init; }
    public int Page { get; init; }
    public int PageSize { get; init; }
}
```

---

## ✅ Правила использования

### Обязательно

| Правило | Описание |
|---------|----------|
| ✅ Использовать интерфейсы | Всегда зависеть от `IProductRepository`, не от `ProductRepository` |
| ✅ Асинхронные методы | Все методы работы с БД должны быть `async/await` |
| ✅ Логирование операций | Логировать Create, Update, Delete операции |
| ✅ Soft Delete | Помечать записи как неактивные вместо физического удаления |
| ✅ Include для деталей | Явно загружать связанные сущности через `.Include()` |

### Запрещено

| Правило | Описание |
|---------|----------|
| ❌ DbContext в сервисах | Никогда не использовать `DbContext` напрямую в сервисах или контроллерах |
| ❌ Синхронные методы | Не использовать синхронные методы EF (например, `ToList()` вместо `ToListAsync()`) |
| ❌ Пропуск Include | Не забывать `.Include()` для навигационных свойств |
| ❌ Hardcoded строки | Не использовать магические строки в запросах |
| ❌ Бизнес-логика в репозитории | Репозиторий только для доступа к данным |

---

## 🧪 DI Регистрация

```csharp
// Program.cs
builder.Services.AddScoped<IProductRepository, ProductRepository>();
builder.Services.AddScoped<ICategoryRepository, CategoryRepository>();
builder.Services.AddScoped<IManufacturerRepository, ManufacturerRepository>();
builder.Services.AddScoped<IReviewRepository, ReviewRepository>();
```

---

## 📋 Примеры использования

### В сервисе

```csharp
public class ProductService
{
    private readonly IProductRepository _productRepository;
    private readonly ILogger<ProductService> _logger;
    
    public ProductService(IProductRepository productRepository, ILogger<ProductService> logger)
    {
        _productRepository = productRepository;
        _logger = logger;
    }
    
    public async Task<Product?> GetProductDetailAsync(Guid id)
    {
        var product = await _productRepository.GetDetailByIdAsync(id);
        
        if (product == null)
        {
            _logger.LogWarning("Product {ProductId} not found", id);
        }
        
        return product;
    }
    
    public async Task<PagedResult<ProductDto>> GetProductsAsync(ProductFilterDto filter)
    {
        var result = await _productRepository.GetFilteredAsync(filter);
        
        return new PagedResult<ProductDto>
        {
            Items = result.Items.MapToDtos(),
            TotalCount = result.TotalCount,
            Page = result.Page,
            PageSize = result.PageSize
        };
    }
}
```

### Фильтрация

```csharp
public async Task<RepositoryPagedResult<Product>> GetFilteredAsync(ProductFilterDto filter)
{
    var query = _context.Products
        .Include(p => p.Category)
        .Include(p => p.Manufacturer)
        .Where(p => p.IsActive);

    // Применение фильтров
    if (filter.CategoryId.HasValue)
    {
        query = query.Where(p => p.CategoryId == filter.CategoryId.Value);
    }

    if (filter.MinPrice.HasValue)
    {
        query = query.Where(p => p.Price >= filter.MinPrice.Value);
    }

    // Подсчёт и пагинация
    var totalCount = await query.CountAsync();
    
    var items = await query
        .Skip((filter.Page - 1) * filter.PageSize)
        .Take(filter.PageSize)
        .ToListAsync();

    return new RepositoryPagedResult<Product>
    {
        Items = items,
        TotalCount = totalCount,
        Page = filter.Page,
        PageSize = filter.PageSize
    };
}
```

---

## ⚠️ Типичные ошибки

### 1. Прямое использование DbContext

```csharp
// ❌ НЕПРАВИЛЬНО
public class ProductController : ControllerBase
{
    private readonly CatalogDbContext _context;
    
    public ProductController(CatalogDbContext context)
    {
        _context = context;
    }
    
    public async Task<IActionResult> Get(Guid id)
    {
        var product = await _context.Products.FindAsync(id);
        return Ok(product);
    }
}

// ✅ ПРАВИЛЬНО
public class ProductController : ControllerBase
{
    private readonly IProductRepository _productRepository;
    
    public ProductController(IProductRepository productRepository)
    {
        _productRepository = productRepository;
    }
    
    public async Task<IActionResult> Get(Guid id)
    {
        var product = await _productRepository.GetByIdAsync(id);
        return Ok(product);
    }
}
```

### 2. Синхронные методы

```csharp
// ❌ НЕПРАВИЛЬНО
public Product GetById(Guid id)
{
    return _context.Products.Find(id);
}

// ✅ ПРАВИЛЬНО
public async Task<Product?> GetByIdAsync(Guid id)
{
    return await _context.Products.FirstOrDefaultAsync(p => p.Id == id);
}
```

### 3. N+1 проблема

```csharp
// ❌ НЕПРАВИЛЬНО - N+1 запросов
var products = await _context.Products.ToListAsync();
foreach (var product in products)
{
    var category = await _context.Categories.FindAsync(product.CategoryId);
}

// ✅ ПРАВИЛЬНО - Eager Loading
var products = await _context.Products
    .Include(p => p.Category)
    .ToListAsync();
```

### 4. Отсутствие логирования

```csharp
// ❌ НЕПРАВИЛЬНО
public async Task<Product> CreateAsync(Product product)
{
    _context.Products.Add(product);
    await _context.SaveChangesAsync();
    return product;
}

// ✅ ПРАВИЛЬНО
public async Task<Product> CreateAsync(Product product)
{
    product.CreatedAt = DateTime.UtcNow;
    product.Id = Guid.NewGuid();
    
    _context.Products.Add(product);
    await _context.SaveChangesAsync();
    
    _logger.LogInformation("Created product {ProductId} with SKU {Sku}", 
        product.Id, product.Sku);
    
    return product;
}
```

---

## 🔗 Связанные паттерны

- **Unit of Work** — управление транзакциями
- **Specification Pattern** — инкапсуляция сложных запросов
- **CQRS** — разделение операций чтения и записи

---

## 📚 Дополнительные ресурсы

- [Microsoft: Repository Pattern](https://docs.microsoft.com/en-us/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/infrastructure-persistence-layer-design)
- [Martin Fowler: Repository](https://martinfowler.com/eaaCatalog/repository.html)

---

*Документ базы знаний GoldPC.*