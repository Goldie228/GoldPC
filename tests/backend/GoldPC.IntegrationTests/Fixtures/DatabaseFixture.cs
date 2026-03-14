using Testcontainers.PostgreSql;
using Testcontainers.Redis;
using Xunit;

namespace GoldPC.IntegrationTests.Fixtures;

/// <summary>
/// Fixture для интеграционных тестов с реальной PostgreSQL базой данных в Docker контейнере
/// </summary>
public class DatabaseFixture : IAsyncLifetime
{
    private readonly PostgreSqlContainer _postgresContainer;
    private readonly RedisContainer _redisContainer;

    public string ConnectionString { get; private set; } = string.Empty;
    public string RedisConnectionString { get; private set; } = string.Empty;

    public DatabaseFixture()
    {
        _postgresContainer = new PostgreSqlBuilder()
            .WithImage("postgres:16-alpine")
            .WithDatabase("goldpc_test")
            .WithUsername("test")
            .WithPassword("test")
            .WithCleanUp(true)
            .Build();

        _redisContainer = new RedisBuilder()
            .WithImage("redis:7-alpine")
            .WithCleanUp(true)
            .Build();
    }

    public async Task InitializeAsync()
    {
        await _postgresContainer.StartAsync();
        await _redisContainer.StartAsync();

        ConnectionString = _postgresContainer.GetConnectionString();
        RedisConnectionString = _redisContainer.GetConnectionString();
    }

    public async Task DisposeAsync()
    {
        await _postgresContainer.DisposeAsync();
        await _redisContainer.DisposeAsync();
    }
}

/// <summary>
/// Fixture для WebApplicationFactory с тестовой БД
/// </summary>
public class ApiFixture : IClassFixture<DatabaseFixture>, IAsyncLifetime
{
    private readonly DatabaseFixture _dbFixture;
    private HttpClient? _client;

    public HttpClient Client => _client ?? throw new InvalidOperationException("Client not initialized");

    public ApiFixture(DatabaseFixture dbFixture)
    {
        _dbFixture = dbFixture;
    }

    public async Task InitializeAsync()
    {
        // В реальном проекте здесь настраивается WebApplicationFactory
        // _factory = new WebApplicationFactory<Program>()
        //     .WithWebHostBuilder(builder =>
        //     {
        //         builder.ConfigureServices(services =>
        //         {
        //             services.AddDbContext<ApplicationDbContext>(options =>
        //                 options.UseNpgsql(_dbFixture.ConnectionString));
        //         });
        //     });
        // 
        // _client = _factory.CreateClient();

        await Task.CompletedTask;
    }

    public async Task DisposeAsync()
    {
        // _factory?.Dispose();
        await Task.CompletedTask;
    }
}