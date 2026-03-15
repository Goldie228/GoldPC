#!/bin/bash
#
# setup-worktrees.sh - Создание Git worktrees для параллельной разработки
#
# Назначение: Создаёт изолированные рабочие пространства (worktrees) для
#             параллельной работы нескольких агентов/разработчиков.
#
# Использование:
#   ./setup-worktrees.sh              # Создать все worktrees по умолчанию
#   ./setup-worktrees.sh --agent a    # Создать только worktree для агента A
#   ./setup-worktrees.sh --list       # Показать существующие worktrees
#
# Раздел документации: development-plan/03-environment-setup.md (Section 3.2)
#
# Правила работы с worktree:
#   - Одна задача — одна ветка: каждый worktree работает в своей feature-ветке
#   - Регулярный rebase: ежедневное обновление из develop
#   - Не коммитить в main: все изменения через PR
#   - Очистка после слияния: удаление worktree после merge PR
#

set -e

# ============================================================================
# КОНФИГУРАЦИЯ
# ============================================================================

# Базовая директория для worktrees (относительно корня репозитория)
WORKTREES_DIR="worktrees"

# Базовая ветка для создания feature-веток
BASE_BRANCH="${BASE_BRANCH:-develop}"

# Определение агентов и их веток
# Формат: "имя_агента:feature-ветка:описание"
declare -a AGENTS=(
    "agent-a:feature/frontend-development:Frontend разработка"
    "agent-b:feature/catalog-api:Catalog API (Backend)"
    "agent-c:feature/orders-api:Orders API (Backend)"
    "agent-d:feature/integration-tests:Интеграционные тесты"
    "agent-e:feature/infrastructure-setup:Инфраструктура"
)

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

# Получить корневую директорию git репозитория
get_git_root() {
    git rev-parse --show-toplevel
}

# Проверить, существует ли ветка
branch_exists() {
    git rev-parse --verify "$1" >/dev/null 2>&1
}

# Проверить, существует ли worktree
worktree_exists() {
    git worktree list | grep -q "$1"
}

# Создать один worktree
create_worktree() {
    local agent_name="$1"
    local branch_name="$2"
    local description="$3"
    local worktree_path="${WORKTREES_DIR}/${agent_name}"
    local git_root=$(get_git_root)
    
    log_info "Создание worktree: ${agent_name} (${description})"
    
    # Проверяем, существует ли уже worktree
    if worktree_exists "${git_root}/${worktree_path}"; then
        log_warning "Worktree '${agent_name}' уже существует. Пропускаем..."
        return 0
    fi
    
    # Создаём директорию для worktrees, если не существует
    mkdir -p "${git_root}/${WORKTREES_DIR}"
    
    # Создаём ветку, если не существует
    if ! branch_exists "${branch_name}"; then
        log_info "Создание новой ветки: ${branch_name}"
        git branch "${branch_name}" origin/${BASE_BRANCH} 2>/dev/null || \
        git branch "${branch_name}" ${BASE_BRANCH}
    fi
    
    # Создаём worktree
    git worktree add "${git_root}/${worktree_path}" "${branch_name}"
    
    log_success "Worktree '${agent_name}' создан: ${worktree_path}"
}

# Показать список существующих worktrees
list_worktrees() {
    log_info "Существующие worktrees:"
    echo ""
    git worktree list
    echo ""
    
    log_info "Доступные агенты:"
    for agent in "${AGENTS[@]}"; do
        IFS=':' read -r name branch desc <<< "$agent"
        echo "  - ${name}: ${desc} (ветка: ${branch})"
    done
}

# Показать справку
show_help() {
    cat << EOF
Использование: $0 [ОПЦИИ]

Опции:
  -a, --agent NAME    Создать worktree только для указанного агента
                      (например: -a agent-a)
  -l, --list          Показать список существующих worktrees
  -h, --help          Показать эту справку

Переменные окружения:
  BASE_BRANCH         Базовая ветка для создания feature-веток
                      (по умолчанию: develop)

Примеры:
  $0                          # Создать все worktrees
  $0 --agent agent-a          # Создать только для Frontend
  $0 --agent agent-b          # Создать только для Catalog API
  $0 --list                   # Показать список worktrees

Синхронизация worktrees:
  # Обновление из develop в worktree
  cd worktrees/agent-a
  git fetch origin
  git rebase origin/develop

  # Возврат изменений в основной репозиторий
  cd worktrees/agent-a
  git push origin feature/frontend-development

Очистка worktrees:
  # Удаление worktree после завершения работы
  git worktree remove worktrees/agent-a
  
  # Или используйте скрипт clean-worktrees.sh
  ./scripts/clean-worktrees.sh

EOF
}

# ============================================================================
# ГЛАВНАЯ ЛОГИКА
# ============================================================================

main() {
    local specific_agent=""
    local action="create"
    
    # Парсинг аргументов
    while [[ $# -gt 0 ]]; do
        case $1 in
            -a|--agent)
                specific_agent="$2"
                shift 2
                ;;
            -l|--list)
                action="list"
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
    
    # Проверяем, что мы в git репозитории
    if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
        log_error "Не найден git репозиторий"
        exit 1
    fi
    
    # Обновляем remote информацию
    log_info "Обновление информации о remote..."
    git fetch --all --quiet 2>/dev/null || true
    
    case $action in
        list)
            list_worktrees
            ;;
        create)
            if [[ -n "$specific_agent" ]]; then
                # Создаём worktree для конкретного агента
                local found=false
                for agent in "${AGENTS[@]}"; do
                    IFS=':' read -r name branch desc <<< "$agent"
                    if [[ "$name" == "$specific_agent" ]]; then
                        found=true
                        create_worktree "$name" "$branch" "$desc"
                        break
                    fi
                done
                if [[ "$found" == false ]]; then
                    log_error "Агент '${specific_agent}' не найден"
                    log_info "Доступные агенты: agent-a, agent-b, agent-c, agent-d, agent-e"
                    exit 1
                fi
            else
                # Создаём все worktrees
                log_info "Создание worktrees для всех агентов..."
                for agent in "${AGENTS[@]}"; do
                    IFS=':' read -r name branch desc <<< "$agent"
                    create_worktree "$name" "$branch" "$desc"
                done
            fi
            
            echo ""
            log_success "Настройка worktrees завершена!"
            echo ""
            log_info "Список созданных worktrees:"
            git worktree list
            echo ""
            log_info "Для начала работы перейдите в нужный worktree:"
            echo "  cd ${WORKTREES_DIR}/agent-a  # Frontend"
            echo "  cd ${WORKTREES_DIR}/agent-b  # Catalog API"
            echo "  cd ${WORKTREES_DIR}/agent-c  # Orders API"
            echo "  cd ${WORKTREES_DIR}/agent-d  # Tests"
            echo "  cd ${WORKTREES_DIR}/agent-e  # Infrastructure"
            ;;
    esac
}

main "$@"