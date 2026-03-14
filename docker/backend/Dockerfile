# Stage 1: Build
FROM mcr.microsoft.com/dotnet/sdk:8.0-alpine AS build
WORKDIR /src

# Copy solution and restore
COPY ["GoldPC.sln", "./"]
COPY ["src/backend/GoldPC.Api/GoldPC.Api.csproj", "src/backend/GoldPC.Api/"]
COPY ["src/backend/GoldPC.Core/GoldPC.Core.csproj", "src/backend/GoldPC.Core/"]
COPY ["src/backend/GoldPC.Infrastructure/GoldPC.Infrastructure.csproj", "src/backend/GoldPC.Infrastructure/"]

RUN dotnet restore "GoldPC.sln"

# Copy source and build
COPY src/backend/. ./src/backend/
WORKDIR "/src/src/backend/GoldPC.Api"
RUN dotnet publish "GoldPC.Api.csproj" -c Release -o /app/publish --no-restore

# Stage 2: Runtime
FROM mcr.microsoft.com/dotnet/aspnet:8.0-alpine AS runtime

# Security: Create non-root user
RUN addgroup -g 1000 -S appgroup && \
    adduser -u 1000 -S appuser -G appgroup

# Security: Install ca-certificates for TLS
RUN apk add --no-cache ca-certificates tzdata && \
    update-ca-certificates

WORKDIR /app

# Security: Copy only necessary files
COPY --from=build /app/publish .

# Security: Set ownership
RUN chown -R appuser:appgroup /app

# Security: Run as non-root user
USER appuser

# Security: Read-only root filesystem (Kubernetes will enforce)
# Security: No new privileges
# Security: Drop all capabilities, add only needed

EXPOSE 8080
EXPOSE 8443

ENV ASPNETCORE_URLS=http://+:8080
ENV ASPNETCORE_ENVIRONMENT=Production
ENV DOTNET_SYSTEM_GLOBALIZATION_INVARIANT=1

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8080/health || exit 1

ENTRYPOINT ["dotnet", "GoldPC.Api.dll"]
</task_progress>
</write_to_file>