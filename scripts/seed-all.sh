#!/bin/bash
#===============================================================================
# seed-all.sh — Полный пайплайн: скрапинг XCore -> seed в БД
#===============================================================================
# Делает ВСЁ: парсит товары с x-core.by, скачивает картинки, парсит
# характеристики, импортирует в каталог, нормализует фильтры.
#
# Использование:
#   ./scripts/seed-all.sh              -- полный цикл (скрапинг + seed)
#   ./scripts/seed-all.sh --seed-only  -- только seed из уже скачанных данных
#   ./scripts/seed-all.sh --slow       -- медленный режим (для плохого интернета)
#
# Зависимости:
#   - Node.js 18+ (для скрапера)
#   - dotnet 8.0+ (для seed-команд)
#   - Работающий PostgreSQL (docker compose up)
#===============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
SCRAPER_DIR="$PROJECT_DIR/scripts/scraper"
SEED_DATA_DIR="$PROJECT_DIR/scripts/seed-data"
LOG_DIR="$PROJECT_DIR/logs"

SEED_ONLY=false
SLOW_FLAG=""

# ─── Args ───────────────────────────────────────────────────────────────
for arg in "$@"; do
  case "$arg" in
    --seed-only) SEED_ONLY=true ;;
    --slow)      SLOW_FLAG="--slow" ;;
    --help|-h)
      echo "Использование: $0 [--seed-only] [--slow]"
      echo "  --seed-only  Только seed из уже скачанных данных"
      echo "  --slow       Медленный режим (увеличенные таймауты)"
      exit 0
      ;;
  esac
done

# ─── Colors ─────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; RESET='\033[0m'

log()  { echo -e "${CYAN}[$(date +%H:%M:%S)]${RESET} $*"; }
ok()   { echo -e "${CYAN}[$(date +%H:%M:%S)]${RESET} ${GREEN}✓${RESET} $*"; }
warn() { echo -e "${CYAN}[$(date +%H:%M:%S)]${RESET} ${YELLOW}⚠${RESET} $*"; }
fail() { echo -e "${CYAN}[$(date +%H:%M:%S)]${RESET} ${RED}✗${RESET} $*"; exit 1; }

mkdir -p "$LOG_DIR"

#===============================================================================
# Фаза 1: Скрапинг XCore.by
#===============================================================================
PRODUCT_COUNT="?"

if [ "$SEED_ONLY" = false ]; then

  log "Устанавливаю зависимости скрапера..."
  (cd "$SCRAPER_DIR" && npm install --silent 2>&1 | tail -1)
  ok "Зависимости установлены"

  log "Парсим товары с x-core.by (параллельно)..."
  (cd "$SCRAPER_DIR" && node scrape-parallel.mjs $SLOW_FLAG 2>&1)

  XCORE_JSON="$SCRAPER_DIR/data/xcore-products.json"
  if [ ! -f "$XCORE_JSON" ]; then
    fail "Скрапер не создал $XCORE_JSON"
  fi
  PRODUCT_COUNT=$(node --input-type=module -e "import d from '$XCORE_JSON'; console.log(d.productCount)" 2>/dev/null || node -e "const fs=require('fs'); const d=JSON.parse(fs.readFileSync('$XCORE_JSON','utf8')); console.log(d.productCount)")
  ok "Спарсено товаров: $PRODUCT_COUNT"

  log "Скачиваю картинки товаров..."
  (cd "$SCRAPER_DIR" && node fetch-product-images.mjs 2>&1) || warn "Картинки: частичные ошибки (не критично)"
  ok "Картинки скачаны"

  log "Парсим характеристики из HTML..."
  (cd "$SCRAPER_DIR" && node parse-specs-from-html.mjs 2>&1) || warn "Парсинг характеристик: частичные ошибки"
  ok "Характеристики обработаны"

  # Копируем в seed-data (с бэкапом старого файла)
  SEED_TARGET="$SEED_DATA_DIR/catalog-seed.json"
  if [ -f "$SEED_TARGET" ]; then
    cp "$SEED_TARGET" "${SEED_TARGET}.bak"
  fi
  cp "$XCORE_JSON" "$SEED_TARGET"
  ok "Данные скопированы в $SEED_TARGET"

fi

# В режиме --seed-only: копируем данные из scraper, если seed-data пуст
SEED_TARGET="$SEED_DATA_DIR/catalog-seed.json"
XCORE_JSON="$SCRAPER_DIR/data/xcore-products.json"
if [ "$SEED_ONLY" = true ] && [ -f "$XCORE_JSON" ]; then
  SEED_PRODUCTS=$(node -e "const fs=require('fs'); const d=JSON.parse(fs.readFileSync('$XCORE_JSON','utf8')); console.log(d.products?.length || 0)" 2>/dev/null || echo "0")
  if [ "$SEED_PRODUCTS" = "0" ]; then
    warn "catalog-seed.json пуст, копирую из scraper/data/xcore-products.json"
    if [ -f "$SEED_TARGET" ]; then
      cp "$SEED_TARGET" "${SEED_TARGET}.bak"
    fi
    cp "$XCORE_JSON" "$SEED_TARGET"
    ok "Данные скопированы из scraper в seed-data"
  fi
  PRODUCT_COUNT=$(node -e "const fs=require('fs'); const d=JSON.parse(fs.readFileSync('$SEED_TARGET','utf8')); console.log(d.products?.length || d.productCount || 0)" 2>/dev/null || echo "?")
fi

#===============================================================================
# Фаза 2: Seed в БД
#===============================================================================

# Проверяем что PostgreSQL доступен — если нет, запускаем Docker
DB_STARTED_BY_US=false
cleanup() {
  if [ "$DB_STARTED_BY_US" = true ]; then
    log "Останавливаю Docker-контейнеры..."
    (cd "$PROJECT_DIR" && docker compose -f docker/docker-compose.yml down) || true
    ok "Контейнеры остановлены"
  fi
}
trap cleanup EXIT
if ! pg_isready -h localhost -p 5432 -U postgres &>/dev/null; then
  if docker exec goldpc-postgres pg_isready -U postgres &>/dev/null 2>&1; then
    : # OK через docker
  else
    log "PostgreSQL не запущен. Запускаю Docker-контейнеры..."
    (cd "$PROJECT_DIR" && docker compose -f docker/docker-compose.yml up -d)
    DB_STARTED_BY_US=true
    # Ждём готовности PostgreSQL
    for i in $(seq 1 30); do
      if pg_isready -h localhost -p 5432 -U postgres &>/dev/null 2>&1 || \
         docker exec goldpc-postgres pg_isready -U postgres &>/dev/null 2>&1; then
        ok "PostgreSQL готов"
        break
      fi
      sleep 1
    done
    # Создаём БД если нужно
    (cd "$PROJECT_DIR" && docker compose -f docker/docker-compose.yml exec -T postgres psql -U postgres -tc "SELECT 1 FROM pg_database WHERE datname = 'goldpc_catalog'" | grep -q 1 || \
     docker compose -f docker/docker-compose.yml exec -T postgres psql -U postgres -c "CREATE DATABASE goldpc_catalog;" 2>/dev/null) || true
  fi
fi

CATALOG_DIR="$PROJECT_DIR/src/CatalogService"

log "Создаю атрибуты спецификаций из JSON..."
(cd "$CATALOG_DIR" && dotnet run -- backfill-spec-attributes 2>&1 | tail -2)
ok "backfill-spec-attributes завершён"

log "Импортирую товары в каталог..."
(cd "$CATALOG_DIR" && dotnet run -- seed-catalog 2>&1 | tail -3)
ok "seed-catalog завершён"

log "Определяю производителей..."
(cd "$CATALOG_DIR" && dotnet run -- backfill-manufacturers 2>&1 | tail -2)
ok "backfill-manufacturers завершён"

log "Синхронизирую пути к картинкам..."
(cd "$CATALOG_DIR" && dotnet run -- sync-image-paths-from-disk 2>&1 | tail -2)
ok "image paths синхронизированы"

log "Нормализую фильтры..."
(cd "$CATALOG_DIR" && dotnet run -- seed-filter-attributes 2>&1 | tail -2) || warn "seed-filter-attributes: пропущено (нет xcore-filter-attributes.json)"
ok "Фильтры обработаны"

log "Очищаю невалидные товары..."
(cd "$CATALOG_DIR" && dotnet run -- cleanup-invalid-products 2>&1 | tail -2)
ok "Очистка завершена"

#===============================================================================
# Готово
#===============================================================================
echo ""
echo -e "${GREEN}================================================${RESET}"
echo -e "${GREEN}   Seed завершён успешно!${RESET}"
echo -e "${GREEN}================================================${RESET}"
echo ""
echo "Товаров: $PRODUCT_COUNT"
echo "Логи: $LOG_DIR/"
echo ""
echo "Следующий шаг: ./scripts/dev-local.sh для запуска серверов"
