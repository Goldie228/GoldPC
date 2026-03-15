#!/bin/bash
#
# sync-workspace.sh - Синхронизация рабочего пространства агента
#
# Назначение: Обновляет рабочее пространство агента до актуального состояния:
#             - Pull последних изменений из origin/main
#             - Обновление контрактов (contracts/)
#             - Установка зависимостей (npm install / dotnet restore)
#
# Использование:
#   ./sync-workspace.sh              # Полная синхронизация
#   ./sync-workspace.sh --quick      # Только git pull (без зависимостей)
#   ./sync-workspace.sh --contracts  # Только обновление контрактов
#   ./sync-workspace.sh --deps       # Только установка зависимостей
#
# Раздел документации: development-plan/05-parallel-development.md (Section 5.5)
#

set -e

# ============================================================================
# КОНФИГУРАЦИЯ
# ============================================================================

# Основная ветка для синхронизации
MAIN_BRANCH="${MAIN_BRANCH:-main}"

# Директория с контрактами
CONTRACTS_DIR="contracts"

# Таймаут для операций (в секундах)
TIMEOUT="${TIMEOUT:-300}"

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# ============================================================================
# ФУНКЦИИ
# ============================================================================

# Вывод информационного сообщения
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

# Вывод сообщения об успехе
log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

# Вывод предупреждения
log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Вывод сообщения об ошибке
log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Вывод шага
log_step() {
    echo -e "${CYAN}[STEP]${NC} $1"
}

# Проверка наличия git
check_git() {
    if ! command -v git &> /dev/null; then
        log_error "Git не установлен"
        exit 1
    fi
    
    if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
        log_error "Не найден git репозиторий"
        exit 1
    fi
}

# Получить корневую директорию git репозитория
get_git_root() {
    git rev-parse --show-toplevel
}

# Проверить наличие незакоммиченных изменений
has_uncommitted_changes() {
    ! git diff-index --quiet HEAD -- 2>/dev/null
}

# Pull изменений из origin/main
sync_git() {
    log_step "Синхронизация Git репозитория..."
    
    local git_root=$(get_git_root)
    cd "$git_root"
    
    # Проверяем наличие remote origin
    if ! git remote | grep -q "^origin$"; then
        log_warning "Remote 'origin' не найден, пропускаем pull"
        return 0
    fi
    
    # Получаем текущую ветку
    local current_branch=$(git branch --show-current)
    log_info "Текущая ветка: ${current_branch}"
    
    # Проверяем наличие незакоммиченных изменений
    if has_uncommitted_changes; then
        log_warning "Обнаружены незакоммиченные изменения!"
        log_info "Изменённые файлы:"
        git status --short
        echo ""
        log_warning "Рекомендуется закоммитить или спрятать изменения перед синхронизацией"
        read -p "Продолжить? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log_info "Синхронизация отменена"
            exit 0
        fi
    fi
    
    # Fetch всех изменений
    log_info "Получение изменений из remote..."
    git fetch --all --quiet 2>/dev/null || git fetch --all
    
    # Определяем ветку для pull
    local target_branch="${MAIN_BRANCH}"
    if ! git rev-parse --verify "origin/${target_branch}" >/dev/null 2>&1; then
        # Пробуем develop если main не существует
        if git rev-parse --verify "origin/develop" >/dev/null 2>&1; then
            target_branch="develop"
            log_info "Используем ветку develop (main не найдена)"
        fi
    fi
    
    # Если мы на главной ветке - делаем pull
    if [[ "$current_branch" == "$target_branch" ]]; then
        log_info "Pull изменений в ${target_branch}..."
        git pull --rebase origin "${target_branch}" 2>/dev/null || {
            log_warning "Конфликт при rebase, пробуем merge..."
            git rebase --abort 2>/dev/null || true
            git pull origin "${target_branch}"
        }
    else
        log_info "Текущая ветка отличается от ${target_branch}"
        log_info "Rebase на origin/${target_branch}..."
        git rebase "origin/${target_branch}" 2>/dev/null || {
            log_warning "Конфликт при rebase!"
            log_info "Разрешите конфликты и продолжите работу"
            exit 1
        }
    fi
    
    log_success "Git синхронизация завершена"
}

# Обновление контрактов из main ветки
sync_contracts() {
    log_step "Обновление контрактов..."
    
    local git_root=$(get_git_root)
    local contracts_path="${git_root}/${CONTRACTS_DIR}"
    
    if [[ ! -d "$contracts_path" ]]; then
        log_warning "Директория контрактов не найдена: ${contracts_path}"
        return 0
    fi
    
    # Проверяем, есть ли изменения в contracts/ в origin/main
    local has_contract_changes
    has_contract_changes=$(git diff HEAD origin/${MAIN_BRANCH} --name-only -- "${CONTRACTS_DIR}/" 2>/dev/null | head -1)
    
    if [[ -n "$has_contract_changes" ]]; then
        log_info "Обнаружены изменения в контрактах, обновляем..."
        git checkout "origin/${MAIN_BRANCH}" -- "${CONTRACTS_DIR}/" 2>/dev/null || {
            log_warning "Не удалось обновить контракты автоматически"
            log_info "Попробуйте: git checkout origin/${MAIN_BRANCH} -- ${CONTRACTS_DIR}/"
        }
        log_success "Контракты обновлены"
    else
        log_info "Контракты актуальны"
    fi
    
    # Проверяем наличие OpenAPI спецификаций
    local openapi_dir="${contracts_path}/openapi"
    if [[ -d "$openapi_dir" ]]; then
        local spec_count=$(find "$openapi_dir" -name "*.yaml" -o -name "*.yml" -o -name "*.json" 2>/dev/null | wc -l)
        log_info "Найдено ${spec_count} OpenAPI спецификаций"
    fi
    
    # Проверяем наличие Pact файлов
    local pacts_dir="${contracts_path}/pacts"
    if [[ -d "$pacts_dir" ]]; then
        local pact_count=$(find "$pacts_dir" -name "*.json" 2>/dev/null | wc -l)
        log_info "Найдено ${pact_count} Pact файлов"
    fi
}

# Обновление сабмодулей (если есть)
sync_submodules() {
    log_step "Проверка сабмодулей..."
    
    local git_root=$(get_git_root)
    cd "$git_root"
    
    if [[ -f ".gitmodules" ]]; then
        log_info "Обновление сабмодулей..."
        git submodule update --init --recursive --remote
        log_success "Сабмодули обновлены"
    else
        log_info "Сабмодули не найдены"
    fi
}

# Установка npm зависимостей
install_npm_deps() {
    log_step "Установка npm зависимостей..."
    
    local git_root=$(get_git_root)
    
    # Проверяем наличие package.json в корне
    if [[ -f "${git_root}/package.json" ]]; then
        log_info "Установка зависимостей в корне проекта..."
        cd "$git_root"
        
        if [[ -f "package-lock.json" ]]; then
            npm ci --quiet 2>/dev/null || npm install
        else
            npm install
        fi
        
        log_success "Зависимости корня установлены"
    fi
    
    # Проверяем frontend директорию
    local frontend_dirs=(
        "${git_root}/src/frontend"
        "${git_root}/frontend"
        "${git_root}/packages/frontend"
    )
    
    for frontend_dir in "${frontend_dirs[@]}"; do
        if [[ -d "$frontend_dir" && -f "${frontend_dir}/package.json" ]]; then
            log_info "Установка зависимостей frontend: ${frontend_dir}"
            cd "$frontend_dir"
            
            if [[ -f "package-lock.json" ]]; then
                npm ci --quiet 2>/dev/null || npm install
            else
                npm install
            fi
            
            log_success "Frontend зависимости установлены"
            break
        fi
    done
}

# Установка .NET зависимостей
install_dotnet_deps() {
    log_step "Восстановление .NET пакетов..."
    
    local git_root=$(get_git_root)
    cd "$git_root"
    
    # Ищем solution файл
    local sln_file
    sln_file=$(find . -maxdepth 3 -name "*.sln" -type f | head -1)
    
    if [[ -n "$sln_file" ]]; then
        log_info "Восстановление пакетов для: ${sln_file}"
        dotnet restore "$sln_file" --verbosity quiet
        log_success ".NET пакеты восстановлены"
    else
        # Ищем все csproj файлы
        local csproj_count=$(find . -name "*.csproj" -type f | wc -l)
        if [[ "$csproj_count" -gt 0 ]]; then
            log_info "Восстановление пакетов для ${csproj_count} проектов..."
            find . -name "*.csproj" -type f -exec dotnet restore {} --verbosity quiet \;
            log_success ".NET пакеты восстановлены"
        else
            log_info ".NET проекты не найдены"
        fi
    fi
    
    # Проверяем наличие tool manifest и восстанавливаем инструменты
    if [[ -f "${git_root}/.config/dotnet-tools.json" ]]; then
        log_info "Восстановление .NET инструментов..."
        dotnet tool restore
    fi
}

# Установка всех зависимостей
install_dependencies() {
    log_step "Установка зависимостей..."
    
    # Проверяем наличие npm
    if command -v npm &> /dev/null; then
        install_npm_deps
    else
        log_warning "npm не установлен, пропускаем npm зависимости"
    fi
    
    # Проверяем наличие dotnet
    if command -v dotnet &> /dev/null; then
        install_dotnet_deps
    else
        log_warning "dotnet не установлен, пропускаем .NET зависимости"
    fi
    
    log_success "Все зависимости установлены"
}

# Валидация окружения после синхронизации
validate_environment() {
    log_step "Валидация окружения..."
    
    local git_root=$(get_git_root)
    local issues=0
    
    # Проверяем наличие ключевых директорий
    local required_dirs=("contracts" "src" "docker")
    for dir in "${required_dirs[@]}"; do
        if [[ ! -d "${git_root}/${dir}" ]]; then
            log_warning "Отсутствует директория: ${dir}"
            ((issues++))
        fi
    done
    
    # Проверяем наличие контрактов
    if [[ -d "${git_root}/${CONTRACTS_DIR}/openapi" ]]; then
        local openapi_count=$(find "${git_root}/${CONTRACTS_DIR}/openapi" -name "*.yaml" -o -name "*.yml" 2>/dev/null | wc -l)
        if [[ "$openapi_count" -eq 0 ]]; then
            log_warning "Не найдены OpenAPI спецификации"
            ((issues++))
        fi
    fi
    
    # Проверяем git статус
    if has_uncommitted_changes; then
        log_warning "Есть незакоммиченные изменения"
    fi
    
    if [[ $issues -eq 0 ]]; then
        log_success "Окружение валидно"
    else
        log_warning "Обнаружено ${issues} проблем с окружением"
    fi
}

# Показать справку
show_help() {
    cat << EOF
Использование: $0 [ОПЦИИ]

Скрипт синхронизации рабочего пространства для параллельной разработки.
Обновляет код, контракты и зависимости до актуального состояния.

Опции:
  -q, --quick       Быстрая синхронизация (только git pull)
  -c, --contracts   Обновить только контракты
  -d, --deps        Установить только зависимости
  -v, --validate    Валидация окружения без изменений
  -h, --help        Показать эту справку

Переменные окружения:
  MAIN_BRANCH       Основная ветка для синхронизации (по умолчанию: main)
  TIMEOUT           Таймаут операций в секундах (по умолчанию: 300)

Примеры:
  $0                    # Полная синхронизация
  $0 --quick            # Только git pull
  $0 --contracts        # Обновить контракты
  $0 --deps             # Установить зависимости
  $0 --validate         # Проверить окружение

Рекомендуемый workflow для агентов:
  1. Начало дня:     $0
  2. Перед задачей:  $0 --contracts
  3. После rebase:   $0 --deps

EOF
}

# ============================================================================
# ГЛАВНАЯ ЛОГИКА
# ============================================================================

main() {
    local mode="full"
    
    # Парсинг аргументов
    while [[ $# -gt 0 ]]; do
        case $1 in
            -q|--quick)
                mode="quick"
                shift
                ;;
            -c|--contracts)
                mode="contracts"
                shift
                ;;
            -d|--deps)
                mode="deps"
                shift
                ;;
            -v|--validate)
                mode="validate"
                shift
                ;;
            -h|--help)
                show_help
                exit 0
                ;;
            *)
                log_error "Неизвестный аргумент: $1"
                show_help
                exit 1
                ;;
        esac
    done
    
    echo ""
    echo "========================================"
    echo "   🔄 Синхронизация рабочего пространства"
    echo "========================================"
    echo ""
    
    # Проверка git
    check_git
    
    local git_root=$(get_git_root)
    cd "$git_root"
    
    case $mode in
        quick)
            sync_git
            ;;
        contracts)
            sync_git
            sync_contracts
            sync_submodules
            ;;
        deps)
            install_dependencies
            ;;
        validate)
            validate_environment
            ;;
        full)
            sync_git
            sync_submodules
            sync_contracts
            install_dependencies
            validate_environment
            ;;
    esac
    
    echo ""
    log_success "=========================================="
    log_success "   ✅ Синхронизация завершена успешно!"
    log_success "=========================================="
    echo ""
    
    # Показываем статус
    log_info "Текущий статус:"
    echo "  Ветка:    $(git branch --show-current)"
    echo "  Commit:   $(git log -1 --oneline)"
    echo "  Статус:   $(git status --short | wc -l) изменённых файлов"
    echo ""
}

main "$@"