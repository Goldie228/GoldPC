using GoldPC.AuthService.Entities;
using GoldPC.SharedKernel.Enums;
using Microsoft.EntityFrameworkCore;

namespace GoldPC.AuthService.Data;

/// <summary>
/// Контекст базы данных для сервиса аутентификации
/// </summary>
public class AuthDbContext : DbContext
{
    public AuthDbContext(DbContextOptions<AuthDbContext> options) : base(options)
    {
    }

    /// <summary>
    /// Пользователи
    /// </summary>
    public DbSet<User> Users => Set<User>();

    /// <summary>
    /// Refresh токены
    /// </summary>
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();

    /// <summary>
    /// Избранные товары пользователей.
    /// </summary>
    public DbSet<WishlistItem> WishlistItems => Set<WishlistItem>();

    /// <summary>
    /// Адреса доставки пользователей
    /// </summary>
    public DbSet<UserAddress> UserAddresses => Set<UserAddress>();

    /// <summary>
    /// Токены сброса пароля
    /// </summary>
    public DbSet<PasswordResetToken> PasswordResetTokens => Set<PasswordResetToken>();

    /// <summary>
    /// Токены подтверждения email
    /// </summary>
    public DbSet<EmailVerificationToken> EmailVerificationTokens => Set<EmailVerificationToken>();

    /// <summary>
    /// История входов пользователей
    /// </summary>
    public DbSet<LoginHistory> LoginHistories => Set<LoginHistory>();

    /// <summary>
    /// Предпочтения уведомлений пользователей
    /// </summary>
    public DbSet<NotificationPreference> NotificationPreferences => Set<NotificationPreference>();

    /// <summary>
    /// Настройки двухфакторной аутентификации пользователей
    /// </summary>
    public DbSet<UserTwoFactor> UserTwoFactors => Set<UserTwoFactor>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Конфигурация User
        modelBuilder.Entity<User>(entity =>
        {
            entity.ToTable("users");
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.Email).IsUnique();
            entity.Property(e => e.Email).IsRequired().HasMaxLength(256);
            entity.Property(e => e.PasswordHash).IsRequired().HasMaxLength(500);
            entity.Property(e => e.FirstName).IsRequired().HasMaxLength(50);
            entity.Property(e => e.LastName).IsRequired().HasMaxLength(50);
            entity.Property(e => e.Phone).IsRequired().HasMaxLength(20);
            entity.Property(e => e.Role).HasConversion<string>().HasMaxLength(20);
            entity.Ignore(e => e.Roles);
            entity.Property(e => e.BirthDate).HasColumnType("timestamp with time zone");
            entity.Property(e => e.Company).HasMaxLength(200);
            entity.Property(e => e.CreatedAt).IsRequired();
        });

        // Конфигурация RefreshToken
        modelBuilder.Entity<RefreshToken>(entity =>
        {
            entity.ToTable("refresh_tokens");
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.Token).IsUnique();
            entity.HasIndex(e => e.ExpiresAt);
            entity.Property(e => e.Token).IsRequired().HasMaxLength(500);
            entity.Property(e => e.CreatedAt).IsRequired();
            entity.Property(e => e.ExpiresAt).IsRequired();

            entity.HasOne(e => e.User)
                .WithMany(u => u.RefreshTokens)
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // Конфигурация WishlistItem
        modelBuilder.Entity<WishlistItem>(entity =>
        {
            entity.ToTable("wishlist_items");
            entity.HasKey(e => e.Id);

            entity.Property(e => e.ProductId).IsRequired();
            entity.Property(e => e.CreatedAt).IsRequired();

            entity.HasIndex(e => new { e.UserId, e.ProductId }).IsUnique();

            entity.HasOne(e => e.User)
                .WithMany(u => u.WishlistItems)
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // Конфигурация UserAddress
        modelBuilder.Entity<UserAddress>(entity =>
        {
            entity.ToTable("user_addresses");
            entity.HasKey(e => e.Id);

            entity.Property(e => e.Name).IsRequired().HasMaxLength(100);
            entity.Property(e => e.City).IsRequired().HasMaxLength(100);
            entity.Property(e => e.Address).IsRequired().HasMaxLength(500);
            entity.Property(e => e.Apartment).HasMaxLength(50);
            entity.Property(e => e.PostalCode).HasMaxLength(20);
            entity.Property(e => e.IsDefault).IsRequired();

            entity.HasOne(e => e.User)
                .WithMany(u => u.Addresses)
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // Конфигурация PasswordResetToken
        modelBuilder.Entity<PasswordResetToken>(entity =>
        {
            entity.ToTable("password_reset_tokens");
            entity.HasKey(e => e.Id);

            entity.Property(e => e.TokenHash).IsRequired().HasMaxLength(128);
            entity.Property(e => e.CreatedAt).IsRequired();
            entity.Property(e => e.ExpiresAt).IsRequired();
            entity.Property(e => e.UsedByIp).HasMaxLength(45);

            entity.HasIndex(e => e.TokenHash).IsUnique();
            entity.HasIndex(e => e.UserId);

            entity.HasOne(e => e.User)
                .WithMany(u => u.PasswordResetTokens)
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // Конфигурация EmailVerificationToken
        modelBuilder.Entity<EmailVerificationToken>(entity =>
        {
            entity.ToTable("email_verification_tokens");
            entity.HasKey(e => e.Id);

            entity.Property(e => e.TokenHash).IsRequired().HasMaxLength(128);
            entity.Property(e => e.CreatedAt).IsRequired();
            entity.Property(e => e.ExpiresAt).IsRequired();
            entity.Property(e => e.UsedByIp).HasMaxLength(45);

            entity.HasIndex(e => e.TokenHash).IsUnique();
            entity.HasIndex(e => e.UserId);

            entity.HasOne(e => e.User)
                .WithMany(u => u.EmailVerificationTokens)
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // Конфигурация LoginHistory
        modelBuilder.Entity<LoginHistory>(entity =>
        {
            entity.ToTable("login_history");
            entity.HasKey(e => e.Id);

            entity.Property(e => e.IpAddress).IsRequired().HasMaxLength(45);
            entity.Property(e => e.UserAgent).HasMaxLength(512);
            entity.Property(e => e.Timestamp).IsRequired();
            entity.Property(e => e.Success).IsRequired();
            entity.Property(e => e.FailureReason).HasMaxLength(500);

            entity.HasIndex(e => e.UserId);

            entity.HasOne(e => e.User)
                .WithMany()
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // Конфигурация NotificationPreference
        modelBuilder.Entity<NotificationPreference>(entity =>
        {
            entity.ToTable("notification_preferences");
            entity.HasKey(e => e.Id);

            entity.Property(e => e.EmailNotifications).IsRequired();
            entity.Property(e => e.SmsNotifications).IsRequired();
            entity.Property(e => e.TelegramNotifications).IsRequired();
            entity.Property(e => e.OrderStatusNotifications).IsRequired();
            entity.Property(e => e.MarketingNotifications).IsRequired();
            entity.Property(e => e.UpdatedAt).IsRequired();

            entity.HasIndex(e => e.UserId).IsUnique();

            entity.HasOne(e => e.User)
                .WithOne()
                .HasForeignKey<NotificationPreference>(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // Конфигурация UserTwoFactor
        modelBuilder.Entity<UserTwoFactor>(entity =>
        {
            entity.ToTable("user_two_factors");
            entity.HasKey(e => e.Id);

            entity.Property(e => e.TOTPSecret).HasMaxLength(256);
            entity.Property(e => e.IsEnabled).IsRequired();
            entity.Property(e => e.RecoveryCodes).HasMaxLength(2048);
            entity.Property(e => e.CreatedAt).IsRequired();

            entity.HasIndex(e => e.UserId).IsUnique();

            entity.HasOne(e => e.User)
                .WithOne()
                .HasForeignKey<UserTwoFactor>(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }
}