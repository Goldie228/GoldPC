using PactNet;
using PactNet.Infrastructure.Outputters;
using PactNet.Verifier;
using Xunit;
using FluentAssertions;

namespace GoldPC.ContractTests;

/// <summary>
/// Контрактные тесты провайдера Catalog API
/// 
/// Проверяют соответствие API контракту с потребителем (Frontend).
/// Используют Pact Net для верификации контрактов.
/// 
/// Provider: GoldPC-Catalog-API
/// Consumer: GoldPC-Frontend
/// </summary>
public class CatalogProviderTests : IClassFixture<CatalogApiProviderFixture>
{
    private readonly CatalogApiProviderFixture _fixture;

    public CatalogProviderTests(CatalogApiProviderFixture fixture)
    {
        _fixture = fixture;
    }

    /// <summary>
    /// Верификация контракта с Frontend потребителем
    /// Проверяет, что Catalog API соответствует ожиданиям фронтенда
    /// </summary>
    [Fact]
    public void VerifyPactWithFrontend_ShouldSucceed()
    {
        // Arrange - настройка конфигурации верификатора
        var config = new PactVerifierConfig
        {
            Outputters = new List<IOutput>
            {
                new ConsoleOutput()
            },
            LogLevel = PactLogLevel.Information
        };

        // Act & Assert - верификация контракта
        using var verifier = new PactVerifier(config);

        verifier
            .ServiceProvider("GoldPC-Catalog-API", _fixture.ServerUri)
            .HonoursPactWith("GoldPC-Frontend")
            .PactUri(_fixture.PactFilePath)
            .Verify();

        // Если верификация прошла без исключений - тест успешен
    }

    /// <summary>
    /// Верификация контракта через Pact Broker (для CI/CD)
    /// </summary>
    [Fact(Skip = "Requires Pact Broker connection - enable in CI environment")]
    public void VerifyPactWithFrontend_FromBroker_ShouldSucceed()
    {
        // Arrange
        var brokerBaseUrl = Environment.GetEnvironmentVariable("PACT_BROKER_URL")
            ?? "http://localhost:9292";

        var config = new PactVerifierConfig
        {
            Outputters = new List<IOutput>
            {
                new ConsoleOutput()
            },
            LogLevel = PactLogLevel.Information,
            PublishResults = true
        };

        // Act & Assert
        using var verifier = new PactVerifier(config);

        verifier
            .ServiceProvider("GoldPC-Catalog-API", _fixture.ServerUri)
            .HonoursPactWith("GoldPC-Frontend")
            .PactUri($"{brokerBaseUrl}/pacts/provider/GoldPC-Catalog-API/consumer/GoldPC-Frontend/latest")
            .Verify();
    }
}

/// <summary>
/// Fixture для настройки тестового окружения провайдера
/// Предоставляет тестовый сервер и путь к файлу контракта
/// </summary>
public class CatalogApiProviderFixture : IDisposable
{
    /// <summary>
    /// URI тестового сервера API
    /// </summary>
    public Uri ServerUri { get; }

    /// <summary>
    /// Путь к файлу контракта
    /// </summary>
    public string PactFilePath { get; }

    /// <summary>
    /// Версия провайдера для публикации результатов
    /// </summary>
    public string ProviderVersion { get; }

    public CatalogApiProviderFixture()
    {
        // Настройка URI тестового сервера
        ServerUri = new Uri("http://localhost:5001");

        // Путь к контракту (локальный файл)
        // При интеграции с Pact Broker путь будет указывать на Broker URL
        var projectRoot = Directory.GetCurrentDirectory();
        while (projectRoot != null && !Directory.Exists(Path.Combine(projectRoot, "contracts")))
        {
            projectRoot = Directory.GetParent(projectRoot)?.FullName;
        }

        PactFilePath = projectRoot != null
            ? Path.Combine(projectRoot, "contracts", "pacts", "frontend-catalog.json")
            : "./pacts/frontend-catalog.json";

        // Версия провайдера из переменной окружения или по умолчанию
        ProviderVersion = Environment.GetEnvironmentVariable("PROVIDER_VERSION") ?? "1.0.0";
    }

    public void Dispose()
    {
        // Очистка ресурсов при необходимости
        GC.SuppressFinalize(this);
    }
}

/// <summary>
/// Вспомогательный класс для вывода логов в консоль
/// </summary>
public class ConsoleOutput : IOutput
{
    public void WriteLine(string line)
    {
        Console.WriteLine(line);
    }
}