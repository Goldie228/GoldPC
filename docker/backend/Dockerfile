# =============================================================================
# Multi-stage Dockerfile for GoldPC .NET Backend Services
# Security: Non-root user, Alpine runtime, Health checks
# Optimization: Layer caching for dependencies
# =============================================================================

ARG SERVICE_NAME=CatalogService
ARG SERVICE_PORT=5001

# =============================================================================
# Stage 1: Build - Compile and test
# =============================================================================
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
ARG SERVICE_NAME

WORKDIR /src

# Optimization: Copy solution file first
COPY ["src/GoldPC.sln", "./"]

# Optimization: Copy all .csproj files for layer caching
# This allows Docker to cache the restore layer when only code changes
COPY ["src/AuthService/AuthService.csproj", "AuthService/"]
COPY ["src/CatalogService/CatalogService.csproj", "CatalogService/"]
COPY ["src/OrdersService/OrdersService.csproj", "OrdersService/"]
COPY ["src/PCBuilderService/PCBuilderService.csproj", "PCBuilderService/"]
COPY ["src/ServicesService/ServicesService.csproj", "ServicesService/"]
COPY ["src/WarrantyService/WarrantyService.csproj", "WarrantyService/"]
COPY ["src/Shared/Shared.csproj", "Shared/"]
COPY ["src/SharedKernel/SharedKernel.csproj", "SharedKernel/"]

# Restore dependencies - this layer will be cached if .csproj files don't change
RUN dotnet restore "GoldPC.sln"

# Copy all source code (after restore for better caching)
COPY src/AuthService/ AuthService/
COPY src/CatalogService/ CatalogService/
COPY src/OrdersService/ OrdersService/
COPY src/PCBuilderService/ PCBuilderService/
COPY src/ServicesService/ ServicesService/
COPY src/WarrantyService/ WarrantyService/
COPY src/Shared/ Shared/
COPY src/SharedKernel/ SharedKernel/

# Build the solution
RUN dotnet build "GoldPC.sln" -c Release --no-restore

# =============================================================================
# Stage 2: Publish - Create deployment artifacts
# =============================================================================
FROM build AS publish
ARG SERVICE_NAME

WORKDIR "/src/${SERVICE_NAME}"
RUN dotnet publish "${SERVICE_NAME}.csproj" -c Release -o /app/publish --no-restore /p:UseAppHost=false

# =============================================================================
# Stage 3: Runtime - Minimal secure image
# =============================================================================
FROM mcr.microsoft.com/dotnet/aspnet:8.0-alpine AS runtime
ARG SERVICE_NAME
ARG SERVICE_PORT

# Security: Install required packages
# - ca-certificates: For TLS/SSL connections
# - curl: For health checks
# - tzdata: For timezone support
RUN apk add --no-cache ca-certificates curl tzdata && \
    update-ca-certificates

# Security: Create non-root user and group
# Using Alpine's adduser/addgroup commands
RUN addgroup -g 1000 -S appgroup && \
    adduser -u 1000 -S appuser -G appgroup -h /app

WORKDIR /app

# Copy published application from publish stage
COPY --from=publish /app/publish .

# Security: Set proper ownership
RUN chown -R appuser:appgroup /app

# Security: Switch to non-root user
USER appuser

# Configure service
EXPOSE ${SERVICE_PORT}
ENV ASPNETCORE_URLS=http://+:${SERVICE_PORT}
ENV ASPNETCORE_ENVIRONMENT=Production
ENV DOTNET_SYSTEM_GLOBALIZATION_INVARIANT=1

# Health check using curl
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:${SERVICE_PORT}/health || exit 1

# Entry point - use shell form to expand SERVICE_NAME
CMD ["sh", "-c", "dotnet ${SERVICE_NAME}.dll"]