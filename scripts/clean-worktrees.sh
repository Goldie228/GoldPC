#!/bin/bash
#
# clean-worktrees.sh - Удаление объединённых Git worktrees
#
# Назначение: Удаляет worktrees для веток, которые были объединены (merged)
#             в основную ветку, освобождая дисковое пространство.
#
# Использование:
#   ./clean-worktrees.sh              # Удалить все merged worktrees
#   ./clean-worktrees.sh --dry-run    # Показать, что будет удалено
#   ./clean-worktrees.sh --agent a    # Удалить конкретный worktree
#   ./clean-worktrees.sh --all        # Удалить все worktrees (осторожно!)
#
# Раздел документации: development-plan/03-environment-setup.md (Section 3.2)
#
# Правила очистки:
#   - Удалять worktree после merge PR
#   - Проверять статус перед удалением
#   - Сохранять несохранённые изменения (stash)
#

set -e

# ============================================================================
# КОНФИГУРАЦИЯ
# ============================================================================

# Базовая директория для worktrees
WORKTREES_DIR="worktrees"

# Ветки, которые считаются "целевыми" для merged проверок
# (ветки, в которые мержат feature-ветки)
TARGET_BRANCHES=("develop" "main" "master")

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

# Вывод dry-run сообщения
log_dry() {
    echo -e "${CYAN}[DRY-RUN]${NC} $1"
}

# Получить корневую директорию git репозитория
get_git_root() {
    git rev-parse --show-toplevel
}

# Проверить, есть ли несохранённые изменения в worktree
has_uncommitted_changes() {
    local worktree_path="$1"
    cd "$worktree_path"
    local result=0
    if [[ -n $(git status --porcelain) ]]; then
        result=1
    fi
    cd - > /dev/null
    return $result
}

# Проверить, была ли ветка объединена с целевой
is_branch_merged() {
    local branch="$1"
    local git_root=$(get_git_root)
    
    cd "$git_root"
    
    for target in "${TARGET_BRANCHES[@]}"; do
        if git rev-parse --verify "$target" >/dev/null 2>&1; then
            if git merge-base --is-ancestor "$branch" "$target" 2>/dev/null; then
                cd - > /dev/null
                return 0
            fi
        fi
    done
    
    cd - > /dev/null
    return 1
}

# Получить имя ветки для worktree
get_worktree_branch() {
    local worktree_path="$1"
    cd "$worktree_path"
    local branch=$(git rev-parse --abbrev-ref HEAD)
    cd - > /dev/null
    echo "$branch"
}

# Stash изменения в worktree
stash_changes() {
    local worktree_path="$1"
    cd "$worktree_path"
    git stash push -m "Auto-stash before worktree cleanup $(date +%Y%m%d_%H%M%S)"
    cd - > /dev/null
}

# Удалить один worktree
remove_worktree() {
    local worktree_path="$1"
    local force="$2"
    local dry_run="$3"
    local git_root=$(get_git_root)
    local full_path="${git_root}/${worktree_path}"
    
    # Проверяем существование
    if [[ ! -d "$full_path" ]]; then
        log_warning "Worktree '${worktree_path}' не найден. Пропускаем..."
        return 0
    fi
    
    local branch=$(get_worktree_branch "$full_path")
    
    if [[ "$dry_run" == "true" ]]; then
        if has_uncommitted_changes "$full_path"; then
            log_dry "Будет удалён worktree '${worktree_path}' (ветка: ${branch}) [ЕСТЬ несохранённые изменения]"
        else
            log_dry "Будет удалён worktree '${worktree_path}' (ветка: ${branch})"
        fi
        return 0
    fi
    
    # Проверяем несохранённые изменения
    if has_uncommitted_changes "$full_path"; then
        if [[ "$force" == "true" ]]; then
            log_warning "Stash несохранённых изменений в '${worktree_path}'..."
            stash_changes "$full_path"
        else
            log_warning "Worktree '${worktree_path}' имеет несохранённые изменения. Пропускаем..."
            log_info "Используйте --force для принудительного удаления"
            return 1
        fi
    fi
    
    # Удаляем worktree
    log_info "Удаление worktree '${worktree_path}' (ветка: ${branch})..."
    git worktree remove "$full_path" --force 2>/dev/null || \
        rm -rf "$full_path"
    
    log_success "Worktree '${worktree_path}' удалён"
    
    # Предлагаем удалить ветку, если она объединена
    if is_branch_merged "$branch"; then
        log_info "Ветка '${branch}' была объединена. Рекомендуется удалить:"
        echo "  git branch -d ${branch}"
    fi
}

# Показать справку
show_help() {
    cat << EOF
Использование: $0 [ОПЦИИ]

Опции:
  -d, --dry-run       Показать, что будет удалено, без реального удаления
  -f, --force         Принудительно удалить worktrees с несохранёнными изменениями
                      (изменения будут сохранены в stash)
  -a, --agent NAME    Удалить worktree конкретного агента
  --all               Удалить ВСЕ worktrees (использовать с осторожностью!)
  -l, --list          Показать список всех worktrees
  -h, --help          Показать эту справку

Переменные окружения:
  WORKTREES_DIR       Директория с worktrees (по умолчанию: worktrees)

Примеры:
  $0                          # Удалить только merged worktrees
  $0 --dry-run                # Проверить, что будет удалено
  $0 --agent agent-a          # Удалить worktree для Frontend
  $0 --force --agent agent-b  # Принудительно удалить Catalog API worktree
  $0 --all                    # Удалить ВСЕ worktrees (осторожно!)

Правила очистки worktrees:
  1. Удалять worktree после merge PR в develop/main
  2. Проверять статус перед удалением
  3. Использовать stash для несохранённых изменений
  4. Удалять feature-ветку после merge

Ручная очистка:
  # Удаление конкретного worktree
  git worktree remove worktrees/agent-a

  # Удаление ветки после merge
  git branch -d feature/frontend-development

  # Удаление удалённой ветки
  git push origin --delete feature/frontend-development

  # Prune удалённых worktrees
  git worktree prune

EOF
}

# Показать список worktrees
list_worktrees() {
    log_info "Список всех worktrees:"
    echo ""
    git worktree list
    echo ""
    
    local git_root=$(get_git_root)
    
    # Показать статус каждого worktree
    for wt in $(git worktree list --porcelain | grep "worktree" | cut -d' ' -f2); do
        if [[ "$wt" != "$git_root" ]]; then
            local branch=$(get_worktree_branch "$wt")
            local wt_name=$(basename "$wt")
            local status_icon="✓"
            local merged_icon=""
            
            if has_uncommitted_changes "$wt"; then
                status_icon="!"
            fi
            
            if is_branch_merged "$branch"; then
                merged_icon=" [MERGED]"
            fi
            
            echo "  ${status_icon} ${wt_name}: ${branch}${merged_icon}"
        fi
    done
    echo ""
    log_info "Обозначения: ✓ - чистый, ! - есть изменения, [MERGED] - объединён"
}

# ============================================================================
# ГЛАВНАЯ ЛОГИКА
# ============================================================================

main() {
    local dry_run="false"
    local force="false"
    local specific_agent=""
    local remove_all="false"
    local action="clean"
    
    # Парсинг аргументов
    while [[ $# -gt 0 ]]; do
        case $1 in
            -d|--dry-run)
                dry_run="true"
                shift
                ;;
            -f|--force)
                force="true"
                shift
                ;;
            -a|--agent)
                specific_agent="$2"
                shift 2
                ;;
            --all)
                remove_all="true"
                shift
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
    
    local git_root=$(get_git_root)
    
    case $action in
        list)
            list_worktrees
            ;;
        clean)
            if [[ "$dry_run" == "true" ]]; then
                log_info "Dry-run режим: показываем, что будет удалено..."
                echo ""
            fi
            
            # Получаем список всех worktrees
            local worktrees=()
            while IFS= read -r line; do
                local wt_path=$(echo "$line" | awk '{print $1}')
                if [[ "$wt_path" != "$git_root" ]]; then
                    worktrees+=("$(basename "$wt_path")")
                fi
            done < <(git worktree list)
            
            if [[ ${#worktrees[@]} -eq 0 ]]; then
                log_info "Нет worktrees для удаления"
                exit 0
            fi
            
            # Фильтруем по конкретному агенту
            if [[ -n "$specific_agent" ]]; then
                local found=false
                for wt in "${worktrees[@]}"; do
                    if [[ "$wt" == "$specific_agent" ]]; then
                        found=true
                        remove_worktree "${WORKTREES_DIR}/${wt}" "$force" "$dry_run"
                        break
                    fi
                done
                if [[ "$found" == false ]]; then
                    log_error "Worktree для агента '${specific_agent}' не найден"
                    exit 1
                fi
            elif [[ "$remove_all" == "true" ]]; then
                # Удаляем ВСЕ worktrees
                if [[ "$dry_run" != "true" ]]; then
                    log_warning "Удаление ВСЕХ worktrees!"
                    read -p "Вы уверены? [y/N] " -n 1 -r
                    echo
                    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                        log_info "Отменено"
                        exit 0
                    fi
                fi
                
                for wt in "${worktrees[@]}"; do
                    remove_worktree "${WORKTREES_DIR}/${wt}" "$force" "$dry_run"
                done
            else
                # Удаляем только merged worktrees
                log_info "Удаление merged worktrees..."
                local removed_count=0
                
                for wt in "${worktrees[@]}"; do
                    local full_path="${git_root}/${WORKTREES_DIR}/${wt}"
                    local branch=$(get_worktree_branch "$full_path")
                    
                    if is_branch_merged "$branch"; then
                        remove_worktree "${WORKTREES_DIR}/${wt}" "$force" "$dry_run"
                        ((removed_count++)) || true
                    else
                        if [[ "$dry_run" == "true" ]]; then
                            log_dry "Пропуск '${wt}' (ветка '${branch}' ещё не объединена)"
                        fi
                    fi
                done
                
                if [[ "$dry_run" == "true" ]]; then
                    echo ""
                    log_info "Всего будет удалено: ${removed_count} worktrees"
                else
                    log_success "Удалено ${removed_count} merged worktrees"
                fi
            fi
            
            # Очистка мусора
            if [[ "$dry_run" != "true" ]]; then
                log_info "Очистка устаревших записей worktree..."
                git worktree prune -v
            fi
            ;;
    esac
}

main "$@"