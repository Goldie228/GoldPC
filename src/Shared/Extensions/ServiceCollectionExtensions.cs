using GoldPC.Shared.Services;
using GoldPC.Shared.Services.Interfaces;
using Microsoft.Extensions.DependencyInjection;

namespace GoldPC.Shared.Extensions;

/// <summary>
/// Методы расширения для регистрации сервисов Shared
/// </summary>
public static class ServiceCollectionExtensions
{
    /// <summary>
    /// Добавить сервис уведомлений об изменении контрактов
    /// </summary>
    /// <param name="services">Коллекция сервисов</param>
    /// <returns>Коллекция сервисов</returns>
    public static IServiceCollection AddContractChangeNotifier(this IServiceCollection services)
    {
        services.AddSingleton<IContractChangeNotifier, ContractChangeNotifier>();
        return services;
    }
    
    /// <summary>
    /// Добавить все shared сервисы
    /// </summary>
    /// <param name="services">Коллекция сервисов</param>
    /// <returns>Коллекция сервисов</returns>
    public static IServiceCollection AddSharedServices(this IServiceCollection services)
    {
        services.AddContractChangeNotifier();
        return services;
    }
}