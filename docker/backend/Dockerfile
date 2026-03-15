# Generic Dockerfile for .NET backend services
# Usage: Build with specific service context
# Example: docker build -f docker/backend/Dockerfile --build-arg SERVICE_NAME=CatalogService -t goldpc-catalog .

ARG SERVICE_NAME=CatalogService
ARG SERVICE_PORT=5001

# Stage 1: Build
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
ARG SERVICE_NAME
WORKDIR /src

# Copy solution file
COPY ["GoldPC.sln", "./"]

# Copy all csproj files for restore
COPY ["src/CatalogService/CatalogService.csproj", "CatalogService/"]
COPY ["src/AuthService/AuthService.csproj", "AuthService/"]
COPY ["src/SharedKernel/SharedKernel.csproj", "SharedKernel/"]
COPY ["src/Shared/Shared.csproj", "Shared/"]

# Restore dependencies
RUN dotnet restore

# Copy all source code
COPY src/CatalogService/ CatalogService/
COPY src/AuthService/ AuthService/
COPY src/SharedKernel/ SharedKernel/
COPY src/Shared/ Shared/

# Build and publish the specified service
WORKDIR "/src/${SERVICE_NAME}"
RUN dotnet publish "${SERVICE_NAME}.csproj" -c Release -o /app/publish --no-restore

# Stage 2: Runtime
FROM mcr.microsoft.com/dotnet/aspnet:8.0-alpine AS runtime
ARG SERVICE_PORT

# Security: Create non-root user
RUN addgroup -g 1000 -S appgroup && \
    adduser -u 1000 -S appuser -G appgroup

# Security: Install ca-certificates for TLS
RUN apk add --no-cache ca-certificates tzdata && \
    update-ca-certificates

WORKDIR /app

# Copy published application
COPY --from=build /app/publish .

# Security: Set ownership
RUN chown -R appuser:appgroup /app

# Security: Run as non-root user
USER appuser

EXPOSE ${SERVICE_PORT}

ENV ASPNETCORE_URLS=http://+:${SERVICE_PORT}
ENV ASPNETCORE_ENVIRONMENT=Production
ENV DOTNET_SYSTEM_GLOBALIZATION_INVARIANT=1

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:${SERVICE_PORT}/health || exit 1

ENTRYPOINT ["dotnet", "CatalogService.dll"]