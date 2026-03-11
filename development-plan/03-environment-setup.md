# Этап 3: Настройка среды разработки

## 🏗️ ИЗОЛЯЦИЯ РАБОЧИХ ПРОСТРАНСТВ

**Версия документа:** 1.0  
**Длительность этапа:** 1 неделя  
**Ответственный:** DevOps, TIER-1 Архитектор

---

## Цель этапа

Настроить монорепозиторий, изолированные рабочие пространства для агентов, систему синхронизации и базовую CI/CD инфраструктуру.

---

## Входные данные

| Данные | Источник |
|--------|----------|
| Архитектура системы | [02-contracts-and-architecture.md](./02-contracts-and-architecture.md) |
| Технологический стек | [Инструменты_для_разработки.md](./appendices/Инструменты_для_разработки.md) |
| OpenAPI спецификации | Этап 2 |

---

## Подробное описание действий

### 3.1 Структура монорепозитория (День 1-2)

#### Действия:

1. **Создание структуры проекта**

```
goldpc/
├── src/
│   ├── backend/
│   │   ├── GoldPC.Api/                 # Web API проект
│   │   ├── GoldPC.Core/                # Бизнес-логика
│   │   ├── GoldPC.Infrastructure/      # Инфраструктура
│   │   └── GoldPC.Tests/               # Unit/Integration тесты
│   └── frontend/
│       ├── src/
│       │   ├── components/
│       │   ├── pages/
│       │   ├── hooks/
│       │   ├── services/
│       │   ├── store/
│       │   └── utils/
│       ├── public/
│       ├── package.json
│       └── vite.config.ts
├── docs/
│   ├── api/                            # OpenAPI спецификации
│   ├── architecture/                   # Диаграммы
│   └── guides/                         # Руководства
├── scripts/
│   ├── docker/                         # Dockerfile'ы
│   ├── ci/                             # CI скрипты
│   └── db/                             # Миграции
├── docker-compose.yml
├── docker-compose.dev.yml
├── .github/
│   └── workflows/                      # GitHub Actions
├── .gitignore
├── README.md
└── LICENSE
```

2. **Инициализация .NET проекта**

```bash
# Создание solution
dotnet new sln -n GoldPC

# Создание проектов
dotnet new webapi -n GoldPC.Api -o src/backend/GoldPC.Api
dotnet new classlib -n GoldPC.Core -o src/backend/GoldPC.Core
dotnet new classlib -n GoldPC.Infrastructure -o src/backend/GoldPC.Infrastructure
dotnet new xunit -n GoldPC.Tests -o src/backend/GoldPC.Tests

# Добавление в solution
dotnet sln add src/backend/GoldPC.Api
dotnet sln add src/backend/GoldPC.Core
dotnet sln add src/backend/GoldPC.Infrastructure
dotnet sln add src/backend/GoldPC.Tests

# Добавление ссылок
dotnet add src/backend/GoldPC.Api reference src/backend/GoldPC.Core
dotnet add src/backend/GoldPC.Api reference src/backend/GoldPC.Infrastructure
dotnet add src/backend/GoldPC.Infrastructure reference src/backend/GoldPC.Core
dotnet add src/backend/GoldPC.Tests reference src/backend/GoldPC.Core
```

3. **Инициализация Frontend проекта**

```bash
cd src/frontend
npm create vite@latest . -- --template react-ts
npm install

# Установка зависимостей
npm install @reduxjs/toolkit react-redux
npm install @mui/material @mui/icons-material @emotion/react @emotion/styled
npm install axios react-router-dom react-hook-form yup
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

#### Ответственный:
- 🥇 TIER-1 Архитектор
- DevOps

---

### 3.2 Git Worktree для изоляции агентов (День 2-3)

#### Действия:

1. **Создание worktree для каждого агента**

```bash
# Основной worktree (главный)
git worktree add worktrees/main main

# Worktree для Frontend агента
git worktree add worktrees/agent-a -b feature/frontend-dev

# Worktree для Backend агента
git worktree add worktrees/agent-b -b feature/backend-dev

# Worktree для Test агента
git worktree add worktrees/agent-c -b feature/test-dev

# Worktree для Infra агента
git worktree add worktrees/agent-d -b feature/infra-dev
```

2. **Структура worktree**

```
goldpc/
├── (основной репозиторий)
└── worktrees/
    ├── main/           # Основная ветка
    ├── agent-a/        # Frontend разработка
    ├── agent-b/        # Backend разработка
    ├── agent-c/        # Тестирование
    └── agent-d/        # Инфраструктура
```

3. **Скрипт управления worktree**

```bash
#!/bin/bash
# scripts/worktree.sh

create_worktree() {
    local agent=$1
    local branch=$2
    git worktree add "worktrees/$agent" -b "$branch"
}

remove_worktree() {
    local agent=$1
    git worktree remove "worktrees/$agent"
}

sync_worktree() {
    local agent=$1
    cd "worktrees/$agent"
    git fetch origin
    git rebase origin/main
}

case "$1" in
    create) create_worktree "$2" "$3" ;;
    remove) remove_worktree "$2" ;;
    sync) sync_worktree "$2" ;;
    list) git worktree list ;;
esac
```

#### Ответственный:
- DevOps

---

### 3.3 Docker изоляция для агентов (День 3-4)

#### Действия:

1. **Docker Compose для разработки**

```yaml
# docker-compose.dev.yml
version: '3.8'

services:
  # PostgreSQL Database
  postgres:
    image: postgres:16-alpine
    container_name: goldpc-postgres
    environment:
      POSTGRES_USER: goldpc
      POSTGRES_PASSWORD: goldpc_dev_password
      POSTGRES_DB: goldpc_db
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./scripts/db/init:/docker-entrypoint-initdb.d
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U goldpc"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Redis Cache
  redis:
    image: redis:7-alpine
    container_name: goldpc-redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Backend API
  backend:
    build:
      context: .
      dockerfile: scripts/docker/Dockerfile.backend.dev
    container_name: goldpc-backend
    environment:
      - ASPNETCORE_ENVIRONMENT=Development
      - ConnectionStrings__DefaultConnection=Host=postgres;Port=5432;Database=goldpc_db;Username=goldpc;Password=goldpc_dev_password
      - Redis__Connection=redis:6379
    ports:
      - "5000:8080"
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    volumes:
      - ./src/backend:/app
      - /app/obj
      - /app/bin

  # Frontend Dev Server
  frontend:
    build:
      context: .
      dockerfile: scripts/docker/Dockerfile.frontend.dev
    container_name: goldpc-frontend
    environment:
      - VITE_API_URL=http://localhost:5000
    ports:
      - "3000:3000"
    volumes:
      - ./src/frontend:/app
      - /app/node_modules

  # Agent A Container (Frontend)
  agent-a:
    build:
      context: .
      dockerfile: scripts/docker/Dockerfile.agent
    container_name: goldpc-agent-a
    environment:
      - AGENT_ID=agent-a
      - WORK_DIR=/workspace
    volumes:
      - ./worktrees/agent-a:/workspace
    working_dir: /workspace

  # Agent B Container (Backend)
  agent-b:
    build:
      context: .
      dockerfile: scripts/docker/Dockerfile.agent
    container_name: goldpc-agent-b
    environment:
      - AGENT_ID=agent-b
      - WORK_DIR=/workspace
    volumes:
      - ./worktrees/agent-b:/workspace
    working_dir: /workspace

volumes:
  postgres_data:
  redis_data:
```

2. **Dockerfile для Backend (dev)**

```dockerfile
# scripts/docker/Dockerfile.backend.dev
FROM mcr.microsoft.com/dotnet/sdk:8.0

WORKDIR /app

# Установка инструментов
RUN dotnet tool install --global dotnet-watch
RUN dotnet tool install --global dotnet-ef

ENV PATH="${PATH}:/root/.dotnet/tools"

# Копирование csproj и восстановление
COPY src/backend/*.csproj ./
RUN dotnet restore

# Копирование исходников
COPY src/backend/ ./

EXPOSE 8080

CMD ["dotnet", "watch", "run", "--project", "GoldPC.Api", "--urls", "http://0.0.0.0:8080"]
```

3. **Dockerfile для Frontend (dev)**

```dockerfile
# scripts/docker/Dockerfile.frontend.dev
FROM node:20-alpine

WORKDIR /app

# Копирование package.json
COPY src/frontend/package*.json ./

# Установка зависимостей
RUN npm install

# Копирование исходников
COPY src/frontend/ ./

EXPOSE 3000

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
```

4. **Dockerfile для агентов**

```dockerfile
# scripts/docker/Dockerfile.agent
FROM mcr.microsoft.com/dotnet/sdk:8.0

# Установка Node.js для frontend агентов
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs

# Установка инструментов
RUN dotnet tool install --global dotnet-ef
RUN npm install -g pnpm

ENV PATH="${PATH}:/root/.dotnet/tools"

WORKDIR /workspace

# Скрипт для запуска агента
COPY scripts/docker/agent-entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
```

#### Ответственный:
- DevOps

---

### 3.4 Workspace Sync Bus (День 4-5)

#### Действия:

1. **Реализация синхронизации**

```csharp
// src/backend/GoldPC.Infrastructure/Sync/WorkspaceSyncService.cs
public class WorkspaceSyncService
{
    private readonly ILogger<WorkspaceSyncService> _logger;
    private readonly IConnectionMultiplexer _redis;
    private readonly LockManager _lockManager;

    public WorkspaceSyncService(
        ILogger<WorkspaceSyncService> logger,
        IConnectionMultiplexer redis,
        LockManager lockManager)
    {
        _logger = logger;
        _redis = redis;
        _lockManager = lockManager;
    }

    // Публикация события обновления
    public async Task PublishUpdateAsync(string agentId, string module, string changeType)
    {
        var db = _redis.GetSubscriber();
        var message = new WorkspaceMessage
        {
            AgentId = agentId,
            Module = module,
            ChangeType = changeType,
            Timestamp = DateTime.UtcNow
        };
        
        await db.PublishAsync("workspace:updates", JsonSerializer.Serialize(message));
        _logger.LogInformation("Published update from {AgentId}: {Module} - {ChangeType}", 
            agentId, module, changeType);
    }

    // Подписка на обновления
    public void SubscribeToUpdates(Action<WorkspaceMessage> onMessage)
    {
        var db = _redis.GetSubscriber();
        db.Subscribe("workspace:updates", (channel, message) =>
        {
            var msg = JsonSerializer.Deserialize<WorkspaceMessage>(message!);
            onMessage(msg!);
        });
    }

    // Запрос блокировки ресурса
    public async Task<bool> RequestLockAsync(string agentId, string resource, TimeSpan timeout)
    {
        return await _lockManager.AcquireLockAsync(agentId, resource, timeout);
    }

    // Освобождение блокировки
    public async Task ReleaseLockAsync(string agentId, string resource)
    {
        await _lockManager.ReleaseLockAsync(agentId, resource);
    }
}

public record WorkspaceMessage
{
    public string AgentId { get; init; } = string.Empty;
    public string Module { get; init; } = string.Empty;
    public string ChangeType { get; init; } = string.Empty;
    public DateTime Timestamp { get; init; }
}
```

2. **Lock Manager**

```csharp
// src/backend/GoldPC.Infrastructure/Sync/LockManager.cs
public class LockManager
{
    private readonly IConnectionMultiplexer _redis;
    private readonly TimeSpan _defaultLockTimeout = TimeSpan.FromMinutes(5);

    public async Task<bool> AcquireLockAsync(string agentId, string resource, TimeSpan? timeout = null)
    {
        var db = _redis.GetDatabase();
        var lockKey = $"lock:{resource}";
        var lockValue = $"{agentId}:{Guid.NewGuid()}";
        
        var acquired = await db.StringSetAsync(
            lockKey, 
            lockValue, 
            timeout ?? _defaultLockTimeout, 
            When.NotExists
        );
        
        return acquired;
    }

    public async Task ReleaseLockAsync(string agentId, string resource)
    {
        var db = _redis.GetDatabase();
        var lockKey = $"lock:{resource}";
        var lockValue = await db.StringGetAsync(lockKey);
        
        // Удаляем только если lock принадлежит этому агенту
        if (lockValue.HasValue && lockValue.ToString().StartsWith(agentId))
        {
            await db.KeyDeleteAsync(lockKey);
        }
    }

    public async Task<bool> IsLockedAsync(string resource)
    {
        var db = _redis.GetDatabase();
        return await db.KeyExistsAsync($"lock:{resource}");
    }
}
```

3. **Правила синхронизации**

| Ресурс | Тип блокировки | Timeout | Конфликт |
|--------|----------------|---------|----------|
| API контракт | Exclusive | 30 мин | Ожидание |
| Shared библиотека | Shared | 15 мин | Queue |
| Database migration | Exclusive | 60 мин | Error |
| Frontend component | None | - | Git merge |

#### Ответственный:
- 🥇 TIER-1 Архитектор

---

### 3.5 CI/CD Pipeline (День 5-7)

#### Действия:

1. **GitHub Actions Workflow**

```yaml
# .github/workflows/ci.yml
name: GoldPC CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

env:
  DOTNET_VERSION: '8.0.x'
  NODE_VERSION: '20.x'

jobs:
  # Backend CI
  backend:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: src/backend
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup .NET
        uses: actions/setup-dotnet@v4
        with:
          dotnet-version: ${{ env.DOTNET_VERSION }}
      
      - name: Restore dependencies
        run: dotnet restore
      
      - name: Build
        run: dotnet build --configuration Release --no-restore
      
      - name: Run Unit Tests
        run: dotnet test --configuration Release --no-build --verbosity normal
      
      - name: Run Integration Tests
        run: dotnet test --configuration Release --filter "FullyQualifiedName~Integration"
        env:
          ConnectionStrings__DefaultConnection: "Host=localhost;Database=test_db;Username=test;Password=test"

  # Frontend CI
  frontend:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: src/frontend
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
          cache-dependency-path: src/frontend/package-lock.json
      
      - name: Install dependencies
        run: npm ci
      
      - name: Lint
        run: npm run lint
      
      - name: Type check
        run: npm run type-check
      
      - name: Build
        run: npm run build
      
      - name: Run tests
        run: npm run test:coverage

  # Contract Tests
  contracts:
    runs-on: ubuntu-latest
    needs: [backend, frontend]
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Validate OpenAPI specs
        run: |
          npm install -g @stoplight/spectral-cli
          spectral lint docs/api/openapi/*.yaml
      
      - name: Run Pact tests
        run: |
          # Pact verification logic
          echo "Running Pact contract tests..."

  # Security Scan
  security:
    runs-on: ubuntu-latest
    needs: [backend, frontend]
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Run Trivy vulnerability scanner
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: 'fs'
          scan-ref: '.'
          severity: 'CRITICAL,HIGH'
      
      - name: Run Snyk security scan
        uses: snyk/actions/dotnet@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
```

2. **Workflow для деплоя**

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]
  workflow_dispatch:
    inputs:
      environment:
        description: 'Environment to deploy'
        required: true
        default: 'staging'
        type: choice
        options:
          - staging
          - production

jobs:
  build-and-push:
    runs-on: ubuntu-latest
    outputs:
      image-tag: ${{ steps.meta.outputs.tags }}
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3
      
      - name: Login to Docker Hub
        uses: docker/login-action@v3
        with:
          username: ${{ secrets.DOCKERHUB_USERNAME }}
          password: ${{ secrets.DOCKERHUB_TOKEN }}
      
      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ secrets.DOCKERHUB_USERNAME }}/goldpc
          tags: |
            type=sha
            type=ref,event=branch
      
      - name: Build and push Backend
        uses: docker/build-push-action@v5
        with:
          context: .
          file: scripts/docker/Dockerfile.backend
          push: true
          tags: ${{ steps.meta.outputs.tags }}
      
      - name: Build and push Frontend
        uses: docker/build-push-action@v5
        with:
          context: .
          file: scripts/docker/Dockerfile.frontend
          push: true
          tags: ${{ steps.meta.outputs.tags }}-frontend

  deploy:
    needs: build-and-push
    runs-on: ubuntu-latest
    environment: ${{ inputs.environment || 'staging' }}
    
    steps:
      - name: Deploy to server
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.DEPLOY_HOST }}
          username: ${{ secrets.DEPLOY_USER }}
          key: ${{ secrets.DEPLOY_KEY }}
          script: |
            cd /opt/goldpc
            docker-compose pull
            docker-compose up -d
            docker system prune -f
```

#### Ответственный:
- DevOps

---

## Выходные артефакты

| Артефакт | Формат | Расположение |
|----------|--------|--------------|
| Структура монорепозитория | Directory | `/goldpc` |
| .NET Solution | .sln | `src/backend/` |
| React проект | package.json | `src/frontend/` |
| Docker Compose | YAML | `docker-compose.yml` |
| Worktree скрипты | Bash | `scripts/worktree.sh` |
| GitHub Actions | YAML | `.github/workflows/` |
| Dockerfile'ы | Dockerfile | `scripts/docker/` |

---

## Критерии готовности (Definition of Done)

- [ ] Монорепозиторий инициализирован
- [ ] Backend проект компилируется
- [ ] Frontend проект собирается
- [ ] Docker Compose запускает все сервисы
- [ ] Worktree для каждого агента созданы
- [ ] CI/CD pipeline работает
- [ ] Локальная разработка протестирована
- [ ] Документация по установке готова

---

## Возможные риски и митигация

| Риск | Вероятность | Влияние | Меры митигации |
|------|-------------|---------|----------------|
| Конфликты портов Docker | Средняя | Низкое | Использование переменных окружения |
| Проблемы с правами доступа | Низкая | Среднее | Настройка volumes |
| Несовместимость версий | Низкая | Среднее | Фиксация версий в Dockerfile |

---

## Переход к следующему этапу

Для перехода к этапу [04-stub-generation.md](./04-stub-generation.md) необходимо:

1. ✅ Успешный `docker-compose up`
2. ✅ Backend API доступен на :5000
3. ✅ Frontend доступен на :3000
4. ✅ PostgreSQL и Redis работают
5. ✅ CI/CD pipeline зелёный

---

## Связанные документы

- [README.md](./README.md) — Обзор плана
- [02-contracts-and-architecture.md](./02-contracts-and-architecture.md) — Архитектура
- [Инструменты_для_разработки.md](./appendices/Инструменты_для_разработки.md) — Инструментарий

---

*Документ создан в рамках плана разработки GoldPC.*