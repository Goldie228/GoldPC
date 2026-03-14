using Bogus;

namespace GoldPC.UnitTests.Fakers;

/// <summary>
/// Faker для генерации тестовых данных пользователя
/// </summary>
public class UserFaker : Faker<User>
{
    public UserFaker()
    {
        RuleFor(u => u.Id, f => f.Random.Guid());
        RuleFor(u => u.Email, f => f.Internet.Email());
        RuleFor(u => u.FirstName, f => f.Name.FirstName());
        RuleFor(u => u.LastName, f => f.Name.LastName());
        RuleFor(u => u.Phone, f => $"+375{f.Random.Int(29, 44)}{f.Random.Int(1000000, 9999999)}");
        RuleFor(u => u.Role, f => f.PickRandom<UserRole>());
        RuleFor(u => u.IsActive, f => f.Random.Bool(0.95f));
        RuleFor(u => u.EmailConfirmed, f => f.Random.Bool(0.8f));
        RuleFor(u => u.CreatedAt, f => f.Date.Past(2));
        RuleFor(u => u.LastLoginAt, f => f.Date.Recent(30));
    }

    /// <summary>
    /// Создать клиента
    /// </summary>
    public UserFaker AsClient()
    {
        RuleFor(u => u.Role, UserRole.Client);
        return this;
    }

    /// <summary>
    /// Создать менеджера
    /// </summary>
    public UserFaker AsManager()
    {
        RuleFor(u => u.Role, UserRole.Manager);
        return this;
    }

    /// <summary>
    /// Создать мастера сервисного центра
    /// </summary>
    public UserFaker AsMaster()
    {
        RuleFor(u => u.Role, UserRole.Master);
        return this;
    }

    /// <summary>
    /// Создать администратора
    /// </summary>
    public UserFaker AsAdmin()
    {
        RuleFor(u => u.Role, UserRole.Admin);
        return this;
    }

    /// <summary>
    /// Создать бухгалтера
    /// </summary>
    public UserFaker AsAccountant()
    {
        RuleFor(u => u.Role, UserRole.Accountant);
        return this;
    }

    /// <summary>
    /// Создать неактивного пользователя
    /// </summary>
    public UserFaker AsInactive()
    {
        RuleFor(u => u.IsActive, false);
        return this;
    }

    /// <summary>
    /// Создать пользователя с подтверждённым email
    /// </summary>
    public UserFaker WithConfirmedEmail()
    {
        RuleFor(u => u.EmailConfirmed, true);
        return this;
    }
}

/// <summary>
/// Тестовая модель пользователя
/// </summary>
public class User
{
    public Guid Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public UserRole Role { get; set; }
    public bool IsActive { get; set; }
    public bool EmailConfirmed { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? LastLoginAt { get; set; }
    
    public string FullName => $"{FirstName} {LastName}";
}

public enum UserRole
{
    Client,
    Manager,
    Master,
    Admin,
    Accountant
}