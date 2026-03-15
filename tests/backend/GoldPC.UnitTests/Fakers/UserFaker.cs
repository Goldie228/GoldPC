using Bogus;
using GoldPC.SharedKernel.Entities;
using GoldPC.SharedKernel.Enums;

namespace GoldPC.UnitTests.Fakers;

/// <summary>
/// Refresh токен (тестовая модель)
/// </summary>
public class RefreshToken
{
    public Guid Id { get; set; }
    public string Token { get; set; } = string.Empty;
    public DateTime ExpiresAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? RevokedAt { get; set; }
    public bool IsRevoked => RevokedAt != null;
    public bool IsExpired => DateTime.UtcNow >= ExpiresAt;
    public bool IsActive => !IsRevoked && !IsExpired;
}

/// <summary>
/// Пользователь системы (тестовая модель)
/// </summary>
public class User : BaseEntity
{
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public UserRole Role { get; set; } = UserRole.Client;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
    public int FailedLoginAttempts { get; set; }
    public DateTime? LockedUntil { get; set; }
    public ICollection<RefreshToken> RefreshTokens { get; set; } = new List<RefreshToken>();
    
    public string FullName => $"{FirstName} {LastName}";
    public bool IsLocked => LockedUntil != null && LockedUntil > DateTime.UtcNow;
}

/// <summary>
/// Faker для генерации тестовых данных пользователя
/// </summary>
public class UserFaker : Faker<User>
{
    public UserFaker()
    {
        RuleFor(u => u.Id, f => f.Random.Guid());
        RuleFor(u => u.Email, f => f.Internet.Email());
        RuleFor(u => u.PasswordHash, f => BCryptHash(f.Internet.Password(12)));
        RuleFor(u => u.FirstName, f => f.Name.FirstName());
        RuleFor(u => u.LastName, f => f.Name.LastName());
        RuleFor(u => u.Phone, f => $"+375{f.Random.Int(29, 44)}{f.Random.Int(1000000, 9999999)}");
        RuleFor(u => u.Role, f => f.PickRandom<UserRole>());
        RuleFor(u => u.IsActive, f => f.Random.Bool(0.95f));
        RuleFor(u => u.FailedLoginAttempts, f => f.Random.Int(0, 3));
        RuleFor(u => u.LockedUntil, (f, u) => u.FailedLoginAttempts >= 5 ? f.Date.Future(1) : null);
        RuleFor(u => u.CreatedAt, f => f.Date.Past(2));
        RuleFor(u => u.UpdatedAt, f => f.Date.Recent(30));
        RuleFor(u => u.RefreshTokens, _ => new List<RefreshToken>());
    }

    private static string BCryptHash(string password)
    {
        return $"$2a$11${new string('x', 53)}";
    }

    #region Fluent Builder Methods

    public UserFaker AsClient()
    {
        RuleFor(u => u.Role, UserRole.Client);
        return this;
    }

    public UserFaker AsManager()
    {
        RuleFor(u => u.Role, UserRole.Manager);
        return this;
    }

    public UserFaker AsMaster()
    {
        RuleFor(u => u.Role, UserRole.Master);
        return this;
    }

    public UserFaker AsAdmin()
    {
        RuleFor(u => u.Role, UserRole.Admin);
        return this;
    }

    public UserFaker AsAccountant()
    {
        RuleFor(u => u.Role, UserRole.Accountant);
        return this;
    }

    public UserFaker AsInactive()
    {
        RuleFor(u => u.IsActive, false);
        return this;
    }

    public UserFaker AsLocked()
    {
        RuleFor(u => u.FailedLoginAttempts, 5);
        RuleFor(u => u.LockedUntil, f => f.Date.Future(1));
        return this;
    }

    public UserFaker WithEmail(string email)
    {
        RuleFor(u => u.Email, email);
        return this;
    }

    public UserFaker WithPhone(string phone)
    {
        RuleFor(u => u.Phone, phone);
        return this;
    }

    public UserFaker WithFullName(string firstName, string lastName)
    {
        RuleFor(u => u.FirstName, firstName);
        RuleFor(u => u.LastName, lastName);
        return this;
    }

    public UserFaker WithRefreshTokens(int count)
    {
        RuleFor(u => u.RefreshTokens, f => GenerateRefreshTokens(f, count));
        return this;
    }

    private static List<RefreshToken> GenerateRefreshTokens(Faker f, int count)
    {
        var tokens = new List<RefreshToken>();
        for (int i = 0; i < count; i++)
        {
            tokens.Add(new RefreshToken
            {
                Id = f.Random.Guid(),
                Token = f.Random.Guid().ToString("N"),
                ExpiresAt = f.Date.Future(1),
                CreatedAt = f.Date.Past(1),
                RevokedAt = i == 0 ? null : f.Date.Recent(30)
            });
        }
        return tokens;
    }

    public UserFaker AsNewUser()
    {
        RuleFor(u => u.CreatedAt, f => f.Date.Recent(7));
        RuleFor(u => u.Role, UserRole.Client);
        return this;
    }

    public UserFaker AsLongTermUser()
    {
        RuleFor(u => u.CreatedAt, f => f.Date.Past(5));
        return this;
    }

    #endregion
}

/// <summary>
/// Расширения для UserFaker
/// </summary>
public static class UserFakerExtensions
{
    public static List<User> GenerateWithAllRoles(this UserFaker faker)
    {
        return new List<User>
        {
            new UserFaker().AsClient().Generate(),
            new UserFaker().AsManager().Generate(),
            new UserFaker().AsMaster().Generate(),
            new UserFaker().AsAdmin().Generate(),
            new UserFaker().AsAccountant().Generate()
        };
    }

    public static List<User> GenerateUniqueEmails(this UserFaker faker, int count)
    {
        var usedEmails = new HashSet<string>();
        var users = new List<User>();

        for (int i = 0; i < count; i++)
        {
            var user = faker.Generate();
            while (usedEmails.Contains(user.Email))
            {
                user = faker.Generate();
            }
            usedEmails.Add(user.Email);
            users.Add(user);
        }

        return users;
    }
}