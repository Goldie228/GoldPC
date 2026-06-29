using System;
using System.Collections.Generic;
using PactNet;
using PactNet.Infrastructure.Outputters;
using Xunit;
using Xunit.Abstractions;

namespace GoldPC.ContractTests.Providers;

/// <summary>
/// Контрактные тесты провайдера Catalog API
/// Проверяют соответствие API контракту с потребителем (Frontend)
/// </summary>
public class CatalogApiProviderTests : IClassFixture<CatalogApiFixture>
{
    private readonly CatalogApiFixture _fixture;
    private readonly ITestOutputHelper _output;

    public CatalogApiProviderTests(CatalogApiFixture fixture, ITestOutputHelper output)
    {
        _fixture = fixture;
        _output = output;
    }

    [Fact]
    public void VerifyPactWithFrontend_ShouldSucceed()
    {
        // Arrange
        var config = new PactVerifierConfig
        {
            Outputters = new List<IOutput>
            {
                new XunitOutput(_output)
            },
            LogLevel = PactLogLevel.Information
        };

        // Act & Assert
        using var verifier = new PactVerifier(config);
        
        verifier
            .ServiceProvider("GoldPC-Catalog-API", _fixture.ServerUri)
            .HonoursPactWith("GoldPC-Frontend")
            .PactUri("../../../../../contracts/pacts/frontend-catalog.json") // Adjust based on output folder
            .Verify();
    }
}

public class XunitOutput : IOutput
{
    private readonly ITestOutputHelper _output;

    public XunitOutput(ITestOutputHelper output)
    {
        _output = output;
    }

    public void WriteLine(string line)
    {
        _output.WriteLine(line);
    }
}
