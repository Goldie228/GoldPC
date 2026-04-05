using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Moq;
using PCBuilderService.Data;
using PCBuilderService.DTOs;
using PCBuilderService.Models;
using PCBuilderService.Services;
using Shared.Protos;
using Xunit;
using FluentAssertions;

namespace PCBuilderService.Tests;

/// <summary>
/// Модульные тесты для ConfigurationService.
/// Покрывает CRUD-операции, пагинацию, share-токены и проверку прав доступа:
/// 1. Создание конфигурации
/// 2. Получение существующей конфигурации
/// 3. Получение несуществующей конфигурации
/// 4. Удаление конфигурации владельца
/// 5. Удаление чужой конфигурации
/// 6. Пагинированный список конфигураций пользователя
/// 7. Генерация share-токена
/// </summary>
public class ConfigurationServiceTests
{
    #region Infrastructure

    private static PCBuilderDbContext CreateInMemoryContext()
    {
        var options = new DbContextOptionsBuilder<PCBuilderDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        return new PCBuilderDbContext(options);
    }

    private static ConfigurationService CreateService(
        PCBuilderDbContext? context = null,
        Mock<CatalogGrpc.CatalogGrpcClient>? catalogClient = null)
    {
        context ??= CreateInMemoryContext();
        var loggerMock = new Mock<ILogger<ConfigurationService>>();
        var mockCatalogClient = catalogClient ?? new Mock<CatalogGrpc.CatalogGrpcClient>();

        return new ConfigurationService(context, loggerMock.Object, mockCatalogClient.Object);
    }

    private static PCConfiguration CreateConfiguration(Guid? userId = null)
    {
        return new PCConfiguration
        {
            Id = Guid.NewGuid(),
            UserId = userId ?? Guid.NewGuid(),
            Name = "Test Build",
            Purpose = "gaming",
            ProcessorId = Guid.NewGuid(),
            MotherboardId = Guid.NewGuid(),
            RamId = Guid.NewGuid(),
            GpuId = Guid.NewGuid(),
            PsuId = null,
            StorageId = null,
            CaseId = null,
            CoolerId = null,
            TotalPrice = 0m,
            IsCompatible = true,
            ShareToken = null,
            CreatedAt = DateTime.UtcNow
        };
    }

    #endregion

    #region Create

    /// <summary>
    /// Test 1: Создание новой валидной конфигурации возвращает объект с заполненным ID и CreatedAt.
    /// </summary>
    [Fact]
    public async Task CreateConfigurationAsync_ValidBuild_ReturnsId()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var context = CreateInMemoryContext();
        var service = CreateService(context);

        var config = new PCConfiguration
        {
            UserId = userId,
            Name = "My Gaming PC",
            Purpose = "gaming",
            ProcessorId = Guid.NewGuid()
        };

        // Act
        var result = await service.SaveConfigurationAsync(config);

        // Assert
        result.Id.Should().NotBe(Guid.Empty, "new config should have an assigned ID");
        result.CreatedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(5),
            "CreatedAt should be set on creation");
        result.UserId.Should().Be(userId, "UserId should match");
        result.Name.Should().Be("My Gaming PC");
    }

    /// <summary>
    /// Обновление существующей конфигурации сохраняет тот же ID и обновляет UpdatedAt.
    /// </summary>
    [Fact]
    public async Task SaveConfigurationAsync_ExistingConfig_UpdatesIt()
    {
        // Arrange
        var context = CreateInMemoryContext();
        var service = CreateService(context);

        var original = CreateConfiguration();
        await context.PCConfigurations.AddAsync(original);
        await context.SaveChangesAsync();

        // Act
        original.Name = "Updated Name";
        var result = await service.SaveConfigurationAsync(original);

        // Assert
        result.Id.Should().Be(original.Id, "ID should remain the same");
        result.Name.Should().Be("Updated Name");
        result.UpdatedAt.Should().NotBeNull("UpdatedAt should be set on update");
    }

    #endregion

    #region Get Configuration

    /// <summary>
    /// Test 2: Получение существующей конфигурации возвращает объект.
    /// </summary>
    [Fact]
    public async Task GetConfigurationAsync_ExistingConfig_ReturnsConfig()
    {
        // Arrange
        var context = CreateInMemoryContext();
        var service = CreateService(context);

        var expected = CreateConfiguration();
        await context.PCConfigurations.AddAsync(expected);
        await context.SaveChangesAsync();

        // Act
        var result = await service.GetConfigurationAsync(expected.Id);

        // Assert
        result.Should().NotBeNull();
        result!.Id.Should().Be(expected.Id);
        result.Name.Should().Be("Test Build");
        result.Purpose.Should().Be("gaming");
    }

    /// <summary>
    /// Test 3: Получение несуществующей конфигурации возвращает null.
    /// </summary>
    [Fact]
    public async Task GetConfigurationAsync_Nonexistent_ReturnsNull()
    {
        // Arrange
        var context = CreateInMemoryContext();
        var service = CreateService(context);
        var nonExistentId = Guid.NewGuid();

        // Act
        var result = await service.GetConfigurationAsync(nonExistentId);

        // Assert
        result.Should().BeNull("configuration with non-existent ID should not be found");
    }

    #endregion

    #region Delete

    /// <summary>
    /// Test 4: Удаление существующей конфигурации — успешно.
    /// (Контроллер проверяет права UserId == currentUserId,
    ///  а сервис просто удаляет по ID — этот тест покрывает сервисный уровень.)
    /// </summary>
    [Fact]
    public async Task DeleteConfigurationAsync_Exists_ReturnsTrue()
    {
        // Arrange
        var context = CreateInMemoryContext();
        var service = CreateService(context);

        var config = CreateConfiguration();
        await context.PCConfigurations.AddAsync(config);
        await context.SaveChangesAsync();

        // Act
        var result = await service.DeleteConfigurationAsync(config.Id);

        // Assert
        result.Should().BeTrue("deleting an existing config should return true");
        var deleted = await context.PCConfigurations.FindAsync(config.Id);
        deleted.Should().BeNull("config should be removed from database");
    }

    /// <summary>
    /// Test 5: Удаление несуществующей конфигурации возвращает false.
    /// </summary>
    [Fact]
    public async Task DeleteConfigurationAsync_Nonexistent_ReturnsFalse()
    {
        // Arrange
        var context = CreateInMemoryContext();
        var service = CreateService(context);

        // Act
        var result = await service.DeleteConfigurationAsync(Guid.NewGuid());

        // Assert
        result.Should().BeFalse("deleting a non-existent config should return false");
    }

    #endregion

    #region GetUserConfigurations

    /// <summary>
    /// Test 6: GetUserConfigurationsAsync возвращает конфигурации пользователя,
    /// отсортированные по убыванию CreatedAt.
    /// </summary>
    [Fact]
    public async Task GetUserConfigurationsAsync_ReturnsConfigsForUser()
    {
        // Arrange
        var context = CreateInMemoryContext();
        var service = CreateService(context);

        var userA = Guid.NewGuid();
        var userB = Guid.NewGuid();

        var configA1 = CreateConfiguration(userA);
        configA1.Name = "UserA Config 1";
        configA1.CreatedAt = new DateTime(2025, 1, 1);

        var configA2 = CreateConfiguration(userA);
        configA2.Name = "UserA Config 2";
        configA2.CreatedAt = new DateTime(2025, 6, 1);

        var configB1 = CreateConfiguration(userB);
        configB1.Name = "UserB Config 1";

        await context.PCConfigurations.AddRangeAsync(configA1, configA2, configB1);
        await context.SaveChangesAsync();

        // Act
        var results = await service.GetUserConfigurationsAsync(userA);
        var list = results.ToList();

        // Assert
        list.Should().HaveCount(2, "user A should have exactly 2 configurations");
        list.Should().NotContain(c => c.Name == "UserB Config 1",
            "user A should not see user B's configs");
        list[0].Name.Should().Be("UserA Config 2", "configs should be sorted by CreatedAt descending");
        list[1].Name.Should().Be("UserA Config 1");
    }

    /// <summary>
    /// GetUserConfigurationsAsync возвращает пустой список для пользователя без конфигураций.
    /// </summary>
    [Fact]
    public async Task GetUserConfigurationsAsync_NoConfigs_ReturnsEmptyList()
    {
        // Arrange
        var context = CreateInMemoryContext();
        var service = CreateService(context);

        // Act
        var results = await service.GetUserConfigurationsAsync(Guid.NewGuid());

        // Assert
        results.Should().BeEmpty();
    }

    #endregion

    #region Share Token

    /// <summary>
    /// Test 7: GenerateShareTokenAsync создаёт токен для валидной конфигурации владельца.
    /// </summary>
    [Fact]
    public async Task GenerateShareTokenAsync_CreatesToken_ReturnsNonNull()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var context = CreateInMemoryContext();
        var service = CreateService(context);

        var config = CreateConfiguration(userId);
        await context.PCConfigurations.AddAsync(config);
        await context.SaveChangesAsync();

        // Act
        var token = await service.GenerateShareTokenAsync(config.Id, userId);

        // Assert
        token.Should().NotBeNull("share token should be generated");
        token.Should().NotBeEmpty();
        token.Should().NotBe(" ", "share token should not be whitespace");
    }

    /// <summary>
    /// GenerateShareTokenAsync возвращает null для несуществующей конфигурации.
    /// </summary>
    [Fact]
    public async Task GenerateShareTokenAsync_NonexistentConfig_ReturnsNull()
    {
        // Arrange
        var context = CreateInMemoryContext();
        var service = CreateService(context);

        // Act
        var token = await service.GenerateShareTokenAsync(Guid.NewGuid(), Guid.NewGuid());

        // Assert
        token.Should().BeNull("non-existent config should yield null token");
    }

    /// <summary>
    /// GenerateShareTokenAsync возвращает null если пользователь не владелец.
    /// </summary>
    [Fact]
    public async Task GenerateShareTokenAsync_OtherUser_ReturnsNull()
    {
        // Arrange
        var ownerId = Guid.NewGuid();
        var otherId = Guid.NewGuid();
        var context = CreateInMemoryContext();
        var service = CreateService(context);

        var config = CreateConfiguration(ownerId);
        await context.PCConfigurations.AddAsync(config);
        await context.SaveChangesAsync();

        // Act
        var token = await service.GenerateShareTokenAsync(config.Id, otherId);

        // Assert
        token.Should().BeNull("other user should not be able to generate share token");
    }

    /// <summary>
    /// GenerateShareTokenAsync возвращает один и тот же токен при повторном вызове.
    /// </summary>
    [Fact]
    public async Task GenerateShareTokenAsync_Idempotent_ReturnsSameToken()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var context = CreateInMemoryContext();
        var service = CreateService(context);

        var config = CreateConfiguration(userId);
        await context.PCConfigurations.AddAsync(config);
        await context.SaveChangesAsync();

        // Act
        var token1 = await service.GenerateShareTokenAsync(config.Id, userId);
        var token2 = await service.GenerateShareTokenAsync(config.Id, userId);

        // Assert
        token1.Should().Be(token2, "subsequent calls should return the same token");
    }

    /// <summary>
    /// GetConfigurationByShareTokenAsync возвращает конфигурацию по токену.
    /// </summary>
    [Fact]
    public async Task GetConfigurationByShareTokenAsync_ValidToken_ReturnsConfig()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var context = CreateInMemoryContext();
        var service = CreateService(context);

        var config = CreateConfiguration(userId);
        await context.PCConfigurations.AddAsync(config);
        await context.SaveChangesAsync();

        var token = await service.GenerateShareTokenAsync(config.Id, userId);

        // Act
        var result = await service.GetConfigurationByShareTokenAsync(token!);

        // Assert
        result.Should().NotBeNull();
        result!.Id.Should().Be(config.Id);
    }

    /// <summary>
    /// GetConfigurationByShareTokenAsync возвращает null для пустого токена.
    /// </summary>
    [Fact]
    public async Task GetConfigurationByShareTokenAsync_EmptToken_ReturnsNull()
    {
        // Arrange
        var context = CreateInMemoryContext();
        var service = CreateService(context);

        // Act
        var result = await service.GetConfigurationByShareTokenAsync(string.Empty);

        // Assert
        result.Should().BeNull("empty token should return null");
    }

    #endregion
}
