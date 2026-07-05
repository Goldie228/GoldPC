#!/bin/bash
#===============================================================================
# Скрипт миграции базы данных для проекта GoldPC
#===============================================================================
# Этот скрипт безопасно применяет миграции базы данных для микросервисов,
# используя Entity Framework Core с PostgreSQL.
#
# Использование: ./migrate.sh [ОПЦИИ]
#
# Опции:
#   -s, --service      Имя сервиса (CatalogService, OrdersService, и т.д.)
#   -e, --environment  Окружение (Development, Staging, Production)
#   -n, --no-backup    Пропустить создание резервной копии (НЕ РЕКОМЕНДУЕТСЯ для production)
#   -v, --verbose      Подробный вывод
#   -d, --dry-run      Показать, что будет сделано, без выполнения
#   -h, --help         Показать эту справку
#
# Требования:
#   - Клиентские инструменты PostgreSQL (pg_dump, psql)
#   - .NET SDK 8.0+
#   - Инструменты EF Core (dotnet-ef)
#
# Стратегия миграции с нулевым временем простоя:
#   Этот скрипт следует принципу обратно-совместимых миграций.
#   См. раздел "Стратегия миграции с нулевым временем простоя" ниже.
#===============================================================================

set -e  # Выход при ошибке
set -o pipefail  # Отлавливать ошибки в конвейерах

#-------------------------------------------------------------------------------
# Конфигурация
#-------------------------------------------------------------------------------

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
SRC_DIR="$PROJECT_ROOT/src"
BACKUP_DIR="$PROJECT_ROOT/backups"
LOG_DIR="$PROJECT_ROOT/logs"

# Значения по умолчанию
SERVICE_NAME=""
ENVIRONMENT="Development"
NO_BACKUP=false
VERBOSE=false
DRY_RUN=false
TIMEOUT=300  # 5 минут таймаут для миграций

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # Без цвета

#-------------------------------------------------------------------------------
# Стратегия миграции с нулевым временем простоя
#-------------------------------------------------------------------------------
#
# ВАЖНО: Для производственных баз данных следуйте этой многоэтапной стратегии,
# чтобы избежать простоя при изменениях схемы:
#
# Фаза 1: Добавление столбца (обратно совместимо)
# ──────────────────────────────────────────
#   migrationBuilder.AddColumn<string>(
#       "NewColumn",
#       "Orders",
#       nullable: true);  // ОБЯЗАТЕЛЬНО должно быть nullable!
#
#   ✓ Приложение продолжает работать со старым кодом
#   ✓ Старый код игнорирует новый столбец
#   ✓ Новый код может использовать столбец (обрабатывая null)
#
# Фаза 2: Развёртывание кода приложения
# ──────────────────────────────────────────
#   public class Order
#   {
#       public string? NewColumn { get; set; }  // Nullable в коде
#
#       public string GetNewColumnSafe() => NewColumn ?? "default";
#   }
#
#   ✓ Развернуть новую версию приложения
#   ✓ Проверить отсутствие ошибок в логах
#   ✓ Мониторить на предмет проблем
#
# Фаза 3: Заполнение данных (фоновая задача)
# ──────────────────────────────────────────
#   -- Выполнять пакетами в часы низкой нагрузки
#   UPDATE Orders SET NewColumn = 'default'
#   WHERE NewColumn IS NULL
#   AND id BETWEEN 1 AND 10000;
#
#   -- Или использовать фоновый job/сервис
#   ✓ Избегать блокировки всей таблицы
#   ✓ Обрабатывать небольшими пакетами
#   ✓ Мониторить влияние на производительность
#
# Фаза 4: Сделать NOT NULL (финальная миграция)
# ──────────────────────────────────────────
#   -- Только после заполнения ВСЕХ данных
#   migrationBuilder.AlterColumn<string>(
#       "NewColumn",
#       "Orders",
#       nullable: false);
#
#   ✓ Требует значения для всех строк
#   ✓ Создаёт ограничение CHECK
#   ✓ Теперь полностью обеспечивается на уровне БД
#
# Критические изменения (требуют координации):
# ──────────────────────────────────────────
#   - Удаление столбцов: сначала развернуть код, не использующий столбец
#   - Переименование столбцов: создать новый, перенести данные, обновить код, удалить старый
#   - Изменение типов данных: создать новый столбец, перенести, обновить код, поменять имена
#
# См.: development-plan/11-deployment.md Раздел 11.4 для подробностей.
#------------------------------------------------------------------------------

#-------------------------------------------------------------------------------
# Вспомогательные функции
#-------------------------------------------------------------------------------

log_info() {
    echo -e "${CYAN}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

log_debug() {
    if [[ "$VERBOSE" == true ]]; then
        echo -e "${BLUE}[DEBUG]${NC} $1"
    fi
}

show_help() {
    cat << EOF
Скрипт миграции базы данных для проекта GoldPC

Использование: $(basename "$0") [ОПЦИИ]

Опции:
  -s, --service      Имя сервиса (обязательно)
                     Доступные: CatalogService, OrdersService, AuthService,
                                PCBuilderService, WarrantyService
  -e, --environment  Окружение (по умолчанию: Development)
                     Варианты: Development, Staging, Production
  -n, --no-backup    Пропустить создание резервной копии (НЕ РЕКОМЕНДУЕТСЯ для production)
  -v, --verbose      Подробный вывод
  -d, --dry-run      Показать, что будет сделано, без выполнения
  -h, --help         Показать эту справку

Примеры:
  # Применить миграции для CatalogService в Development
  $(basename "$0") -s CatalogService

  # Применить миграции для OrdersService в Production с подробным выводом
  $(basename "$0") -s OrdersService -e Production -v

  # Пробный прогон, чтобы увидеть, что произойдёт
  $(basename "$0") -s CatalogService --dry-run

Стратегия миграции с нулевым временем простоя:
  Этот скрипт поддерживает обратно-совместимые миграции. Для production
  развёртываний следуйте многофазной стратегии, описанной в заголовке скрипта
  и в development-plan/11-deployment.md Раздел 11.4.

Переменные окружения:
  DATABASE_URL        Полный URL подключения к PostgreSQL
  DB_HOST            Хост базы данных (по умолчанию: localhost)
  DB_PORT            Порт базы данных (по умолчанию: 5432)
  DB_NAME            Имя базы данных
  DB_USER            Пользователь базы данных
  DB_PASSWORD        Пароль базы данных
  DB_CONNECTION_STRING  Полная строка подключения (альтернатива отдельным переменным)

EOF
}

check_prerequisites() {
    log_info "Проверка предварительных требований..."

    local missing_tools=()

    # Проверка dotnet
    if ! command -v dotnet &> /dev/null; then
        missing_tools+=("dotnet")
    fi

    # Проверка инструмента dotnet-ef
    if ! dotnet ef --version &> /dev/null 2>&1; then
        log_warning "Инструмент dotnet-ef не найден. Установка..."
        dotnet tool install --global dotnet-ef 2>/dev/null || {
            missing_tools+=("dotnet-ef")
        }
    fi

    # Проверка инструментов PostgreSQL (только если нужна резервная копия)
    if [[ "$NO_BACKUP" == false ]]; then
        if ! command -v pg_dump &> /dev/null; then
            missing_tools+=("pg_dump (postgresql-client)")
        fi

        if ! command -v psql &> /dev/null; then
            missing_tools+=("psql (postgresql-client)")
        fi
    fi

    if [[ ${#missing_tools[@]} -gt 0 ]]; then
        log_error "Отсутствуют необходимые инструменты: ${missing_tools[*]}"
        log_info "Пожалуйста, установите недостающие инструменты и повторите попытку."
        exit 1
    fi

    log_success "Все предварительные требования выполнены"
}

validate_service() {
    local service="$1"
    local valid_services=(
        "CatalogService"
        "OrdersService"
        "AuthService"
        "PCBuilderService"
        "WarrantyService"
    )

    for valid in "${valid_services[@]}"; do
        if [[ "$service" == "$valid" ]]; then
            return 0
        fi
    done

    log_error "Недопустимый сервис: $service"
    log_info "Допустимые сервисы: ${valid_services[*]}"
    return 1
}

get_connection_string() {
    local service="$1"
    local env="$2"

    # Сначала пробуем переменную окружения
    if [[ -n "$DB_CONNECTION_STRING" ]]; then
        echo "$DB_CONNECTION_STRING"
        return 0
    fi

    # Пробуем DATABASE_URL (распространённый формат: postgresql://user:pass@host:port/db)
    if [[ -n "$DATABASE_URL" ]]; then
        # Конвертируем DATABASE_URL в формат строки подключения
        # postgresql://user:pass@host:port/db -> Host=host;Port=port;Database=db;Username=user;Password=pass
        local parsed_url
        parsed_url=$(echo "$DATABASE_URL" | sed -E 's|postgresql://([^:]+):([^@]+)@([^:]+):([0-9]+)/(.+)|Host=\3;Port=\4;Database=\5;Username=\1;Password=\2|')
        echo "$parsed_url"
        return 0
    fi

    # Собираем из отдельных компонентов
    local host="${DB_HOST:-localhost}"
    local port="${DB_PORT:-5432}"
    local db_name="${DB_NAME:-goldpc_${service,,}}"  # Имя сервиса в нижнем регистре
    local user="${DB_USER:-goldpc}"
    local password="${DB_PASSWORD:-}"

    if [[ -n "$password" ]]; then
        echo "Host=$host;Port=$port;Database=$db_name;Username=$user;Password=$password"
    else
        echo "Host=$host;Port=$port;Database=$db_name;Username=$user"
    fi
}

get_db_version() {
    local conn_string="$1"

    log_debug "Запрос версии базы данных..."

    # Парсим строку подключения для psql
    local host port db_name user password

    # Извлекаем компоненты из строки подключения
    host=$(echo "$conn_string" | grep -oP 'Host=\K[^;]+' || echo "localhost")
    port=$(echo "$conn_string" | grep -oP 'Port=\K[^;]+' || echo "5432")
    db_name=$(echo "$conn_string" | grep -oP 'Database=\K[^;]+' || echo "postgres")
    user=$(echo "$conn_string" | grep -oP 'Username=\K[^;]+' || echo "postgres")
    password=$(echo "$conn_string" | grep -oP 'Password=\K[^;+' || echo "")

    # Экспортируем пароль для psql
    export PGPASSWORD="$password"

    # Проверяем, существует ли таблица __EFMigrationsHistory
    local table_exists
    table_exists=$(psql -h "$host" -p "$port" -U "$user" -d "$db_name" -t -c \
        "SELECT EXISTS (
            SELECT FROM information_schema.tables
            WHERE table_schema = 'public'
            AND table_name = '__EFMigrationsHistory'
        );" 2>/dev/null | tr -d '[:space:]')

    if [[ "$table_exists" != "t" ]]; then
        echo "НЕТ (миграции не применялись)"
        return 0
    fi

    # Получаем последнюю применённую миграцию
    local latest_migration
    latest_migration=$(psql -h "$host" -p "$port" -U "$user" -d "$db_name" -t -c \
        "SELECT MigrationId FROM __EFMigrationsHistory ORDER BY MigrationId DESC LIMIT 1;" 2>/dev/null | tr -d '[:space:]')

    echo "${latest_migration:-НЕТ}"

    # Сбрасываем пароль
    unset PGPASSWORD
}

create_backup() {
    local conn_string="$1"
    local service="$2"
    local timestamp
    timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_file="$BACKUP_DIR/${service}_${timestamp}.sql"

    # Убеждаемся, что директория для резервных копий существует
    mkdir -p "$BACKUP_DIR"

    log_info "Создание резервной копии базы данных..."
    log_debug "Файл резервной копии: $backup_file"

    # Парсим строку подключения для pg_dump
    local host port db_name user password

    host=$(echo "$conn_string" | grep -oP 'Host=\K[^;]+' || echo "localhost")
    port=$(echo "$conn_string" | grep -oP 'Port=\K[^;]+' || echo "5432")
    db_name=$(echo "$conn_string" | grep -oP 'Database=\K[^;]+' || echo "postgres")
    user=$(echo "$conn_string" | grep -oP 'Username=\K[^;]+' || echo "postgres")
    password=$(echo "$conn_string" | grep -oP 'Password=\K[^;]+' || echo "")

    # Экспортируем пароль для pg_dump
    export PGPASSWORD="$password"

    if pg_dump -h "$host" -p "$port" -U "$user" -d "$db_name" -F p -f "$backup_file" 2>/dev/null; then
        local size
        size=$(du -h "$backup_file" | cut -f1)
        log_success "Резервная копия создана: $backup_file ($size)"
        echo "$backup_file"
    else
        log_error "Не удалось создать резервную копию"
        unset PGPASSWORD
        return 1
    fi

    unset PGPASSWORD
}

get_pending_migrations() {
    local service="$1"
    local project_path="$SRC_DIR/$service"

    log_debug "Проверка ожидающих миграций в $service..."

    # Переходим в проект и проверяем миграции
    cd "$project_path" 2>/dev/null || {
        log_error "Директория сервиса не найдена: $project_path"
        return 1
    }

    # Получаем список миграций и их статус
    local output
    output=$(dotnet ef migrations list --no-color 2>&1) || {
        log_error "Не удалось получить список миграций"
        cd "$PROJECT_ROOT"
        return 1
    }

    cd "$PROJECT_ROOT"

    # Считаем ожидающие миграции (строки, не содержащие "(Applied)")
    local pending
    pending=$(echo "$output" | grep -v "Applied" | grep -c "^[0-9]")

    echo "$pending"
}

apply_migrations() {
    local service="$1"
    local project_path="$SRC_DIR/$service"

    log_info "Применение миграций для $service..."

    cd "$project_path" 2>/dev/null || {
        log_error "Директория сервиса не найдена: $project_path"
        return 1
    }

    # Применяем миграции с таймаутом
    log_debug "Выполнение: dotnet ef database update"

    local result
    if result=$(timeout "$TIMEOUT" dotnet ef database update --no-color 2>&1); then
        cd "$PROJECT_ROOT"
        if echo "$result" | grep -q "Done\|already up to date"; then
            log_success "Миграции успешно применены"
            return 0
        else
            log_error "Вывод миграции указывает на ошибку: $result"
            return 1
        fi
    else
        cd "$PROJECT_ROOT"
        log_error "Миграция не удалась или превышен таймаут"
        log_debug "$result"
        return 1
    fi
}

verify_migration() {
    local conn_string="$1"
    local service="$2"

    log_info "Проверка успешности миграции..."

    # Получаем новую версию БД
    local new_version
    new_version=$(get_db_version "$conn_string")

    # Проверяем доступность базы данных
    local host port db_name user password
    host=$(echo "$conn_string" | grep -oP 'Host=\K[^;]+' || echo "localhost")
    port=$(echo "$conn_string" | grep -oP 'Port=\K[^;]+' || echo "5432")
    db_name=$(echo "$conn_string" | grep -oP 'Database=\K[^;]+' || echo "postgres")
    user=$(echo "$conn_string" | grep -oP 'Username=\K[^;]+' || echo "postgres")
    password=$(echo "$conn_string" | grep -oP 'Password=\K[^;]+' || echo "")

    export PGPASSWORD="$password"

    # Проверяем таблицу __EFMigrationsHistory
    local table_check
    table_check=$(psql -h "$host" -p "$port" -U "$user" -d "$db_name" -t -c \
        "SELECT COUNT(*) FROM __EFMigrationsHistory;" 2>/dev/null | tr -d '[:space:]')

    unset PGPASSWORD

    if [[ "$table_check" -gt 0 ]] 2>/dev/null; then
        log_success "Проверка пройдена: записано $table_check миграций"
        log_info "Текущая версия БД: $new_version"
        return 0
    else
        log_error "Проверка не пройдена: миграции не найдены в истории"
        return 1
    fi
}

cleanup_old_backups() {
    local keep_count=${1:-10}

    log_debug "Очистка старых резервных копий (оставить последние $keep_count)..."

    if [[ -d "$BACKUP_DIR" ]]; then
        ls -t "$BACKUP_DIR"/*.sql 2>/dev/null | tail -n +"$((keep_count + 1))" | while read -r file; do
            log_debug "Удаление старой резервной копии: $file"
            rm -f "$file"
        done
    fi
}

#-------------------------------------------------------------------------------
# Основной скрипт
#-------------------------------------------------------------------------------

parse_arguments() {
    while [[ $# -gt 0 ]]; do
        case "$1" in
            -s|--service)
                SERVICE_NAME="$2"
                shift 2
                ;;
            -e|--environment)
                ENVIRONMENT="$2"
                shift 2
                ;;
            -n|--no-backup)
                NO_BACKUP=true
                shift
                ;;
            -v|--verbose)
                VERBOSE=true
                shift
                ;;
            -d|--dry-run)
                DRY_RUN=true
                shift
                ;;
            -h|--help)
                show_help
                exit 0
                ;;
            *)
                log_error "Неизвестная опция: $1"
                show_help
                exit 1
                ;;
        esac
    done
}

main() {
    local start_time
    start_time=$(date +%s)

    echo ""
    echo "========================================"
    echo "  GoldPC — Скрипт миграции базы данных"
    echo "========================================"
    echo ""

    # Проверка обязательных аргументов
    if [[ -z "$SERVICE_NAME" ]]; then
        log_error "Требуется имя сервиса. Используйте опцию -s или --service."
        show_help
        exit 1
    fi

    # Проверка имени сервиса
    if ! validate_service "$SERVICE_NAME"; then
        exit 1
    fi

    log_info "Сервис: $SERVICE_NAME"
    log_info "Окружение: $ENVIRONMENT"
    log_info "Время: $(date '+%Y-%m-%d %H:%M:%S')"

    if [[ "$DRY_RUN" == true ]]; then
        log_warning "РЕЖИМ ПРОБНОГО ПРОГОНА — изменения не будут внесены"
    fi

    # Проверка предварительных требований
    check_prerequisites

    # Получение строки подключения
    local conn_string
    conn_string=$(get_connection_string "$SERVICE_NAME" "$ENVIRONMENT")
    log_debug "Строка подключения: ${conn_string//Password=*/Password=***}"

    # Шаг 1: Проверка текущей версии БД
    echo ""
    log_info "=== Шаг 1: Проверка текущей версии базы данных ==="

    if [[ "$DRY_RUN" == true ]]; then
        log_info "[ПРОБНЫЙ ПРОГОН] Будет проверена версия базы данных"
    else
        local current_version
        current_version=$(get_db_version "$conn_string")
        log_info "Текущая версия БД: $current_version"
    fi

    # Шаг 2: Проверка ожидающих миграций
    echo ""
    log_info "=== Шаг 2: Проверка ожидающих миграций ==="

    if [[ "$DRY_RUN" == true ]]; then
        log_info "[ПРОБНЫЙ ПРОГОН] Будет произведена проверка ожидающих миграций"
    else
        local pending
        pending=$(get_pending_migrations "$SERVICE_NAME")

        if [[ "$pending" -eq 0 ]]; then
            log_success "Ожидающие миграции не найдены"
            log_info "База данных актуальна"
            exit 0
        fi

        log_info "Найдено $pending ожидающих миграций"
    fi

    # Шаг 3: Создание резервной копии (если не пропущено и не пробный прогон)
    echo ""
    log_info "=== Шаг 3: Создание резервной копии ==="

    local backup_file=""
    if [[ "$NO_BACKUP" == true ]]; then
        log_warning "Резервная копия пропущена (флаг --no-backup)"
    elif [[ "$DRY_RUN" == true ]]; then
        log_info "[ПРОБНЫЙ ПРОГОН] Будет создана резервная копия базы данных"
    else
        if [[ "$ENVIRONMENT" == "Production" ]]; then
            log_warning "Создание резервной копии для окружения Production"
        fi
        backup_file=$(create_backup "$conn_string" "$SERVICE_NAME") || {
            log_error "Не удалось создать резервную копию. Прерывание миграции."
            exit 1
        }
    fi

    # Шаг 4: Применение миграций
    echo ""
    log_info "=== Шаг 4: Применение миграций ==="

    if [[ "$DRY_RUN" == true ]]; then
        log_info "[ПРОБНЫЙ ПРОГОН] Будут применены миграции: dotnet ef database update"
    else
        if ! apply_migrations "$SERVICE_NAME"; then
            log_error "Миграция не удалась!"

            if [[ -n "$backup_file" && -f "$backup_file" ]]; then
                log_warning "Резервная копия доступна: $backup_file"
                log_warning "Для восстановления выполните: psql $conn_string < $backup_file"
            fi

            exit 1
        fi
    fi

    # Шаг 5: Проверка успешности
    echo ""
    log_info "=== Шаг 5: Проверка успешности миграции ==="

    if [[ "$DRY_RUN" == true ]]; then
        log_info "[ПРОБНЫЙ ПРОГОН] Будет выполнена проверка миграции"
    else
        if ! verify_migration "$conn_string" "$SERVICE_NAME"; then
            log_error "Проверка не пройдена!"
            exit 1
        fi
    fi

    # Очистка старых резервных копий
    cleanup_old_backups 10

    # Итог
    local end_time duration
    end_time=$(date +%s)
    duration=$((end_time - start_time))

    echo ""
    echo "========================================"
    log_success "Миграция успешно завершена!"
    echo "========================================"
    log_info "Длительность: ${duration}с"
    log_info "Сервис: $SERVICE_NAME"
    log_info "Окружение: $ENVIRONMENT"

    if [[ -n "$backup_file" ]]; then
        log_info "Резервная копия: $backup_file"
    fi

    echo ""
    log_info "Следующие шаги:"
    echo "  1. Проверьте логи приложения на наличие ошибок"
    echo "  2. Проверьте функциональность приложения"
    echo "  3. Для production: следуйте стратегии миграции с нулевым временем простоя"
    echo ""

    return 0
}

# Запуск основной функции со всеми аргументами
parse_arguments "$@"
main
