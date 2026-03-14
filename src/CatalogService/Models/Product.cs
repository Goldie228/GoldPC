namespace CatalogService.Models;

/// <summary>
/// Товар в каталоге
/// </summary>
public class Product
{
    public Guid Id { get; set; }
    
    /// <summary>Название товара</summary>
    public string Name { get; set; } = string.Empty;
    
    /// <summary>Артикул (SKU)</summary>
    public string Sku { get; set; } = string.Empty;
    
    /// <summary>Описание товара</summary>
    public string? Description { get; set; }
    
    /// <summary>ID категории</summary>
    public Guid CategoryId { get; set; }
    
    /// <summary>Категория товара</summary>
    public Category Category { get; set; } = null!;
    
    /// <summary>ID производителя</summary>
    public Guid ManufacturerId { get; set; }
    
    /// <summary>Производитель</summary>
    public Manufacturer Manufacturer { get; set; } = null!;
    
    /// <summary>Цена в BYN</summary>
    public decimal Price { get; set; }
    
    /// <summary>Остаток на складе</summary>
    public int Stock { get; set; }
    
    /// <summary>Технические характеристики (JSON)</summary>
    public Dictionary<string, object> Specifications { get; set; } = new();
    
    /// <summary>Гарантийный срок в месяцах</summary>
    public int WarrantyMonths { get; set; } = 12;
    
    /// <summary>Рейтинг товара (0-5)</summary>
    public double Rating { get; set; }
    
    /// <summary>Количество отзывов</summary>
    public int ReviewCount { get; set; }
    
    /// <summary>Признак активности</summary>
    public bool IsActive { get; set; } = true;
    
    /// <summary>Дата создания</summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    /// <summary>Дата обновления</summary>
    public DateTime? UpdatedAt { get; set; }
    
    /// <summary>Изображения товара</summary>
    public ICollection<ProductImage> Images { get; set; } = new List<ProductImage>();
    
    /// <summary>Отзывы</summary>
    public ICollection<Review> Reviews { get; set; } = new List<Review>();
}

/// <summary>
/// Категория товара
/// </summary>
public class Category
{
    public Guid Id { get; set; }
    
    /// <summary>Название категории</summary>
    public string Name { get; set; } = string.Empty;
    
    /// <summary>URL-slug</summary>
    public string Slug { get; set; } = string.Empty;
    
    /// <summary>Описание</summary>
    public string? Description { get; set; }
    
    /// <summary>ID родительской категории</summary>
    public Guid? ParentId { get; set; }
    
    /// <summary>Родительская категория</summary>
    public Category? Parent { get; set; }
    
    /// <summary>Подкатегории</summary>
    public ICollection<Category> Children { get; set; } = new List<Category>();
    
    /// <summary>Тип компонента для конструктора ПК</summary>
    public ComponentType? ComponentType { get; set; }
    
    /// <summary>Товары категории</summary>
    public ICollection<Product> Products { get; set; } = new List<Product>();
}

/// <summary>
/// Тип компонента для совместимости в конструкторе ПК
/// </summary>
public enum ComponentType
{
    Processor = 1,      // Процессор
    Motherboard = 2,    // Материнская плата
    Ram = 3,           // Оперативная память
    Gpu = 4,           // Видеокарта
    Psu = 5,           // Блок питания
    Storage = 6,       // Накопитель (SSD/HDD)
    Case = 7,          // Корпус
    Cooler = 8,        // Охлаждение
    Periphery = 9      // Периферия
}

/// <summary>
/// Производитель
/// </summary>
public class Manufacturer
{
    public Guid Id { get; set; }
    
    /// <summary>Название производителя</summary>
    public string Name { get; set; } = string.Empty;
    
    /// <summary>Страна</summary>
    public string? Country { get; set; }
    
    /// <summary>Логотип (URL)</summary>
    public string? LogoUrl { get; set; }
    
    /// <summary>Описание</summary>
    public string? Description { get; set; }
    
    /// <summary>Товары производителя</summary>
    public ICollection<Product> Products { get; set; } = new List<Product>();
}

/// <summary>
/// Изображение товара
/// </summary>
public class ProductImage
{
    public Guid Id { get; set; }
    
    public Guid ProductId { get; set; }
    
    /// <summary>URL изображения</summary>
    public string Url { get; set; } = string.Empty;
    
    /// <summary>Альтернативный текст</summary>
    public string? AltText { get; set; }
    
    /// <summary>Является основным изображением</summary>
    public bool IsPrimary { get; set; }
    
    /// <summary>Порядок сортировки</summary>
    public int SortOrder { get; set; }
}

/// <summary>
/// Отзыв на товар
/// </summary>
public class Review
{
    public Guid Id { get; set; }
    
    public Guid ProductId { get; set; }
    public Product Product { get; set; } = null!;
    
    /// <summary>ID пользователя (из Auth сервиса)</summary>
    public Guid UserId { get; set; }
    
    /// <summary>Имя пользователя</summary>
    public string UserName { get; set; } = string.Empty;
    
    /// <summary>Оценка (1-5)</summary>
    public int Rating { get; set; }
    
    /// <summary>Текст отзыва</summary>
    public string? Comment { get; set; }
    
    /// <summary>Плюсы</summary>
    public string? Pros { get; set; }
    
    /// <summary>Минусы</summary>
    public string? Cons { get; set; }
    
    /// <summary>Дата создания</summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    /// <summary>Проверен модератором</summary>
    public bool IsVerified { get; set; }
}