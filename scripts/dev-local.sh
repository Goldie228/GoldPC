#!/bin/bash
# =============================================================================
# GoldPC: локальный запуск разработки (без Docker)
# =============================================================================
# Использование: ./scripts/dev-local.sh [ОПЦИИ]
#
# Опции:
#   --frontend-only    Запустить только фронтенд
#   --backend-only     Запустить только бэкенд-сервисы
#   --infra-only       Запустить только инфраструктуру (postgres, redis) через Docker
#   --help             Показать эту справку
# =============================================================================
# ПРИМЕЧАНИЕ: Этот скрипт обрабатывает символ '#' в пути проекта,
# копируя фронтенд в /tmp и используя inotifywait для синхронизации изменений (HMR работает!).
# =============================================================================

set -e

# Убедиться, что инструменты .NET могут найти среду выполнения
export DOTNET_ROOT=/usr/share/dotnet
export PATH="$DOTNET_ROOT:$PATH"

# Цвета
CYAN='\033[36m'
GREEN='\033[32m'
YELLOW='\033[33m'
RED='\033[31m'
RESET='\033[0m'

timestamp() {
    date '+%H:%M:%S'
}

log_info() {
    echo -e "${CYAN}[$(timestamp)] $1${RESET}"
}

log_ok() {
    echo -e "${GREEN}[$(timestamp)] ✓ $1${RESET}"
}

log_warn() {
    echo -e "${YELLOW}[$(timestamp)] ⚠ $1${RESET}"
}

# Последние строки лога (для heartbeat, когда вывод только в файл)
tail_log_hint() {
    local log_file="$1"
    local n="${2:-4}"
    if [ ! -f "$log_file" ] || [ ! -s "$log_file" ]; then
        echo "    (лог пока пустой — процесс стартовал)"
        return
    fi
    tail -n "$n" "$log_file" | sed 's/^/    │ /'
}

run_with_heartbeat() {
    local title="$1"
    local log_file="$2"
    shift 2

    log_info "$title (полный лог: $log_file)"
    if [ "$TAIL_LOGS" = true ]; then
        # Дублируем stdout/stderr в терминал и в файл — видно прогресс в реальном времени
        set +e
        set -o pipefail
        "$@" 2>&1 | tee -a "$log_file"
        local rc=$?
        set +o pipefail
        set -e
        return $rc
    fi

    "$@" >> "$log_file" 2>&1 &
    local cmd_pid=$!
    local elapsed=0

    while kill -0 "$cmd_pid" 2>/dev/null; do
        sleep 5
        elapsed=$((elapsed + 5))
        if [ $((elapsed % 10)) -eq 0 ]; then
            local lines
            lines=$(wc -l < "$log_file" 2>/dev/null | tr -d ' ' || echo 0)
            echo -e "${CYAN}[$(timestamp)] … ещё выполняется: $title (${elapsed}с), строк в логе: ${lines}${RESET}"
            tail_log_hint "$log_file" 3
        fi
    done

    wait "$cmd_pid"
}

# Разбор аргументов
FRONTEND_ONLY=false
BACKEND_ONLY=false
INFRA_ONLY=false
RESET_DB=false
SKIP_SEED=false
TAIL_LOGS=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --frontend-only)
            FRONTEND_ONLY=true
            shift
            ;;
        --backend-only)
            BACKEND_ONLY=true
            shift
            ;;
        --infra-only)
            INFRA_ONLY=true
            shift
            ;;
        --reset)
            RESET_DB=true
            shift
            ;;
        --skip-seed)
            SKIP_SEED=true
            shift
            ;;
        --tail)
            TAIL_LOGS=true
            shift
            ;;
        --help|-h)
            echo "GoldPC Local Development Startup"
            echo ""
            echo "Usage: ./scripts/dev-local.sh [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --frontend-only    Start only frontend"
            echo "  --backend-only     Start only backend services"
            echo "  --infra-only       Start only infrastructure (postgres, redis)"
            echo "  --skip-seed        Skip database seed (catalog-seed.json)"
            echo "  --tail             Во время сида: вывод этапов (seed, fetch-images, …) в консоль"
            echo "                     и в logs/catalog-seed.log; после старта — поток логов сервисов"
            echo "  --help             Show this help message"
            exit 0
            ;;
        *)
            echo -e "${RED}Неизвестная опция: $1${RESET}"
            exit 1
            ;;
    esac
done

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
FRONTEND_SRC="$PROJECT_DIR/src/frontend"
FRONTEND_TMP="/tmp/goldpc-frontend-dev"
LOG_DIR="$PROJECT_DIR/logs"

# Убедиться, что директория логов существует
mkdir -p "$LOG_DIR"
rm -f "$LOG_DIR"/*.log
if [ "$TAIL_LOGS" = true ]; then
    echo -e "${GREEN}Режим --tail:${RESET} логи сида дублируются в консоль; полный архив — ${CYAN}$LOG_DIR/catalog-seed.log${RESET}"
fi
{
    echo "======== GoldPC dev-local seed log ========"
    echo "Started: $(date -Iseconds)"
    echo "TAIL_LOGS=$TAIL_LOGS"
    echo "=========================================="
} >> "$LOG_DIR/catalog-seed.log"

# Глобальный список PID для очистки
declare -a SERVICE_PIDS

echo -e "${CYAN}================================================${RESET}"
echo -e "${CYAN}   GoldPC — Локальная среда разработки${RESET}"
echo -e "${CYAN}================================================${RESET}"
echo ""

# Функция проверки доступности порта
check_port() {
    local port=$1
    if lsof -Pi :"$port" -sTCP:LISTEN -t >/dev/null ; then
        return 1
    fi
    return 0
}

# Завершить процесс, занимающий порт. Возвращает 0, если порт свободен, 1 — если всё ещё занят.
free_port() {
    local port=$1

    # Первая попытка: если это прокси Docker-контейнера, остановить контейнер
    local container_id
    container_id=$(sudo lsof -i :"$port" -sTCP:LISTEN -t 2>/dev/null | head -1)
    if [ -n "$container_id" ]; then
        # Найти контейнер, который маппит этот порт
        local container_name
        container_name=$(sudo docker ps --filter "publish=$port" --format '{{.Names}}' 2>/dev/null | head -1)
        if [ -n "$container_name" ]; then
            log_warn "Порт $port занят контейнером '$container_name' — остановка и удаление..."
            sudo docker stop "$container_name" >/dev/null 2>&1
            sudo docker rm "$container_name" >/dev/null 2>&1
            sleep 1
            if check_port "$port"; then
                log_ok "Порт $port освобождён (удалён контейнер '$container_name')"
                return 0
            fi
        fi
    fi

    # Вторая попытка: завершить процесс напрямую через fuser (работает даже с Tl-процессами)
    local fuser_out
    fuser_out=$(fuser -k -KILL "$port/tcp" 2>&1) || true
    if [ -n "$fuser_out" ]; then
        log_warn "Порт $port — fuser завершил процесс(ы): $fuser_out"
        sleep 2
        if check_port "$port"; then
            log_ok "Порт $port освобождён"
            return 0
        fi
    fi

    return 1
}

# Предварительная проверка окружения
check_env() {
    echo -e "${CYAN}Проверка окружения...${RESET}"
    local missing_tools=0

    for tool in dotnet node docker npm rsync; do
        if ! command -v "$tool" &> /dev/null; then
            echo -e "${RED}✗ $tool не установлен${RESET}"
            missing_tools=1
        else
            echo -e "${GREEN}✓ $tool найден${RESET}"
        fi
    done

    if [ $missing_tools -eq 1 ]; then
        echo -e "${RED}Пожалуйста, установите недостающие инструменты и повторите попытку.${RESET}"
        exit 1
    fi

    echo -e "${CYAN}Проверка доступности портов...${RESET}"
    local ports=(5000 5001 5002 5003 5004 5005 5173 5434 6379)
    for port in "${ports[@]}"; do
        if ! check_port "$port"; then
            if ! free_port "$port"; then
                echo -e "${RED}✗ Порт $port уже используется и не может быть освобождён${RESET}"
                exit 1
            fi
        fi
    done
    echo -e "${GREEN}✓ Все требуемые порты доступны${RESET}"
}

# Запуск проверки окружения
check_env

# Функция очистки для trap
cleanup() {
    echo -e "\n${YELLOW}Остановка всех сервисов...${RESET}"

    # Завершить отслеживаемые фоновые процессы
    for pid in "${SERVICE_PIDS[@]}"; do
        if kill -0 "$pid" 2>/dev/null; then
            kill "$pid" 2>/dev/null || true
        fi
    done

    # Также очистка по именам процессов на всякий случай
    pkill -f "dotnet run" 2>/dev/null || true
    pkill -f "vite" 2>/dev/null || true
    pkill -f "inotifywait" 2>/dev/null || true

    echo -e "${GREEN}✓ Очистка завершена${RESET}"
    exit 0
}

# Регистрация trap очистки
trap cleanup SIGINT SIGTERM EXIT

# Функция ожидания готовности сервиса
# Использование: wait_for_health URL ИМЯ [PID] [ФАЙЛ_ЛОГА]
wait_for_health() {
    local url=$1
    local name=$2
    local pid=$3
    local log_file=$4
    local timeout=120
    local count=0

    echo -ne "${CYAN}Ожидание готовности $name...${RESET}"
    while [ $count -lt $timeout ]; do
        # Проверка, жив ли процесс
        if [ -n "$pid" ] && ! kill -0 "$pid" 2>/dev/null; then
            echo -e " ${RED}АВАРИЙНО ЗАВЕРШИЛСЯ${RESET}"
            echo -e "${RED}  ✗ Процесс $name неожиданно завершился.${RESET}"
            if [ -n "$log_file" ] && [ -f "$log_file" ]; then
                echo -e "${RED}  Последние 10 строк лога:${RESET}"
                tail -n 10 "$log_file" | sed 's/^/    │ /'
            fi
            return 1
        fi
        if curl -sf "$url" >/dev/null 2>&1; then
            echo -e " ${GREEN}OK${RESET}"
            return 0
        fi
        echo -ne "."
        sleep 1
        count=$((count + 1))
    done
    echo -e " ${RED}НЕУДАЧА (таймаут)${RESET}"
    if [ -n "$log_file" ] && [ -f "$log_file" ]; then
        echo -e "${RED}  Последние 10 строк лога $name:${RESET}"
        tail -n 10 "$log_file" | sed 's/^/    │ /'
    fi
    return 1
}

# Автогенерация JWT_SECRET, если всё ещё плейсхолдер
ensure_jwt_secret() {
    local env_file="$PROJECT_DIR/.env"
    if [ ! -f "$env_file" ]; then
        cp "$PROJECT_DIR/.env.example" "$env_file"
    fi
    if grep -q "CHANGE_ME" "$env_file" 2>/dev/null; then
        local secret
        secret=$(openssl rand -base64 32)
        sed -i "s|JWT_SECRET=.*|JWT_SECRET=$secret|" "$env_file"
        sed -i "s|ENCRYPTION_KEY=.*|ENCRYPTION_KEY=$(openssl rand -base64 32)|" "$env_file"
        log_ok "Сгенерированы JWT_SECRET и ENCRYPTION_KEY в .env"
    fi
}

# Функция запуска инфраструктуры
start_infra() {
    ensure_jwt_secret
    echo -e "${CYAN}Запуск инфраструктуры (PostgreSQL, Redis, RabbitMQ)...${RESET}"
    docker compose -f "$PROJECT_DIR/docker/docker-compose.yml" up -d postgres redis rabbitmq

    # Ожидание PostgreSQL
    echo -ne "${CYAN}Ожидание готовности PostgreSQL...${RESET}"
    local timeout=60
    local count=0
    while [ $count -lt $timeout ]; do
        if docker exec goldpc-postgres pg_isready -U postgres >/dev/null 2>&1; then
            echo -e " ${GREEN}OK${RESET}"
            break
        fi
        echo -ne "."
        sleep 1
        count=$((count + 1))
    done
    if [ $count -eq $timeout ]; then
        echo -e " ${RED}НЕУДАЧА (таймаут)${RESET}"
    fi

    # Ожидание Redis
    echo -ne "${CYAN}Ожидание готовности Redis...${RESET}"
    count=0
    while [ $count -lt $timeout ]; do
        if docker exec goldpc-redis redis-cli -a "${REDIS_PASSWORD:-redis_dev_password}" ping 2>/dev/null | grep -q "PONG"; then
            echo -e " ${GREEN}OK${RESET}"
            break
        fi
        echo -ne "."
        sleep 1
        count=$((count + 1))
    done
    if [ $count -eq $timeout ]; then
        echo -e " ${RED}НЕУДАЧА (таймаут)${RESET}"
    fi

    # Ожидание RabbitMQ (может занять до 60 с с management-плагином)
    echo -ne "${CYAN}Ожидание готовности RabbitMQ...${RESET}"
    count=0
    local rabbit_timeout=90
    while [ $count -lt $rabbit_timeout ]; do
        if docker exec goldpc-rabbitmq rabbitmq-diagnostics -q ping 2>/dev/null; then
            echo -e " ${GREEN}OK${RESET}"
            break
        fi
        echo -ne "."
        sleep 1
        count=$((count + 1))
    done
    if [ $count -eq $rabbit_timeout ]; then
        echo -e " ${RED}НЕУДАЧА (таймаут)${RESET}"
    fi

    # Сброс баз данных, если запрошено
    if [ "$RESET_DB" = true ]; then
        echo -e "${YELLOW}Сброс баз данных (--reset)...${RESET}"
        for db in goldpc_catalog goldpc_auth goldpc_orders goldpc_services goldpc_warranty goldpc_pcbuilder goldpc_reporting; do
            docker exec goldpc-postgres psql -U postgres -c "DROP DATABASE IF EXISTS $db;" 2>/dev/null || true
        done
        echo -e "${GREEN}✓ Базы данных удалены${RESET}"
    fi

    # Создание баз данных, если не существуют
    echo -e "${CYAN}Создание баз данных...${RESET}"
    docker exec goldpc-postgres psql -U postgres -c "CREATE DATABASE goldpc_catalog;" 2>/dev/null || true
    docker exec goldpc-postgres psql -U postgres -c "CREATE DATABASE goldpc_auth;" 2>/dev/null || true
    docker exec goldpc-postgres psql -U postgres -c "CREATE DATABASE goldpc_orders;" 2>/dev/null || true
    docker exec goldpc-postgres psql -U postgres -c "CREATE DATABASE goldpc_services;" 2>/dev/null || true
    docker exec goldpc-postgres psql -U postgres -c "CREATE DATABASE goldpc_warranty;" 2>/dev/null || true
    docker exec goldpc-postgres psql -U postgres -c "CREATE DATABASE goldpc_pcbuilder;" 2>/dev/null || true
    docker exec goldpc-postgres psql -U postgres -c "CREATE DATABASE goldpc_reporting;" 2>/dev/null || true

    echo -e "${GREEN}✓ Инфраструктура готова${RESET}"
}

# Функция заполнения каталога
seed_catalog() {
    if [ "$SKIP_SEED" = true ]; then
        log_warn "Пропуск заполнения БД (--skip-seed)"
        return
    fi
    log_info "Заполнение базы данных каталога..."
    log_info "Полный лог сида: $LOG_DIR/catalog-seed.log"
    if [ "$TAIL_LOGS" != true ]; then
        log_info "Подсказка: ${YELLOW}./scripts/dev-local.sh --tail${RESET} — видеть прогресс сида в консоли"
    fi

    # Офлайн-сид (scripts/seed-data/catalog-seed.json + локальные /uploads/seed/*)
    if (cd "$PROJECT_DIR/src/CatalogService" && run_with_heartbeat "Выполнение seed-catalog" "$LOG_DIR/catalog-seed.log" dotnet run -- seed-catalog); then
        log_ok "Каталог загружен"
    else
        log_warn "Сид не удался или JSON не найден. Проверьте logs/catalog-seed.log"
    fi

    # Заполнение производителей для исторических данных
    if (cd "$PROJECT_DIR/src/CatalogService" && run_with_heartbeat "Выполнение backfill-manufacturers" "$LOG_DIR/catalog-seed.log" dotnet run -- backfill-manufacturers); then
        log_ok "Производители заполнены"
    else
        log_warn "Заполнение производителей не удалось. Проверьте logs/catalog-seed.log"
    fi

    # Если файлы уже на диске, а path в БД пустой — подтянуть path тем же алгоритмом, что и при импорте
    if (cd "$PROJECT_DIR/src/CatalogService" && run_with_heartbeat "Синхронизация путей изображений с диска" "$LOG_DIR/catalog-seed.log" dotnet run -- sync-image-paths-from-disk); then
        log_ok "Пути изображений синхронизированы с диска"
    else
        log_warn "sync-image-paths-from-disk не удался. Проверьте logs/catalog-seed.log"
    fi

    # Синхронизация атрибутов фильтров
    if (cd "$PROJECT_DIR/src/CatalogService" && run_with_heartbeat "Выполнение seed-filter-attributes" "$LOG_DIR/catalog-seed.log" dotnet run -- seed-filter-attributes); then
        log_ok "Атрибуты фильтров синхронизированы"
    fi

    # Финальная чистка невалидных X-Core товаров
    if (cd "$PROJECT_DIR/src/CatalogService" && run_with_heartbeat "Выполнение cleanup-invalid-products" "$LOG_DIR/catalog-seed.log" dotnet run -- cleanup-invalid-products); then
        log_ok "Очистка невалидных товаров завершена"
    else
        log_warn "Очистка невалидных товаров не удалась. Проверьте logs/catalog-seed.log"
    fi
}

# Функция заполнения admin пользователя (вызывается после seed_catalog)
seed_admin() {
    if [ "$SKIP_SEED" = true ]; then
        log_warn "Пропуск заполнения admin (--skip-seed)"
        return
    fi
    log_info "Заполнение пользователей..."
    bash "$PROJECT_DIR/scripts/seed-data/seed-users.sh" 2>&1 | while IFS= read -r line; do
        log_info "  [user-seed] $line"
    done
    log_ok "Пользователи заполнены"
}

# Функция применения миграций EF Core для всех сервисов
apply_migrations() {
    log_info "Применение миграций EF Core..."

    local services=(
        "src/CatalogService"
        "src/AuthService"
        "src/OrdersService"
        "src/ServicesService"
        "src/WarrantyService"
        "src/PCBuilderService"
        "src/ReportingService"
    )

    for path in "${services[@]}"; do
        local name
        name=$(basename "$path")
        local ctx_flag=""
        if [ "$name" = "CatalogService" ]; then
            ctx_flag="--context CatalogDbContext"
        fi
        if (cd "$PROJECT_DIR/$path" && dotnet ef database update $ctx_flag --no-color >> "$LOG_DIR/migrations.log" 2>&1); then
            log_ok "Миграции применены: $name"
        else
            log_warn "Миграции не удались для $name (см. $LOG_DIR/migrations.log)"
        fi
    done

    log_ok "Все миграции применены"
}

# Функция запуска бэкенд-сервисов
start_backend() {
    echo -e "${CYAN}Запуск бэкенд-сервисов...${RESET}"

    local services=(
        "CatalogService:5000:src/CatalogService:/swagger/index.html"
        "AuthService:5001:src/AuthService:/health"
        "OrdersService:5002:src/OrdersService:/health"
        "ServicesService:5003:src/ServicesService:/health"
        "WarrantyService:5004:src/WarrantyService:/health"
        "PCBuilderService:5005:src/PCBuilderService:/health"
        "ReportingService:5008:src/ReportingService:/health"
        "AdminPanel:5007:src/backend/GoldPC.Api:/health"
    )

    for service_info in "${services[@]}"; do
        IFS=":" read -r name port path health_path <<< "$service_info"
        echo -e "${CYAN}Запуск $name...${RESET}"

        cd "$PROJECT_DIR/$path"
        ASPNETCORE_ENVIRONMENT=Development dotnet run --urls "http://localhost:$port" > "$LOG_DIR/${name,,}.log" 2>&1 &
        local pid=$!
        SERVICE_PIDS+=($pid)

        # Быстрая проверка раннего завершения: если процесс завершается в течение 3 секунд, сообщить об ошибке
        sleep 3
        if ! kill -0 "$pid" 2>/dev/null; then
            echo -e "${RED}✗ $name завершился сразу (PID $pid)${RESET}"
            echo -e "${CYAN}Последние 15 строк ${name,,}.log:${RESET}"
            tail -15 "$LOG_DIR/${name,,}.log" 2>/dev/null | sed 's/^/  /'
            echo -e "${RED}✗ $name не удалось запустить. Исправьте ошибки выше и повторите.${RESET}"
            exit 1
        fi

        # Ожидание готовности перед запуском следующего сервиса
        local log_file="$LOG_DIR/${name,,}.log"
        if ! wait_for_health "http://localhost:$port$health_path" "$name" "$pid" "$log_file"; then
            echo -e "${RED}✗ $name не удалось запустить. Исправьте ошибки выше и повторите.${RESET}"
            exit 1
        fi
    done

    echo -e "${GREEN}✓ Все бэкенд-сервисы запущены${RESET}"
}

# Определение пути к локальному бинарнику vite (npm workspaces поднимают в корень репозитория)
vite_bin() {
    if [ -x "$PROJECT_DIR/node_modules/.bin/vite" ]; then
        echo "$PROJECT_DIR/node_modules/.bin/vite"
    elif [ -x "$FRONTEND_SRC/node_modules/.bin/vite" ]; then
        echo "$FRONTEND_SRC/node_modules/.bin/vite"
    else
        return 1
    fi
}

# Проверка, что критический плагин Vite имеет содержимое (не пустая/сломанная директория)
# Проверяет как корневые, так и рабочей области node_modules, так как подъём может различаться
check_critical_dep() {
    local p1="$PROJECT_DIR/node_modules/@vitejs/plugin-react"
    local p2="$FRONTEND_SRC/node_modules/@vitejs/plugin-react"
    if [ -d "$p1" ] && [ -n "$(ls -A "$p1" 2>/dev/null)" ]; then return 0; fi
    if [ -d "$p2" ] && [ -n "$(ls -A "$p2" 2>/dev/null)" ]; then return 0; fi
    return 1
}

ensure_frontend_deps() {
    if vite_bin >/dev/null 2>&1 && check_critical_dep; then
        return 0
    fi

    echo -e "${CYAN}Зависимости фронтенда отсутствуют или повреждены; переустановка...${RESET}"

    # Сначала попробовать npm install — npm может перезаписать существующие файлы
    if (cd "$PROJECT_DIR" && npm install >> "$LOG_DIR/frontend-setup.log" 2>&1); then
        echo -e "${GREEN}✓ npm install завершён${RESET}"
    else
        # Попробовать удалить node_modules рабочей области для чистой установки
        local fe_nm="$FRONTEND_SRC/node_modules"
        if [ -d "$fe_nm" ]; then
            echo -e "${CYAN}Очистка node_modules рабочей области для чистой установки...${RESET}"
            rm -rf "$fe_nm" 2>/dev/null || true
            # Всё ещё есть остаточные файлы, принадлежащие root? Спросить пользователя о sudo
            if [ -d "$fe_nm" ] && [ "$(ls -A "$fe_nm" 2>/dev/null)" ]; then
                echo -e "${YELLOW}⚠ Некоторые файлы в $fe_nm принадлежат root.${RESET}"
                echo -e "${YELLOW}  Выполните: sudo rm -rf $fe_nm${RESET}"
                echo -e "${YELLOW}  Затем: npm install${RESET}"
                return 1
            fi
        fi
        if (cd "$PROJECT_DIR" && npm install >> "$LOG_DIR/frontend-setup.log" 2>&1); then
            echo -e "${GREEN}✓ npm install завершён после очистки${RESET}"
        else
            echo -e "${RED}✗ npm install не удался. См. $LOG_DIR/frontend-setup.log${RESET}"
            return 1
        fi
    fi

    if ! vite_bin >/dev/null 2>&1 || ! check_critical_dep; then
        echo -e "${RED}✗ Критические зависимости фронтенда всё ещё отсутствуют после npm install${RESET}"
        return 1
    fi
}

# Дымовой тест: кратковременно попробовать запустить vite — если падает, показать ошибку сразу
frontend_smoke_test() {
    local v_bin
    v_bin="$(vite_bin)" || return 1
    echo -e "${CYAN}Выполнение дымового теста фронтенда (кратковременный запуск vite)...${RESET}"

    # Запустить vite на неиспользуемом порту на 6 секунд — достаточно для загрузки конфига
    local output
    output=$(cd "$FRONTEND_SRC" && timeout 6 "$v_bin" --port 19999 2>&1 || true)

    # Проверка на фатальные ошибки (нефатальные предупреждения — ок)
    if echo "$output" | grep -qi 'failed to load config\|cannot find.*package\|cannot find module\|error.*cannot\|ERR_MODULE_NOT_FOUND\|ERR_PACKAGE_PATH_NOT_EXPORTED'; then
        local err
        err=$(echo "$output" | grep -i 'error\|cannot\|failed\|ERR_' | head -5)
        echo -e "${RED}✗ Vite не прошёл дымовой тест${RESET}"
        echo "$err" | sed 's/^/  /'
        echo -e "${CYAN}Попытка автоматического восстановления...${RESET}"

        # Попробовать исправить через переустановку
        if ensure_frontend_deps; then
            echo -e "${GREEN}✓ Зависимости переустановлены, повторный дымовой тест...${RESET}"
            output=$(cd "$FRONTEND_SRC" && timeout 6 "$v_bin" --port 19998 2>&1 || true)
            if echo "$output" | grep -qi 'failed to load config\|cannot find.*package\|cannot find module\|error.*cannot\|ERR_MODULE_NOT_FOUND\|ERR_PACKAGE_PATH_NOT_EXPORTED'; then
                err=$(echo "$output" | grep -i 'error\|cannot\|failed\|ERR_' | head -5)
                echo -e "${RED}✗ Дымовой тест всё ещё не проходит после восстановления${RESET}"
                echo "$err" | sed 's/^/  /'
                return 1
            fi
        else
            return 1
        fi
    fi

    echo -e "${GREEN}✓ Дымовой тест Vite пройден${RESET}"
    return 0
}

# Функция запуска фронтенда
start_frontend() {
    echo -e "${CYAN}Подготовка фронтенда...${RESET}"

    # Загрузка nvm для Node 24 (Vite 8 несовместим с Node 18)
    if [ -s "$HOME/.nvm/nvm.sh" ]; then
        # shellcheck source=/dev/null
        . "$HOME/.nvm/nvm.sh"
        if nvm use 24.13.0 2>/dev/null; then
            echo -e "${GREEN}✓ Используется Node $(node -v) через nvm${RESET}"
        else
            echo -e "${YELLOW}⚠ nvm use 24.13.0 не удался, используется системный Node $(node -v)${RESET}"
            echo -e "${YELLOW}  Установи: nvm install 24.13.0 && nvm use 24.13.0${RESET}"
        fi
    else
        echo -e "${YELLOW}⚠ nvm не найден, используется системный Node $(node -v)${RESET}"
        echo -e "${YELLOW}  Установи nvm: https://github.com/nvm-sh/nvm${RESET}"
    fi

    if ! ensure_frontend_deps; then
        exit 1
    fi

    # Предварительный дымовой тест — выявить проблемы конфигурации/зависимостей до таймаута
    if ! frontend_smoke_test; then
        echo -e "${RED}✗ Фронтенд не прошёл предварительную проверку. Исправьте ошибки выше перед запуском.${RESET}"
        exit 1
    fi

    # Проверка, содержит ли путь символ '#' — Vite не может с этим работать
    if [[ "$FRONTEND_SRC" == *"#"* ]]; then
        echo -e "${YELLOW}Путь содержит символ '#'. Использование rsync + отслеживатель файлов...${RESET}"

        # Установка inotify-tools, если недоступны
        if ! command -v inotifywait &> /dev/null; then
            echo -e "${CYAN}Установка inotify-tools...${RESET}"
            sudo apt-get update -qq && sudo apt-get install -y -qq inotify-tools
        fi

        rm -rf "$FRONTEND_TMP"
        echo -e "${CYAN}Копирование фронтенда в /tmp...${RESET}"
        rsync -a --exclude='node_modules' "$FRONTEND_SRC/" "$FRONTEND_TMP/"

        echo -e "${CYAN}Установка зависимостей...${RESET}"
        (cd "$FRONTEND_TMP" && npm install >> "$LOG_DIR/frontend-setup.log" 2>&1)

        echo -e "${CYAN}Запуск отслеживателя файлов...${RESET}"
        (
            while true; do
                inotifywait -r -q -e modify,create,delete,move "$FRONTEND_SRC" --exclude 'node_modules|.git' 2>/dev/null
                rsync -a --exclude='node_modules' "$FRONTEND_SRC/" "$FRONTEND_TMP/"
            done
        ) &
        SERVICE_PIDS+=($!)

        echo -e "${CYAN}Запуск фронтенда из /tmp...${RESET}"
        cd "$FRONTEND_TMP"
        npm run dev:api > "$LOG_DIR/frontend.log" 2>&1 &
        SERVICE_PIDS+=($!)
    else
        echo -e "${CYAN}Запуск фронтенда...${RESET}"
        cd "$FRONTEND_SRC"
        npm run dev:api > "$LOG_DIR/frontend.log" 2>&1 &
        SERVICE_PIDS+=($!)
    fi

    # Ожидание 2 секунды — если процесс завершается сразу, сообщить об этом сейчас
    sleep 2
    local fe_pid=${SERVICE_PIDS[-1]}
    if ! kill -0 "$fe_pid" 2>/dev/null; then
        echo -e "${RED}✗ Процесс фронтенда завершился сразу${RESET}"
        echo -e "${CYAN}Последние 10 строк frontend.log:${RESET}"
        tail -10 "$LOG_DIR/frontend.log" 2>/dev/null | sed 's/^/  /'
        echo -e "${RED}✗ Фронтенд не удалось запустить. Исправьте ошибки выше и повторите.${RESET}"
        exit 1
    fi

    wait_for_health "http://localhost:5173" "Фронтенд"
    echo -e "${GREEN}✓ Фронтенд запущен${RESET}"
}

# Функция потоковой передачи логов
stream_logs() {
    if [ "$TAIL_LOGS" = false ]; then
        return
    fi

    echo -e "${CYAN}Потоковая передача логов (Нажмите Ctrl+C для остановки всего)...${RESET}"

    # Проверка наличия multitail, иначе использовать простой tail
    if command -v multitail &> /dev/null; then
        multitail -s 2 \
            -t "Catalog" "$LOG_DIR/catalogservice.log" \
            -t "Auth" "$LOG_DIR/authservice.log" \
            -t "Orders" "$LOG_DIR/ordersservice.log" \
            -t "Services" "$LOG_DIR/servicesservice.log" \
            -t "Warranty" "$LOG_DIR/warrantyservice.log" \
            -t "PCBuilder" "$LOG_DIR/pcbuilderservice.log" \
            -t "Reporting" "$LOG_DIR/reportingservice.log" \
            -t "Frontend" "$LOG_DIR/frontend.log"
    else
        # Запасной вариант: tail -f с префиксами
        # Явно перечисляем файлы, чтобы гарантировать показ заголовков для awk
        tail -f "$LOG_DIR/catalogservice.log" \
                "$LOG_DIR/authservice.log" \
                "$LOG_DIR/ordersservice.log" \
                "$LOG_DIR/servicesservice.log" \
                "$LOG_DIR/warrantyservice.log" \
                "$LOG_DIR/pcbuilderservice.log" \
                "$LOG_DIR/reportingservice.log" \
                "$LOG_DIR/frontend.log" 2>/dev/null | awk '
            /==> .*catalogservice.log <==/ { prefix="\033[32m[Catalog]\033[0m "; next }
            /==> .*authservice.log <==/ { prefix="\033[34m[Auth]\033[0m "; next }
            /==> .*ordersservice.log <==/ { prefix="\033[35m[Orders]\033[0m "; next }
            /==> .*servicesservice.log <==/ { prefix="\033[36m[Services]\033[0m "; next }
            /==> .*warrantyservice.log <==/ { prefix="\033[33m[Warranty]\033[0m "; next }
            /==> .*pcbuilderservice.log <==/ { prefix="\033[37m[PCBuilder]\033[0m "; next }
            /==> .*reportingservice.log <==/ { prefix="\033[36m[Reporting]\033[0m "; next }
            /==> .*frontend.log <==/ { prefix="\033[33m[Frontend]\033[0m "; next }
            { print prefix $0 }
        '
    fi
}

# Основное выполнение
if [ "$INFRA_ONLY" = true ]; then
    start_infra
elif [ "$FRONTEND_ONLY" = true ]; then
    start_frontend
elif [ "$BACKEND_ONLY" = true ]; then
    start_backend
else
    # Запуск всего
    start_infra
    apply_migrations
    seed_catalog
    start_backend
    seed_admin
    start_frontend
fi

echo ""
echo -e "${CYAN}================================================${RESET}"
echo -e "${CYAN}   Статус сервисов${RESET}"
echo -e "${CYAN}================================================${RESET}"
echo -e "${GREEN}Frontend:${RESET}     http://localhost:5173"
echo -e "${GREEN}Catalog API:${RESET}  http://localhost:5000/swagger"
echo -e "${GREEN}Auth API:${RESET}     http://localhost:5001/swagger"
echo -e "${GREEN}Orders API:${RESET}   http://localhost:5002/swagger"
echo -e "${GREEN}Services API:${RESET} http://localhost:5003/swagger"
echo -e "${GREEN}Warranty API:${RESET} http://localhost:5004/swagger"
echo -e "${GREEN}PCBuilder API:${RESET} http://localhost:5005/swagger"
echo -e "${GREEN}Admin Panel API:${RESET} http://localhost:5007/health"
echo ""
echo -e "${YELLOW}Логи доступны в $LOG_DIR/${RESET}"
if [ "$TAIL_LOGS" = false ]; then
    echo -e "${YELLOW}Запустите с --tail для потоковой передачи логов, или tail -f logs/*.log${RESET}"
fi
echo -e "${YELLOW}Нажмите Ctrl+C для остановки всех сервисов${RESET}"
echo ""

# Потоковая передача логов, если запрошено, иначе просто ожидание
if [ "$TAIL_LOGS" = true ]; then
    stream_logs
else
    wait
fi
