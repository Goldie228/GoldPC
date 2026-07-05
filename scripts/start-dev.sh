#!/bin/bash
# =============================================================================
# Скрипт запуска разработки GoldPC
# =============================================================================
# Использование: ./scripts/start-dev.sh [ОПЦИИ]
#
# Опции:
#   --infra-only     Запустить только инфраструктуру (postgres, redis)
#   --backend-only   Запустить только бэкенд-сервисы (требуется работающая инфраструктура)
#   --frontend-only  Запустить только фронтенд-сервис

#   --skip-build     Пропустить сборку образов
#   --detach, -d     Запустить в откреплённом режиме
#   --logs           Показать логи после запуска
#   --clean          Очистить перед запуском (удаляет контейнеры)
#   --reset-db       Сбросить базу данных (ВНИМАНИЕ: уничтожает данные)
#   --help, -h       Показать эту справку
# =============================================================================

set -e

# Цвета для вывода
CYAN='\033[36m'
GREEN='\033[32m'
YELLOW='\033[33m'
RED='\033[31m'
RESET='\033[0m'

# Опции по умолчанию
INFRA_ONLY=false
BACKEND_ONLY=false
FRONTEND_ONLY=false

SKIP_BUILD=false
DETACH=false
SHOW_LOGS=false
CLEAN=false
RESET_DB=false

# Разбор аргументов
while [[ $# -gt 0 ]]; do
    case $1 in
        --infra-only)
            INFRA_ONLY=true
            shift
            ;;
        --backend-only)
            BACKEND_ONLY=true
            shift
            ;;
        --frontend-only)
            FRONTEND_ONLY=true
            shift
            ;;

        --skip-build)
            SKIP_BUILD=true
            shift
            ;;
        --detach|-d)
            DETACH=true
            shift
            ;;
        --logs)
            SHOW_LOGS=true
            shift
            ;;
        --clean)
            CLEAN=true
            shift
            ;;
        --reset-db)
            RESET_DB=true
            shift
            ;;
        --help|-h)
            echo "Скрипт запуска разработки GoldPC"
            echo ""
            echo "Использование: ./scripts/start-dev.sh [ОПЦИИ]"
            echo ""
            echo "Опции:"
            echo "  --infra-only     Запустить только инфраструктуру (postgres, redis)"
            echo "  --backend-only   Запустить только бэкенд-сервисы (требуется работающая инфраструктура)"
            echo "  --frontend-only  Запустить только фронтенд-сервис"

            echo "  --skip-build     Пропустить сборку образов"
            echo "  --detach, -d     Запустить в откреплённом режиме"
            echo "  --logs           Показать логи после запуска"
            echo "  --clean          Очистить перед запуском"
            echo "  --reset-db       Сбросить базу данных (ВНИМАНИЕ: уничтожает данные)"
            echo "  --help, -h       Показать эту справку"
            exit 0
            ;;
        *)
            echo -e "${RED}Неизвестная опция: $1${RESET}"
            exit 1
            ;;
    esac
done

# Директория скрипта
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
DOCKER_COMPOSE="docker compose -f $PROJECT_DIR/docker/docker-compose.yml"


# Переход в директорию проекта
cd "$PROJECT_DIR"

echo -e "${CYAN}================================================${RESET}"
echo -e "${CYAN}   GoldPC — Среда разработки${RESET}"
echo -e "${CYAN}================================================${RESET}"
echo ""

# Проверка существования .env
check_env() {
    if [ ! -f "$PROJECT_DIR/.env" ]; then
        echo -e "${YELLOW}Предупреждение: файл .env не найден${RESET}"
        if [ -f "$PROJECT_DIR/.env.example" ]; then
            echo -e "${CYAN}Создание .env из .env.example...${RESET}"
            cp "$PROJECT_DIR/.env.example" "$PROJECT_DIR/.env"
            echo -e "${GREEN}.env создан. Пожалуйста, отредактируйте со своими значениями.${RESET}"
        else
            echo -e "${RED}Ошибка: .env.example не найден!${RESET}"
            exit 1
        fi
    fi
}

# Очистка контейнеров
do_clean() {
    echo -e "${CYAN}Очистка контейнеров...${RESET}"
    $DOCKER_COMPOSE down
    echo -e "${GREEN}Очистка завершена${RESET}"
}

# Сброс базы данных
do_reset_db() {
    echo -e "${RED}ВНИМАНИЕ: Это уничтожит все данные базы данных!${RESET}"
    read -p "Вы уверены? [y/N] " confirm
    if [ "$confirm" = "y" ] || [ "$confirm" = "Y" ]; then
        echo -e "${CYAN}Сброс базы данных...${RESET}"
        $DOCKER_COMPOSE down -v postgres
        echo -e "${GREEN}Сброс базы данных завершён${RESET}"
    else
        echo -e "${YELLOW}Сброс базы данных отменён${RESET}"
    fi
}

# Ожидание готовности сервиса
wait_for_healthy() {
    local service=$1
    local max_attempts=30
    local attempt=1

    echo -e "${CYAN}Ожидание готовности $service...${RESET}"

    while [ $attempt -le $max_attempts ]; do
        if docker exec "goldpc-$service" pg_isready -U postgres -d goldpc >/dev/null 2>&1 || \
           docker exec "goldpc-$service" redis-cli ping >/dev/null 2>&1; then
            echo -e "${GREEN}✓ $service готов${RESET}"
            return 0
        fi
        echo -n "."
        sleep 1
        ((attempt++))
    done

    echo -e "${RED}✗ Проверка готовности $service не удалась${RESET}"
    return 1
}

# Сборка образов
build_images() {
    if [ "$SKIP_BUILD" = true ]; then
        echo -e "${YELLOW}Пропуск сборки (--skip-build)${RESET}"
        return
    fi

    echo -e "${CYAN}Сборка Docker-образов...${RESET}"
    $DOCKER_COMPOSE build
}

# Запуск инфраструктуры
start_infra() {
    echo -e "${CYAN}Запуск сервисов инфраструктуры...${RESET}"
    $DOCKER_COMPOSE up -d postgres redis

    # Ожидание готовности сервисов
    sleep 5

    echo -e "${GREEN}✓ PostgreSQL: localhost:5432${RESET}"
    echo -e "${GREEN}✓ Redis: localhost:6379${RESET}"
}

# Запуск бэкенд-сервисов
start_backend() {
    echo -e "${CYAN}Запуск бэкенд-сервисов...${RESET}"

    # Проверка, запущена ли инфраструктура
    if ! docker ps --format '{{.Names}}' | grep -q "goldpc-postgres"; then
        echo -e "${YELLOW}Инфраструктура не запущена. Запуск...${RESET}"
        start_infra
    fi

    $DOCKER_COMPOSE up -d catalog.api auth.api services.api

    echo -e "${GREEN}✓ catalog.api (Catalog): http://localhost:9081${RESET}"
    echo -e "${GREEN}✓ auth.api (Auth): http://localhost:9082${RESET}"
    echo -e "${GREEN}✓ services.api (Services): http://localhost:5003${RESET}"
}

# Запуск фронтенда
start_frontend() {
    echo -e "${CYAN}Запуск фронтенда...${RESET}"
    $DOCKER_COMPOSE up -d frontend

    echo -e "${GREEN}✓ Frontend: http://localhost:3000${RESET}"
}

# Показ логов
show_logs() {
    echo -e "${CYAN}Показ логов (Ctrl+C для выхода)...${RESET}"
    $DOCKER_COMPOSE logs -f
}

# Вывод статуса сервисов
print_status() {
    echo ""
    echo -e "${CYAN}================================================${RESET}"
    echo -e "${CYAN}   Статус сервисов${RESET}"
    echo -e "${CYAN}================================================${RESET}"
    $DOCKER_COMPOSE ps
    echo ""
    echo -e "${CYAN}Доступные конечные точки:${RESET}"
    echo -e "  ${GREEN}Frontend:${RESET}     http://localhost:3000"
    echo -e "  ${GREEN}Catalog API:${RESET}  http://localhost:5000/swagger"
    echo -e "  ${GREEN}Auth API:${RESET}     http://localhost:5001/swagger"
    echo -e "  ${GREEN}Orders API:${RESET}   http://localhost:5002/swagger"
    echo -e "  ${GREEN}Services API:${RESET} http://localhost:5003/swagger"
    echo -e "  ${GREEN}Warranty API:${RESET} http://localhost:5004/swagger"
    echo -e "  ${GREEN}PCBuilder API:${RESET} http://localhost:5005/swagger"
    echo -e "  ${GREEN}Adminer:${RESET}      http://localhost:8080"
    echo ""
}

# Основное выполнение
main() {
    check_env

    # Обработка опции clean
    if [ "$CLEAN" = true ]; then
        do_clean
    fi

    # Обработка опции reset-db
    if [ "$RESET_DB" = true ]; then
        do_reset_db
    fi

    # Сборка образов
    build_images

    # Запуск сервисов в зависимости от опций
    if [ "$INFRA_ONLY" = true ]; then
        start_infra
    elif [ "$BACKEND_ONLY" = true ]; then
        start_backend
    elif [ "$FRONTEND_ONLY" = true ]; then
        start_frontend
    else
        # Запуск всего
        start_infra
        sleep 5
        start_backend
        sleep 5
        start_frontend
    fi

    # Вывод статуса
    print_status

    # Обработка опции logs
    if [ "$SHOW_LOGS" = true ] && [ "$DETACH" = false ]; then
        show_logs
    fi
}

# Запуск main
main
