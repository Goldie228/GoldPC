#!/bin/bash
# =============================================================================
# GoldPC Local Development Startup (without Docker)
# =============================================================================
# Usage: ./scripts/dev-local.sh [OPTIONS]
#
# Options:
#   --frontend-only    Start only frontend
#   --backend-only     Start only backend services
#   --infra-only       Start only infrastructure (postgres, redis) via Docker
#   --help             Show this help message
# =============================================================================
# NOTE: This script handles the '#' character in the project path by 
# copying frontend to /tmp and using inotifywait to sync changes (HMR works!).
# =============================================================================

set -e

# Colors
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
            echo -e "${CYAN}[$(timestamp)] … ещё выполняется: $title (${elapsed}s), строк в логе: ${lines}${RESET}"
            tail_log_hint "$log_file" 3
        fi
    done

    wait "$cmd_pid"
}

# Parse arguments
FRONTEND_ONLY=false
BACKEND_ONLY=false
INFRA_ONLY=false
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
            echo -e "${RED}Unknown option: $1${RESET}"
            exit 1
            ;;
    esac
done

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
FRONTEND_SRC="$PROJECT_DIR/src/frontend"
FRONTEND_TMP="/tmp/goldpc-frontend-dev"
LOG_DIR="$PROJECT_DIR/logs"

# Ensure log directory exists
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

# Global PID list for cleanup
declare -a SERVICE_PIDS

echo -e "${CYAN}================================================${RESET}"
echo -e "${CYAN}   GoldPC Local Development Environment${RESET}"
echo -e "${CYAN}================================================${RESET}"
echo ""

# Function to check port availability
check_port() {
    local port=$1
    if lsof -Pi :"$port" -sTCP:LISTEN -t >/dev/null ; then
        return 1
    fi
    return 0
}

# Pre-flight environment validation
check_env() {
    echo -e "${CYAN}Validating environment...${RESET}"
    local missing_tools=0
    
    for tool in dotnet node docker npm rsync; do
        if ! command -v "$tool" &> /dev/null; then
            echo -e "${RED}✗ $tool is not installed${RESET}"
            missing_tools=1
        else
            echo -e "${GREEN}✓ $tool found${RESET}"
        fi
    done

    if [ $missing_tools -eq 1 ]; then
        echo -e "${RED}Please install missing tools and try again.${RESET}"
        exit 1
    fi

    echo -e "${CYAN}Checking port availability...${RESET}"
    local ports=(5000 5001 5002 5005 5173 5434 6379)
    for port in "${ports[@]}"; do
        if ! check_port "$port"; then
            echo -e "${RED}✗ Port $port is already in use${RESET}"
            exit 1
        fi
    done
    echo -e "${GREEN}✓ All required ports are available${RESET}"
}

# Run environment check
check_env

# Cleanup function for trap
cleanup() {
    echo -e "\n${YELLOW}Shutting down all services...${RESET}"
    
    # Kill tracked background processes
    for pid in "${SERVICE_PIDS[@]}"; do
        if kill -0 "$pid" 2>/dev/null; then
            kill "$pid" 2>/dev/null || true
        fi
    done
    
    # Also cleanup by process names just in case
    pkill -f "dotnet run" 2>/dev/null || true
    pkill -f "vite" 2>/dev/null || true
    pkill -f "inotifywait" 2>/dev/null || true
    
    echo -e "${GREEN}✓ Cleanup complete${RESET}"
    exit 0
}

# Register cleanup trap
trap cleanup SIGINT SIGTERM EXIT

# Function to wait for service health
wait_for_health() {
    local url=$1
    local name=$2
    local timeout=120
    local count=0
    
    echo -ne "${CYAN}Waiting for $name to be ready...${RESET}"
    while [ $count -lt $timeout ]; do
        if curl -sf "$url" >/dev/null 2>&1; then
            echo -e " ${GREEN}OK${RESET}"
            return 0
        fi
        echo -ne "."
        sleep 1
        count=$((count + 1))
    done
    echo -e " ${RED}FAILED (timeout)${RESET}"
    return 1
}

# Function to start infrastructure
start_infra() {
    echo -e "${CYAN}Starting infrastructure (PostgreSQL, Redis, RabbitMQ)...${RESET}"
    docker compose -f "$PROJECT_DIR/docker/docker-compose.yml" up -d postgres redis rabbitmq
    
    # Wait for PostgreSQL
    echo -ne "${CYAN}Waiting for PostgreSQL to be ready...${RESET}"
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
        echo -e " ${RED}FAILED (timeout)${RESET}"
    fi

    # Wait for Redis
    echo -ne "${CYAN}Waiting for Redis to be ready...${RESET}"
    count=0
    while [ $count -lt $timeout ]; do
        if docker exec goldpc-redis redis-cli ping 2>/dev/null | grep -q "PONG"; then
            echo -e " ${GREEN}OK${RESET}"
            break
        fi
        echo -ne "."
        sleep 1
        count=$((count + 1))
    done
    if [ $count -eq $timeout ]; then
        echo -e " ${RED}FAILED (timeout)${RESET}"
    fi

    # Wait for RabbitMQ (может занять до 60 с с management-плагином)
    echo -ne "${CYAN}Waiting for RabbitMQ to be ready...${RESET}"
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
        echo -e " ${RED}FAILED (timeout)${RESET}"
    fi

    # Create databases if not exist
    echo -e "${CYAN}Creating databases...${RESET}"
    docker exec goldpc-postgres psql -U postgres -c "CREATE DATABASE goldpc_catalog;" 2>/dev/null || true
    docker exec goldpc-postgres psql -U postgres -c "CREATE DATABASE goldpc_auth;" 2>/dev/null || true
    docker exec goldpc-postgres psql -U postgres -c "CREATE DATABASE goldpc_orders;" 2>/dev/null || true
    docker exec goldpc-postgres psql -U postgres -c "CREATE DATABASE goldpc_services;" 2>/dev/null || true
    docker exec goldpc-postgres psql -U postgres -c "CREATE DATABASE goldpc_warranty;" 2>/dev/null || true
    
    echo -e "${GREEN}✓ Infrastructure ready${RESET}"
}

# Function to seed catalog database
seed_catalog() {
    if [ "$SKIP_SEED" = true ]; then
        log_warn "Skipping database seed (--skip-seed)"
        return
    fi
    log_info "Seeding catalog database..."
    log_info "Полный лог сида: $LOG_DIR/catalog-seed.log"
    if [ "$TAIL_LOGS" != true ]; then
        log_info "Подсказка: ${YELLOW}./scripts/dev-local.sh --tail${RESET} — видеть прогресс сида в консоли"
    fi
    
    # Офлайн-сид (scripts/seed-data/catalog-seed.json + локальные /uploads/seed/*)
    if (cd "$PROJECT_DIR/src/CatalogService" && run_with_heartbeat "Running seed-catalog" "$LOG_DIR/catalog-seed.log" dotnet run -- seed-catalog); then
        log_ok "Catalog upsert completed"
    else
        log_warn "Seed failed or no JSON found. Check logs/catalog-seed.log"
    fi

    # Backfill производителей для исторических данных
    if (cd "$PROJECT_DIR/src/CatalogService" && run_with_heartbeat "Running backfill-manufacturers" "$LOG_DIR/catalog-seed.log" dotnet run -- backfill-manufacturers); then
        log_ok "Manufacturer backfill completed"
    else
        log_warn "Manufacturer backfill failed. Check logs/catalog-seed.log"
    fi

    # Если файлы уже на диске, а path в БД пустой — подтянуть path тем же алгоритмом, что и при импорте
    if (cd "$PROJECT_DIR/src/CatalogService" && run_with_heartbeat "Sync image paths from disk" "$LOG_DIR/catalog-seed.log" dotnet run -- sync-image-paths-from-disk); then
        log_ok "Image paths synced from disk"
    else
        log_warn "sync-image-paths-from-disk failed. Check logs/catalog-seed.log"
    fi

    # Filter attributes sync
    if (cd "$PROJECT_DIR/src/CatalogService" && run_with_heartbeat "Running seed-filter-attributes" "$LOG_DIR/catalog-seed.log" dotnet run -- seed-filter-attributes); then
        log_ok "Filter attributes synced"
    fi

    # Финальная чистка невалидных X-Core товаров
    if (cd "$PROJECT_DIR/src/CatalogService" && run_with_heartbeat "Running cleanup-invalid-products" "$LOG_DIR/catalog-seed.log" dotnet run -- cleanup-invalid-products); then
        log_ok "Invalid products cleanup completed"
    else
        log_warn "Invalid products cleanup failed. Check logs/catalog-seed.log"
    fi
}

# Function to start backend services
start_backend() {
    echo -e "${CYAN}Starting backend services...${RESET}"

    local services=(
        "CatalogService:5000:src/CatalogService:/swagger/index.html"
        "AuthService:5001:src/AuthService:/health"
        "OrdersService:5002:src/OrdersService:/health"
        "PCBuilderService:5005:src/PCBuilderService:/health"
    )

    for service_info in "${services[@]}"; do
        IFS=":" read -r name port path health_path <<< "$service_info"
        echo -e "${CYAN}Launching $name...${RESET}"

        cd "$PROJECT_DIR/$path"
        dotnet run --urls "http://localhost:$port" > "$LOG_DIR/${name,,}.log" 2>&1 &
        local pid=$!
        SERVICE_PIDS+=($pid)

        # Quick early-death check: if the process exits within 3 seconds, fail fast
        sleep 3
        if ! kill -0 "$pid" 2>/dev/null; then
            echo -e "${RED}✗ $name exited immediately (PID $pid)${RESET}"
            echo -e "${CYAN}Last 15 lines of ${name,,}.log:${RESET}"
            tail -15 "$LOG_DIR/${name,,}.log" 2>/dev/null | sed 's/^/  /'
            echo -e "${RED}✗ $name failed to start. Fix the errors above and retry.${RESET}"
            exit 1
        fi

        # Wait for health before starting next service
        wait_for_health "http://localhost:$port$health_path" "$name"
        if [ $? -ne 0 ]; then
            echo -e "${RED}✗ $name health check failed${RESET}"
            echo -e "${CYAN}Last 15 lines of ${name,,}.log:${RESET}"
            tail -15 "$LOG_DIR/${name,,}.log" 2>/dev/null | sed 's/^/  /'
            exit 1
        fi
    done

    echo -e "${GREEN}✓ All backend services started${RESET}"
}

# Resolve path to local vite binary (npm workspaces hoist to repo root)
vite_bin() {
    if [ -x "$PROJECT_DIR/node_modules/.bin/vite" ]; then
        echo "$PROJECT_DIR/node_modules/.bin/vite"
    elif [ -x "$FRONTEND_SRC/node_modules/.bin/vite" ]; then
        echo "$FRONTEND_SRC/node_modules/.bin/vite"
    else
        return 1
    fi
}

# Check that a critical Vite plugin actually has content (not an empty/broken dir)
# Checks both root and workspace node_modules since hoisting may vary
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

    echo -e "${CYAN}Frontend dependencies missing or corrupted; reinstalling...${RESET}"

    # Try npm install first — npm can overwrite existing files
    if (cd "$PROJECT_DIR" && npm install >> "$LOG_DIR/frontend-setup.log" 2>&1); then
        echo -e "${GREEN}✓ npm install completed${RESET}"
    else
        # Try removing workspace node_modules for a clean install
        local fe_nm="$FRONTEND_SRC/node_modules"
        if [ -d "$fe_nm" ]; then
            echo -e "${CYAN}Cleaning workspace node_modules for clean install...${RESET}"
            rm -rf "$fe_nm" 2>/dev/null || true
            # Still have leftover root-owned files? Ask user for sudo
            if [ -d "$fe_nm" ] && [ "$(ls -A "$fe_nm" 2>/dev/null)" ]; then
                echo -e "${YELLOW}⚠ Some files in $fe_nm are owned by root.${RESET}"
                echo -e "${YELLOW}  Run: sudo rm -rf $fe_nm${RESET}"
                echo -e "${YELLOW}  Then: npm install${RESET}"
                return 1
            fi
        fi
        if (cd "$PROJECT_DIR" && npm install >> "$LOG_DIR/frontend-setup.log" 2>&1); then
            echo -e "${GREEN}✓ npm install completed after cleanup${RESET}"
        else
            echo -e "${RED}✗ npm install failed. See $LOG_DIR/frontend-setup.log${RESET}"
            return 1
        fi
    fi

    if ! vite_bin >/dev/null 2>&1 || ! check_critical_dep; then
        echo -e "${RED}✗ Critical frontend dependencies still missing after npm install${RESET}"
        return 1
    fi
}

# Smoke-test: briefly try to start vite — if it crashes, show the error immediately
frontend_smoke_test() {
    local v_bin
    v_bin="$(vite_bin)" || return 1
    echo -e "${CYAN}Running frontend smoke test (starting vite briefly)...${RESET}"

    # Start vite on an unused port for 6 seconds — long enough for config to load
    local output
    output=$(cd "$FRONTEND_SRC" && timeout 6 "$v_bin" --port 19999 2>&1 || true)

    # Check for fatal errors (non-fatal warnings are OK)
    if echo "$output" | grep -qi 'failed to load config\|cannot find.*package\|cannot find module\|error.*cannot\|ERR_MODULE_NOT_FOUND\|ERR_PACKAGE_PATH_NOT_EXPORTED'; then
        local err
        err=$(echo "$output" | grep -i 'error\|cannot\|failed\|ERR_' | head -5)
        echo -e "${RED}✗ Vite failed during smoke test${RESET}"
        echo "$err" | sed 's/^/  /'
        echo -e "${CYAN}Attempting auto-repair...${RESET}"

        # Try to fix via reinstall
        if ensure_frontend_deps; then
            echo -e "${GREEN}✓ Dependencies reinstalled, re-running smoke test...${RESET}"
            output=$(cd "$FRONTEND_SRC" && timeout 6 "$v_bin" --port 19998 2>&1 || true)
            if echo "$output" | grep -qi 'failed to load config\|cannot find.*package\|cannot find module\|error.*cannot\|ERR_MODULE_NOT_FOUND\|ERR_PACKAGE_PATH_NOT_EXPORTED'; then
                err=$(echo "$output" | grep -i 'error\|cannot\|failed\|ERR_' | head -5)
                echo -e "${RED}✗ Smoke test still failing after repair${RESET}"
                echo "$err" | sed 's/^/  /'
                return 1
            fi
        else
            return 1
        fi
    fi

    echo -e "${GREEN}✓ Vite smoke test passed${RESET}"
    return 0
}

# Function to start frontend
start_frontend() {
    echo -e "${CYAN}Preparing frontend...${RESET}"

    if ! ensure_frontend_deps; then
        exit 1
    fi

    # Pre-flight smoke test — catch config/dependency issues before timeout
    if ! frontend_smoke_test; then
        echo -e "${RED}✗ Frontend failed pre-flight checks. Fix the errors above before starting.${RESET}"
        exit 1
    fi

    # Check if path contains '#' - Vite cannot handle this
    if [[ "$FRONTEND_SRC" == *"#"* ]]; then
        echo -e "${YELLOW}Path contains '#' character. Using rsync + file watcher...${RESET}"

        # Install inotify-tools if not available
        if ! command -v inotifywait &> /dev/null; then
            echo -e "${CYAN}Installing inotify-tools...${RESET}"
            sudo apt-get update -qq && sudo apt-get install -y -qq inotify-tools
        fi

        rm -rf "$FRONTEND_TMP"
        echo -e "${CYAN}Copying frontend to /tmp...${RESET}"
        rsync -a --exclude='node_modules' "$FRONTEND_SRC/" "$FRONTEND_TMP/"

        echo -e "${CYAN}Installing dependencies...${RESET}"
        (cd "$FRONTEND_TMP" && npm install >> "$LOG_DIR/frontend-setup.log" 2>&1)

        echo -e "${CYAN}Starting file watcher...${RESET}"
        (
            while true; do
                inotifywait -r -q -e modify,create,delete,move "$FRONTEND_SRC" --exclude 'node_modules|.git' 2>/dev/null
                rsync -a --exclude='node_modules' "$FRONTEND_SRC/" "$FRONTEND_TMP/"
            done
        ) &
        SERVICE_PIDS+=($!)

        echo -e "${CYAN}Starting frontend from /tmp...${RESET}"
        cd "$FRONTEND_TMP"
        npm run dev:api > "$LOG_DIR/frontend.log" 2>&1 &
        SERVICE_PIDS+=($!)
    else
        echo -e "${CYAN}Starting frontend...${RESET}"
        cd "$FRONTEND_SRC"
        npm run dev:api > "$LOG_DIR/frontend.log" 2>&1 &
        SERVICE_PIDS+=($!)
    fi

    # Give the process 2 seconds — if it crashes early, report it now
    sleep 2
    local fe_pid=${SERVICE_PIDS[-1]}
    if ! kill -0 "$fe_pid" 2>/dev/null; then
        echo -e "${RED}✗ Frontend process exited immediately${RESET}"
        echo -e "${CYAN}Last 10 lines of frontend.log:${RESET}"
        tail -10 "$LOG_DIR/frontend.log" 2>/dev/null | sed 's/^/  /'
        echo -e "${RED}✗ Frontend failed to start. Fix the errors above and retry.${RESET}"
        exit 1
    fi

    wait_for_health "http://localhost:5173" "Frontend"
    echo -e "${GREEN}✓ Frontend started${RESET}"
}

# Function to stream logs
stream_logs() {
    if [ "$TAIL_LOGS" = false ]; then
        return
    fi

    echo -e "${CYAN}Streaming logs (Press Ctrl+C to stop everything)...${RESET}"
    
    # Check for multitail, otherwise use simple tail
    if command -v multitail &> /dev/null; then
        multitail -s 2 \
            -t "Catalog" "$LOG_DIR/catalogservice.log" \
            -t "Auth" "$LOG_DIR/authservice.log" \
            -t "Orders" "$LOG_DIR/ordersservice.log" \
            -t "PCBuilder" "$LOG_DIR/pcbuilderservice.log" \
            -t "Frontend" "$LOG_DIR/frontend.log"
    else
        # Fallback to tail -f with prefixes
        # We explicitly list files to ensure headers are shown for awk to pick them up
        tail -f "$LOG_DIR/catalogservice.log" \
                "$LOG_DIR/authservice.log" \
                "$LOG_DIR/ordersservice.log" \
                "$LOG_DIR/pcbuilderservice.log" \
                "$LOG_DIR/frontend.log" 2>/dev/null | awk '
            /==> .*catalogservice.log <==/ { prefix="\033[32m[Catalog]\033[0m "; next }
            /==> .*authservice.log <==/ { prefix="\033[34m[Auth]\033[0m "; next }
            /==> .*ordersservice.log <==/ { prefix="\033[35m[Orders]\033[0m "; next }
            /==> .*pcbuilderservice.log <==/ { prefix="\033[36m[PCBuilder]\033[0m "; next }
            /==> .*frontend.log <==/ { prefix="\033[33m[Frontend]\033[0m "; next }
            { print prefix $0 }
        '
    fi
}

# Main execution
if [ "$INFRA_ONLY" = true ]; then
    start_infra
elif [ "$FRONTEND_ONLY" = true ]; then
    start_frontend
elif [ "$BACKEND_ONLY" = true ]; then
    start_backend
else
    # Start everything
    start_infra
    seed_catalog
    start_backend
    start_frontend
fi

echo ""
echo -e "${CYAN}================================================${RESET}"
echo -e "${CYAN}   Services Status${RESET}"
echo -e "${CYAN}================================================${RESET}"
echo -e "${GREEN}Frontend:${RESET}     http://localhost:5173"
echo -e "${GREEN}Catalog API:${RESET}  http://localhost:5000/swagger"
echo -e "${GREEN}Auth API:${RESET}     http://localhost:5001/swagger"
echo -e "${GREEN}Orders API:${RESET}   http://localhost:5002/swagger"
echo -e "${GREEN}PCBuilder API:${RESET} http://localhost:5005/swagger"
echo ""
echo -e "${YELLOW}Logs are available in $LOG_DIR/${RESET}"
if [ "$TAIL_LOGS" = false ]; then
    echo -e "${YELLOW}Run with --tail to stream logs, or tail -f logs/*.log${RESET}"
fi
echo -e "${YELLOW}Press Ctrl+C to stop all services${RESET}"
echo ""

# Stream logs if requested, otherwise just wait
if [ "$TAIL_LOGS" = true ]; then
    stream_logs
else
    wait
fi
