#!/bin/bash
#
# agent-status.sh - Проверка статуса агента
#
# Назначение: Выводит информацию о текущем состоянии рабочего пространства
#             агента для координации параллельной разработки.
#
# Использование:
#   ./agent-status.sh              # Полный статус
#   ./agent-status.sh --brief      # Краткий статус (одна строка)
#   ./agent-status.sh --json       # JSON формат для интеграции
#   ./agent-status.sh --dashboard  # Формат для Dashboard координатора
#
# Раздел документации: development-plan/05-parallel-development.md (Section 5.4)
#

set -e

# ============================================================================
# КОНФИГУРАЦИЯ
# ============================================================================

# Имя агента (можно переопределить через окружение)
AGENT_NAME="${AGENT_NAME:-$(whoami)}"

# Роль агента (можно переопределить)
AGENT_ROLE="${AGENT_ROLE:-TIER-2}"

# Модуль по умолчанию
AGENT_MODULE="${AGENT_MODULE:-unknown}"

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
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

# Проверка наличия git
check_git() {
    if ! command -v git &> /dev/null; then
        return 1
    fi
    
    if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
        return 1
    fi
    
    return 0
}

# Получить корневую директорию git репозитория
get_git_root() {
    git rev-parse --show-toplevel 2>/dev/null || echo "."
}

# Получить текущую ветку
get_current_branch() {
    if check_git; then
        git branch --show-current 2>/dev/null || echo "detached"
    else
        echo "unknown"
    fi
}

# Получить последний коммит
get_last_commit() {
    if check_git; then
        git log -1 --format="%h %s" 2>/dev/null || echo "no commits"
    else
        echo "unknown"
    fi
}

# Получить хеш последнего коммита
get_last_commit_hash() {
    if check_git; then
        git rev-parse --short HEAD 2>/dev/null || echo "unknown"
    else
        echo "unknown"
    fi
}

# Получить сообщение последнего коммита
get_last_commit_message() {
    if check_git; then
        git log -1 --format="%s" 2>/dev/null || echo "no commits"
    else
        echo "unknown"
    fi
}

# Получить автора последнего коммита
get_last_commit_author() {
    if check_git; then
        git log -1 --format="%an" 2>/dev/null || echo "unknown"
    else
        echo "unknown"
    fi
}

# Получить время последнего коммита
get_last_commit_time() {
    if check_git; then
        git log -1 --format="%ar" 2>/dev/null || echo "unknown"
    else
        echo "unknown"
    fi
}

# Получить статус изменений
get_changes_status() {
    if check_git; then
        local staged=$(git diff --cached --numstat 2>/dev/null | wc -l)
        local unstaged=$(git diff --numstat 2>/dev/null | wc -l)
        local untracked=$(git ls-files --others --exclude-standard 2>/dev/null | wc -l)
        
        if [[ $staged -gt 0 || $unstaged -gt 0 || $untracked -gt 0 ]]; then
            echo "modified"
        else
            echo "clean"
        fi
    else
        echo "unknown"
    fi
}

# Получить количество изменённых файлов
get_changed_files_count() {
    if check_git; then
        git status --short 2>/dev/null | wc -l
    else
        echo "0"
    fi
}

# Получить remote URL
get_remote_url() {
    if check_git; then
        git remote get-url origin 2>/dev/null || echo "no remote"
    else
        echo "unknown"
    fi
}

# Проверить синхронизацию с remote
get_sync_status() {
    if check_git; then
        git fetch --quiet 2>/dev/null || true
        local local=$(git rev-parse HEAD 2>/dev/null)
        local remote=$(git rev-parse @{u} 2>/dev/null)
        
        if [[ -z "$remote" ]]; then
            echo "no-upstream"
        elif [[ "$local" == "$remote" ]]; then
            echo "synced"
        elif git merge-base --is-ancestor HEAD @{u} 2>/dev/null; then
            echo "behind"
        elif git merge-base --is-ancestor @{u} HEAD 2>/dev/null; then
            echo "ahead"
        else
            echo "diverged"
        fi
    else
        echo "unknown"
    fi
}

# Определить статус агента
get_agent_status() {
    local changes=$(get_changes_status)
    local sync=$(get_sync_status)
    
    if [[ "$changes" == "modified" ]]; then
        echo "Working"
    elif [[ "$sync" == "ahead" ]]; then
        echo "Ready to Push"
    elif [[ "$sync" == "behind" || "$sync" == "diverged" ]]; then
        echo "Needs Sync"
    else
        echo "Idle"
    fi
}

# Получить текущий модуль на основе ветки
infer_module_from_branch() {
    local branch=$(get_current_branch)
    
    case "$branch" in
        *frontend*|*ui*|*react*)
            echo "Frontend"
            ;;
        *catalog*|*product*)
            echo "Catalog"
            ;;
        *order*|*cart*)
            echo "Orders"
            ;;
        *auth*|*security*)
            echo "Auth"
            ;;
        *pcbuilder*|*builder*)
            echo "PCBuilder"
            ;;
        *service*|*warranty*)
            echo "Services"
            ;;
        *test*|*qa*)
            echo "Testing"
            ;;
        *infra*|*deploy*|*devops*)
            echo "Infrastructure"
            ;;
        main|master|develop)
            echo "Core"
            ;;
        *)
            echo "Unknown"
            ;;
    esac
}

# Вывод краткого статуса (одна строка)
print_brief_status() {
    local branch=$(get_current_branch)
    local commit=$(get_last_commit_hash)
    local status=$(get_agent_status)
    local module=$(infer_module_from_branch)
    
    echo "${AGENT_NAME} | ${status} | ${module} | ${branch} | ${commit}"
}

# Вывод статуса в JSON формате
print_json_status() {
    local branch=$(get_current_branch)
    local commit_hash=$(get_last_commit_hash)
    local commit_message=$(get_last_commit_message)
    local commit_author=$(get_last_commit_author)
    local commit_time=$(get_last_commit_time)
    local status=$(get_agent_status)
    local sync=$(get_sync_status)
    local changes=$(get_changes_status)
    local changed_files=$(get_changed_files_count)
    local module=$(infer_module_from_branch)
    local remote=$(get_remote_url)
    
    cat << EOF
{
  "agent": {
    "name": "${AGENT_NAME}",
    "role": "${AGENT_ROLE}",
    "status": "${status}"
  },
  "git": {
    "branch": "${branch}",
    "commit": {
      "hash": "${commit_hash}",
      "message": "${commit_message}",
      "author": "${commit_author}",
      "time": "${commit_time}"
    },
    "sync": "${sync}",
    "changes": "${changes}",
    "changedFiles": ${changed_files}
  },
  "module": "${module}",
  "timestamp": "$(date -Iseconds)"
}
EOF
}

# Вывод статуса для Dashboard координатора
print_dashboard_status() {
    local branch=$(get_current_branch)
    local commit=$(get_last_commit_hash)
    local commit_msg=$(get_last_commit_message)
    local status=$(get_agent_status)
    local module=$(infer_module_from_branch)
    local sync=$(get_sync_status)
    local changed=$(get_changed_files_count)
    
    # Определяем цвет статуса
    local status_icon
    case "$status" in
        "Working")
            status_icon="🔧"
            ;;
        "Ready to Push")
            status_icon="📤"
            ;;
        "Needs Sync")
            status_icon="⚠️"
            ;;
        "Idle")
            status_icon="💤"
            ;;
        *)
            status_icon="❓"
            ;;
    esac
    
    # Определяем цвет синхронизации
    local sync_icon
    case "$sync" in
        "synced")
            sync_icon="✅"
            ;;
        "ahead")
            sync_icon="⬆️"
            ;;
        "behind")
            sync_icon="⬇️"
            ;;
        "diverged")
            sync_icon="↔️"
            ;;
        "no-upstream")
            sync_icon="🚫"
            ;;
        *)
            sync_icon="❓"
            ;;
    esac
    
    printf "│ %-10s │ %-10s │ %-6s %s │ %-20s │ %-7s │ %-7s │\n" \
        "${AGENT_NAME:0:10}" \
        "${module:0:10}" \
        "${commit}" \
        "${sync_icon}" \
        "${branch:0:20}" \
        "${status_icon} ${status:0:5}" \
        "${changed} files"
}

# Вывод полного статуса
print_full_status() {
    local branch=$(get_current_branch)
    local commit=$(get_last_commit_hash)
    local commit_msg=$(get_last_commit_message)
    local commit_author=$(get_last_commit_author)
    local commit_time=$(get_last_commit_time)
    local status=$(get_agent_status)
    local sync=$(get_sync_status)
    local changes=$(get_changes_status)
    local changed=$(get_changed_files_count)
    local module=$(infer_module_from_branch)
    local remote=$(get_remote_url)
    
    echo ""
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║              📊 СТАТУС АГЕНТА: ${AGENT_NAME}                       ║"
    echo "╠══════════════════════════════════════════════════════════════╣"
    echo "║                                                              ║"
    echo "║  👤 АГЕНТ                                                     ║"
    echo "║  ├── Имя:           ${AGENT_NAME}"
    echo "║  ├── Роль:          ${AGENT_ROLE}"
    echo "║  ├── Статус:        ${status}"
    echo "║  └── Модуль:        ${module}"
    echo "║                                                              ║"
    echo "║  🌿 GIT                                                        ║"
    echo "║  ├── Ветка:         ${branch}"
    echo "║  ├── Последний коммит:"
    echo "║  │   ├── Hash:      ${commit}"
    echo "║  │   ├── Message:   ${commit_msg:0:50}"
    echo "║  │   ├── Author:    ${commit_author}"
    echo "║  │   └── Time:      ${commit_time}"
    echo "║  ├── Синхронизация: ${sync}"
    echo "║  ├── Изменения:     ${changes} (${changed} файлов)"
    echo "║  └── Remote:        ${remote:0:40}"
    echo "║                                                              ║"
    echo "║  📅 ВРЕМЯ                                                      ║"
    echo "║  └── Проверка:      $(date '+%Y-%m-%d %H:%M:%S')"
    echo "║                                                              ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo ""
    
    # Дополнительная информация при наличии изменений
    if [[ "$changes" == "modified" ]]; then
        log_warning "Обнаружены незакоммиченные изменения!"
        echo ""
        git status --short
        echo ""
        log_info "Рекомендуется закоммитить изменения перед синхронизацией"
    fi
    
    # Предупреждение о необходимости синхронизации
    if [[ "$sync" == "behind" ]]; then
        log_warning "Локальная ветка отстаёт от remote. Выполните git pull"
    elif [[ "$sync" == "diverged" ]]; then
        log_warning "Ветки разошлись. Требуется разрешение конфликта"
    fi
}

# Вывод заголовка таблицы для Dashboard
print_dashboard_header() {
    echo "┌────────────┬────────────┬───────────┬──────────────────────┬─────────┬─────────┐"
    echo "│ Agent      │ Module     │ Commit    │ Branch               │ Status  │ Changes │"
    echo "├────────────┼────────────┼───────────┼──────────────────────┼─────────┼─────────┤"
}

# Вывод футера таблицы для Dashboard
print_dashboard_footer() {
    echo "└────────────┴────────────┴───────────┴──────────────────────┴─────────┴─────────┘"
}

# Показать справку
show_help() {
    cat << EOF
Использование: $0 [ОПЦИИ]

Скрипт проверки статуса агента для параллельной разработки.
Выводит информацию о текущем состоянии рабочего пространства.

Опции:
  -b, --brief       Краткий статус (одна строка)
  -j, --json        Вывод в JSON формате
  -d, --dashboard   Формат для Dashboard координатора
  -h, --help        Показать эту справку

Переменные окружения:
  AGENT_NAME     Имя агента (по умолчанию: текущий пользователь)
  AGENT_ROLE     Роль агента (по умолчанию: TIER-2)
  AGENT_MODULE   Текущий модуль (по умолчанию: определяется из ветки)

Примеры:
  $0                    # Полный статус
  $0 --brief            # Краткий статус
  $0 --json             # JSON для интеграции
  $0 --dashboard        # Формат Dashboard

Интеграция с Dashboard координатора:
  # Вывод всех агентов
  for agent in agent-a agent-b agent-c agent-d; do
      AGENT_NAME=\$agent ./scripts/agent-status.sh --dashboard
  done

EOF
}

# ============================================================================
# ГЛАВНАЯ ЛОГИКА
# ============================================================================

main() {
    local format="full"
    
    # Парсинг аргументов
    while [[ $# -gt 0 ]]; do
        case $1 in
            -b|--brief)
                format="brief"
                shift
                ;;
            -j|--json)
                format="json"
                shift
                ;;
            -d|--dashboard)
                format="dashboard"
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
    
    case $format in
        brief)
            print_brief_status
            ;;
        json)
            print_json_status
            ;;
        dashboard)
            print_dashboard_status
            ;;
        full)
            print_full_status
            ;;
    esac
}

main "$@"