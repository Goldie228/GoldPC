# =============================================================================
# Многоэтапный Dockerfile для GoldPC .NET Backend Services
# Безопасность: Не-root пользователь, Alpine среда выполнения, Проверки здоровья
# Оптимизация: Кэширование слоёв для зависимостей
# =============================================================================

ARG SERVICE_NAME=CatalogService
ARG SERVICE_PORT=5001

# =============================================================================
# Этап 1: Сборка — Компиляция и тестирование
# =============================================================================
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
ARG SERVICE_NAME

WORKDIR /src

# Оптимизация: Сначала скопировать файл решения
COPY ["src/GoldPC.sln", "./"]

# Оптимизация: Скопировать все .csproj файлы для кэширования слоёв
# Это позволяет Docker кэшировать слой restore, когда меняется только код
COPY ["src/AuthService/AuthService.csproj", "AuthService/"]
COPY ["src/CatalogService/CatalogService.csproj", "CatalogService/"]
COPY ["src/OrdersService/OrdersService.csproj", "OrdersService/"]
COPY ["src/PCBuilderService/PCBuilderService.csproj", "PCBuilderService/"]
COPY ["src/ServicesService/ServicesService.csproj", "ServicesService/"]
COPY ["src/WarrantyService/WarrantyService.csproj", "WarrantyService/"]
COPY ["src/Shared/Shared.csproj", "Shared/"]
COPY ["src/SharedKernel/SharedKernel.csproj", "SharedKernel/"]

# Восстановление зависимостей — этот слой будет кэширован, если .csproj файлы не меняются
RUN dotnet restore "GoldPC.sln"

# Копировать весь исходный код (после restore для лучшего кэширования)
COPY src/AuthService/ AuthService/
COPY src/CatalogService/ CatalogService/
COPY src/OrdersService/ OrdersService/
COPY src/PCBuilderService/ PCBuilderService/
COPY src/ServicesService/ ServicesService/
COPY src/WarrantyService/ WarrantyService/
COPY src/Shared/ Shared/
COPY src/SharedKernel/ SharedKernel/

# Сборка решения
RUN dotnet build "GoldPC.sln" -c Release --no-restore

# =============================================================================
# Этап 2: Публикация — Создание артефактов развёртывания
# =============================================================================
FROM build AS publish
ARG SERVICE_NAME

WORKDIR "/src/${SERVICE_NAME}"
RUN dotnet publish "${SERVICE_NAME}.csproj" -c Release -o /app/publish --no-restore /p:UseAppHost=false

# =============================================================================
# Этап 3: Среда выполнения — Минимальный безопасный образ
# =============================================================================
FROM mcr.microsoft.com/dotnet/aspnet:8.0-alpine AS runtime
ARG SERVICE_NAME
ARG SERVICE_PORT

# Безопасность: Установка необходимых пакетов
# - ca-certificates: Для TLS/SSL соединений
# - wget: Для проверок здоровья (легче чем curl)
# - curl: Для расширенных проверок здоровья (POST запросы)
# - tzdata: Для поддержки часовых поясов
RUN apk add --no-cache ca-certificates wget curl tzdata && \
    update-ca-certificates

# Безопасность: Создание не-root пользователя и группы
# Использование команд Alpine adduser/addgroup
RUN addgroup -g 1000 -S appgroup && \
    adduser -u 1000 -S appuser -G appgroup -h /app

WORKDIR /app

# Копировать опубликованное приложение из этапа публикации
COPY --from=publish /app/publish .

# Безопасность: Установка правильного владельца
RUN chown -R appuser:appgroup /app

# Безопасность: Переключение на не-root пользователя
USER appuser

# Настройка сервиса
EXPOSE ${SERVICE_PORT}
ENV ASPNETCORE_URLS=http://+:${SERVICE_PORT}
ENV ASPNETCORE_ENVIRONMENT=Production
ENV DOTNET_SYSTEM_GLOBALIZATION_INVARIANT=1

# Проверка здоровья с использованием wget
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:${SERVICE_PORT}/health || exit 1

# Точка входа — использование shell-формы для разворачивания SERVICE_NAME
CMD ["sh", "-c", "dotnet ${SERVICE_NAME}.dll"]
