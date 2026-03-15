using System.Reflection;
using FluentAssertions;
using NetArchTest.Rules;
using Xunit;

namespace GoldPC.ArchitectureTests;

/// <summary>
/// Архитектурные тесты для обеспечения чистой архитектуры проекта GoldPC
/// Используют NetArchTest.Rules для проверки зависимостей и структуры кода
/// </summary>
public class ArchitectureTests
{
    // Загрузка всех сборок проекта для анализа
    private static readonly Assembly[] Assemblies = LoadAssemblies();

    private static Assembly[] LoadAssemblies()
    {
        var assemblies = new List<Assembly>();
        
        // Загружаем сборки по имени
        var assemblyNames = new[]
        {
            "AuthService",
            "CatalogService", 
            "OrdersService",
            "ServicesService",
            "WarrantyService",
            "PCBuilderService",
            "SharedKernel",
            "Shared"
        };

        foreach (var name in assemblyNames)
        {
            try
            {
                var assembly = Assembly.Load(name);
                assemblies.Add(assembly);
            }
            catch (FileNotFoundException)
            {
                // Сборка не найдена - пропускаем
            }
        }

        return assemblies.ToArray();
    }

    #region Test 1: Controllers Should Not Reference Repositories
    
    /// <summary>
    /// Тест: Контроллеры не должны напрямую зависеть от репозиториев.
    /// API слой должен взаимодействовать только с сервисным слоем.
    /// Это обеспечивает разделение ответственности и упрощает тестирование.
    /// </summary>
    [Fact]
    public void ControllersShouldNotReferenceRepositories()
    {
        // Arrange - получаем все репозитории для проверки зависимостей
        var repositoryTypeNames = Types.InAssemblies(Assemblies)
            .That()
            .HaveNameEndingWith("Repository")
            .And()
            .AreNotInterfaces()
            .GetTypes()
            .Select(t => t.FullName)
            .Where(t => t != null)
            .Cast<string>()
            .ToArray();

        // Act - проверяем контроллеры
        var result = Types.InAssemblies(Assemblies)
            .That()
            .HaveNameEndingWith("Controller")
            .And()
            .AreNotAbstract()
            .Should()
            .NotHaveDependencyOnAny(repositoryTypeNames)
            .GetResult();

        // Assert
        result.IsSuccessful.Should().BeTrue(
            because: "контроллеры не должны напрямую зависеть от репозиториев. " +
                     "Используйте сервисы для инкапсуляции бизнес-логики. " +
                     $"Нарушения: {(result.FailingTypes != null ? string.Join(", ", result.FailingTypes.Select(t => t.Name)) : "нет")}");
    }

    #endregion

    #region Test 2: Services Should Have Interfaces

    /// <summary>
    /// Тест: Все классы с суффиксом "Service" должны реализовывать интерфейс.
    /// Это обеспечивает слабую связанность, упрощает мокирование в тестах
    /// и следует принципу Dependency Inversion (SOLID).
    /// </summary>
    [Fact]
    public void ServicesShouldHaveInterfaces()
    {
        // Получаем все классы-сервисы
        var serviceClasses = Types.InAssemblies(Assemblies)
            .That()
            .HaveNameEndingWith("Service")
            .And()
            .AreNotAbstract()
            .GetTypes();

        var failingTypes = new List<string>();

        foreach (var serviceClass in serviceClasses)
        {
            // Проверяем, что класс реализует хотя бы один интерфейс
            var interfaces = serviceClass.GetInterfaces();
            if (interfaces.Length == 0)
            {
                failingTypes.Add(serviceClass.Name);
            }
        }

        // Assert
        failingTypes.Should().BeEmpty(
            because: "все сервисы должны реализовывать хотя бы один интерфейс. " +
                     "Это обеспечивает слабую связанность и упрощает тестирование. " +
                     $"Нарушения: {string.Join(", ", failingTypes)}");
    }

    /// <summary>
    /// Тест: Интерфейсы сервисов должны иметь naming convention I{ServiceName}.
    /// Пример: CatalogService -> ICatalogService
    /// </summary>
    [Fact]
    public void ServiceInterfacesShouldFollowNamingConvention()
    {
        // Получаем все классы-сервисы
        var serviceClasses = Types.InAssemblies(Assemblies)
            .That()
            .HaveNameEndingWith("Service")
            .And()
            .AreNotAbstract()
            .GetTypes();

        var failingTypes = new List<string>();

        foreach (var serviceClass in serviceClasses)
        {
            // Проверяем, что класс реализует интерфейс с ожидаемым именем
            var expectedInterfaceName = "I" + serviceClass.Name;
            var implementsExpectedInterface = serviceClass.GetInterfaces()
                .Any(i => i.Name == expectedInterfaceName);

            if (!implementsExpectedInterface)
            {
                failingTypes.Add($"{serviceClass.Name} (ожидается интерфейс {expectedInterfaceName})");
            }
        }

        // Assert
        failingTypes.Should().BeEmpty(
            because: "каждый сервис должен иметь интерфейс с именем I{ServiceName}. " +
                     "Например, CatalogService должен реализовывать ICatalogService. " +
                     $"Нарушения: {string.Join(", ", failingTypes)}");
    }

    #endregion

    #region Test 3: Domain Entities Should Be Sealed or Protected

    /// <summary>
    /// Тест: Сущности в SharedKernel или Domain проектах должны быть sealed
    /// или иметь защищённую внутреннюю логику.
    /// Это предотвращает некорректное наследование и обеспечивает иммутабельность.
    /// </summary>
    [Fact]
    public void DomainEntitiesShouldBeSealedOrProtected()
    {
        // Получаем сборку SharedKernel
        var sharedKernelAssembly = Assemblies.FirstOrDefault(a => a.GetName().Name == "SharedKernel");
        
        if (sharedKernelAssembly == null)
        {
            // Если сборка не найдена, тест пропускается
            return;
        }

        // Arrange & Act - проверяем сущности в SharedKernel
        var entities = Types.InAssembly(sharedKernelAssembly)
            .That()
            .ResideInNamespace("GoldPC.SharedKernel.Entities")
            .And()
            .AreClasses()
            .GetTypes();

        var failingTypes = entities
            .Where(t => !t.IsSealed && !t.IsAbstract)
            .Select(t => t.Name)
            .ToList();

        // Assert
        failingTypes.Should().BeEmpty(
            because: "сущности домена должны быть sealed или abstract для предотвращения некорректного наследования. " +
                     $"Нарушения: {string.Join(", ", failingTypes)}");
    }

    /// <summary>
    /// Тест: Сущности в сервисах также должны следовать принципам защищённости.
    /// Проверяем, что все entity-классы либо sealed, либо abstract, либо наследуются от BaseEntity.
    /// Вспомогательные классы (History, Item, Token, Type, Part) исключаются из проверки.
    /// </summary>
    [Fact]
    public void EntitiesShouldBeSealedOrAbstractOrInheritFromBaseEntity()
    {
        // Вспомогательные классы, которые исключаем из проверки
        // Это value objects, history records, и другие вспомогательные сущности
        var excludedSuffixes = new[] { "History", "Item", "Token", "Type", "Part", "Dto", "DTO", "Request", "Response" };
        
        // Получаем все типы в пространствах имён Entities
        var entityTypes = Types.InAssemblies(Assemblies)
            .That()
            .ResideInNamespaceContaining(".Entities")
            .And()
            .AreClasses()
            .And()
            .AreNotAbstract()
            .GetTypes()
            .Where(t => !excludedSuffixes.Any(suffix => t.Name.EndsWith(suffix)));

        var failingTypes = new List<string>();

        foreach (var entityType in entityTypes)
        {
            // Если класс не sealed и не наследуется от абстрактного базового класса (кроме object)
            if (!entityType.IsSealed)
            {
                var baseType = entityType.BaseType;
                if (baseType == null || baseType == typeof(object) || !baseType.IsAbstract)
                {
                    failingTypes.Add(entityType.Name);
                }
            }
        }

        // Assert - этот тест может быть мягким предупреждением
        failingTypes.Should().BeEmpty(
            because: "сущности должны быть sealed, abstract или наследоваться от абстрактного базового класса. " +
                     "Это обеспечивает защищённость доменной логики. " +
                     $"Нарушения: {string.Join(", ", failingTypes)}");
    }

    #endregion

    #region Additional Tests

    /// <summary>
    /// Тест: Репозитории должны реализовывать интерфейсы.
    /// Это обеспечивает слабую связанность и упрощает подмену реализаций.
    /// </summary>
    [Fact]
    public void RepositoriesShouldHaveInterfaces()
    {
        // Получаем все классы-репозитории
        var repositoryClasses = Types.InAssemblies(Assemblies)
            .That()
            .HaveNameEndingWith("Repository")
            .And()
            .AreNotAbstract()
            .And()
            .AreNotInterfaces()
            .GetTypes();

        var failingTypes = new List<string>();

        foreach (var repoClass in repositoryClasses)
        {
            // Проверяем, что класс реализует хотя бы один интерфейс
            var interfaces = repoClass.GetInterfaces();
            if (interfaces.Length == 0)
            {
                failingTypes.Add(repoClass.Name);
            }
        }

        // Assert
        failingTypes.Should().BeEmpty(
            because: "все репозитории должны реализовывать хотя бы один интерфейс. " +
                     $"Нарушения: {string.Join(", ", failingTypes)}");
    }

    /// <summary>
    /// Тест: Контроллеры должны находиться в правильном пространстве имён.
    /// </summary>
    [Fact]
    public void ControllersShouldBeInControllersNamespace()
    {
        // Arrange & Act
        var result = Types.InAssemblies(Assemblies)
            .That()
            .HaveNameEndingWith("Controller")
            .And()
            .AreNotAbstract()
            .Should()
            .ResideInNamespaceContaining("Controllers")
            .GetResult();

        // Assert
        result.IsSuccessful.Should().BeTrue(
            because: "контроллеры должны находиться в пространстве имён, содержащем 'Controllers'. " +
                     $"Нарушения: {(result.FailingTypes != null ? string.Join(", ", result.FailingTypes.Select(t => t.Name)) : "нет")}");
    }

    /// <summary>
    /// Тест: Проверка naming convention для репозиториев.
    /// Каждый репозиторий должен иметь интерфейс I{RepositoryName}.
    /// </summary>
    [Fact]
    public void RepositoryInterfacesShouldFollowNamingConvention()
    {
        // Получаем все классы-репозитории
        var repositoryClasses = Types.InAssemblies(Assemblies)
            .That()
            .HaveNameEndingWith("Repository")
            .And()
            .AreNotAbstract()
            .And()
            .AreNotInterfaces()
            .GetTypes();

        var failingTypes = new List<string>();

        foreach (var repoClass in repositoryClasses)
        {
            // Проверяем, что класс реализует интерфейс с ожидаемым именем
            var expectedInterfaceName = "I" + repoClass.Name;
            var implementsExpectedInterface = repoClass.GetInterfaces()
                .Any(i => i.Name == expectedInterfaceName);

            if (!implementsExpectedInterface)
            {
                failingTypes.Add($"{repoClass.Name} (ожидается интерфейс {expectedInterfaceName})");
            }
        }

        // Assert
        failingTypes.Should().BeEmpty(
            because: "каждый репозиторий должен иметь интерфейс с именем I{RepositoryName}. " +
                     "Например, ProductRepository должен реализовывать IProductRepository. " +
                     $"Нарушения: {string.Join(", ", failingTypes)}");
    }

    #endregion
}