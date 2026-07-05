# =============================================================================
# GoldPC Makefile — Автоматизация разработки и развёртывания
# =============================================================================
# Использование: make <цель>
# Выполните 'make help' для просмотра всех доступных целей
# =============================================================================

SHELL := /bin/bash
DOCKER_COMPOSE := docker compose
DOCKER_COMPOSE_DEV := docker compose -f docker/docker-compose.yml
DOCKER_COMPOSE_PROD := docker compose -f docker/docker-compose.prod.yml
PROJECT_NAME := goldpc

# Цвета для вывода
CYAN := \033[36m
GREEN := \033[32m
YELLOW := \033[33m
RED := \033[31m
RESET := \033[0m

.PHONY: help install dev infra up down logs clean build rebuild ps status \
        db-reset db-migrate db-seed test test-unit test-integration test-e2e \
        lint format security docker-clean docker-prune prod-deploy prod-rollback \
        health check-env backup restore

# =============================================================================
# ЦЕЛЬ ПО УМОЛЧАНИЮ
# =============================================================================
help: ## Показать это справочное сообщение
	@echo "$(CYAN)GoldPC Development Commands$(RESET)"
	@echo ""
	@awk 'BEGIN {FS = ":.*##"; section=""} \
		/^## / { section=substr($$0, 4); printf "\n$(YELLOW)%s$(RESET)\n", section } \
		/^[a-zA-Z_-]+:.*##/ { printf "  $(GREEN)%-20s$(RESET) %s\n", $$1, $$2 }' $(MAKEFILE_LIST)
	@echo ""

## УСТАНОВКА
## ============

install: check-env ## Установить зависимости (скопировать .env.example в .env, если не существует)
	@if [ ! -f .env ]; then \
		cp .env.example .env; \
		echo "$(GREEN)Created .env from .env.example$(RESET)"; \
		echo "$(YELLOW)Please edit .env with your values$(RESET)"; \
	fi
	@echo "$(GREEN)Dependencies ready!$(RESET)"

## РАЗРАБОТКА
## ==========

dev: infra backend frontend ## Запустить полную среду разработки
	@echo "$(GREEN)Development environment is ready!$(RESET)"
	@echo "Services:"
	@echo "  - Frontend: http://localhost:3000"
	@echo "  - Catalog API: http://localhost:5001"
	@echo "  - PCBuilder API: http://localhost:5002"
	@echo "  - Auth API: http://localhost:5003"
	@echo "  - Adminer: http://localhost:8080"

infra: ## Запустить сервисы инфраструктуры (postgres, redis)
	@echo "$(CYAN)Starting infrastructure services...$(RESET)"
	$(DOCKER_COMPOSE_DEV) up -d postgres redis
	@echo "$(GREEN)Waiting for services to be healthy...$(RESET)"
	@sleep 5
	@$(MAKE) health-infra

backend: ## Запустить бэкенд-сервисы
	@echo "$(CYAN)Starting backend services...$(RESET)"
	$(DOCKER_COMPOSE_DEV) up -d catalogservice pcbuilderservice authservice
	@echo "$(GREEN)Waiting for backend services...$(RESET)"
	@sleep 10

frontend: ## Запустить фронтенд-сервис
	@echo "$(CYAN)Starting frontend...$(RESET)"
	$(DOCKER_COMPOSE_DEV) up -d frontend

up: ## Запустить все сервисы
	@echo "$(CYAN)Starting all services...$(RESET)"
	$(DOCKER_COMPOSE_DEV) up -d

down: ## Остановить все сервисы
	@echo "$(CYAN)Stopping all services...$(RESET)"
	$(DOCKER_COMPOSE_DEV) down

logs: ## Показать логи всех сервисов (Ctrl+C для выхода)
	$(DOCKER_COMPOSE_DEV) logs -f

logs-backend: ## Показать логи бэкенда
	$(DOCKER_COMPOSE_DEV) logs -f catalogservice pcbuilderservice authservice

logs-infra: ## Показать логи инфраструктуры
	$(DOCKER_COMPOSE_DEV) logs -f postgres redis

ps: ## Показать запущенные контейнеры
	$(DOCKER_COMPOSE_DEV) ps

status: ps ## Псевдоним для 'ps'

## СБОРКА
## ========

build: ## Собрать все сервисы
	@echo "$(CYAN)Building all services...$(RESET)"
	$(DOCKER_COMPOSE_DEV) build

rebuild: ## Пересобрать все сервисы (без кэша)
	@echo "$(CYAN)Rebuilding all services without cache...$(RESET)"
	$(DOCKER_COMPOSE_DEV) build --no-cache

build-backend: ## Собрать только бэкенд-сервисы
	$(DOCKER_COMPOSE_DEV) build catalogservice pcbuilderservice authservice

build-frontend: ## Собрать только фронтенд
	$(DOCKER_COMPOSE_DEV) build frontend

## БАЗА ДАННЫХ
## =======

db-shell: ## Открыть оболочку PostgreSQL
	$(DOCKER_COMPOSE_DEV) exec postgres psql -U postgres -d goldpc

db-reset: ## Сбросить базу данных (ВНИМАНИЕ: уничтожает все данные)
	@echo "$(RED)WARNING: This will destroy all database data!$(RESET)"
	@read -p "Are you sure? [y/N] " confirm && [ "$$confirm" = "y" ] || exit 1
	$(DOCKER_COMPOSE_DEV) down -v postgres
	$(DOCKER_COMPOSE_DEV) up -d postgres
	@echo "$(GREEN)Database reset complete$(RESET)"

db-migrate: ## Запустить миграции базы данных
	@echo "$(CYAN)Running migrations...$(RESET)"
	cd scripts/db && ./migrate.sh

db-seed: ## Заполнить БД из scripts/seed-data/catalog-seed.json (офлайн)
	@echo "$(CYAN)Seeding catalog...$(RESET)"
	cd src/CatalogService && dotnet run -- seed-catalog

db-seed-xcore: ## Алиас: импорт каталога (то же, что seed-catalog; legacy имя)
	@echo "$(CYAN)Импорт каталога (seed-catalog)...$(RESET)"
	cd src/CatalogService && dotnet run -- seed-catalog

db-seed-xcore-reset: ## Полный сброс товаров XCORE-* и импорт из catalog-seed.json
	@echo "$(CYAN)Полный сброс каталога (seed-catalog-reset)...$(RESET)"
	cd src/CatalogService && dotnet run -- seed-catalog-reset

scraper-fetch-images: ## Загрузить изображения с x-core.by (div.slides) -> xcore-images.json
	@echo "$(CYAN)Загрузка изображений товаров...$(RESET)"
	cd scripts/scraper && npm run fetch-images

scraper-sync-with-images: ## Удалить товары без фото; выровнять xcore-products.json с xcore-images.json
	@echo "$(CYAN)Синхронизация товаров с изображениями...$(RESET)"
	cd scripts/scraper && npm run sync-with-images

sync-compatibility-rules: ## Скопировать backend compatibility rules в frontend
	@echo "$(CYAN)Синхронизация правил совместимости...$(RESET)"
	node scripts/sync-compatibility-rules.mjs

scraper-remap-periphery: ## Переприсвоить slug periphery -> mice/keyboards по categoryPath
	@echo "$(CYAN)Remap periphery -> mice/keyboards...$(RESET)"
	cd scripts/scraper && npm run remap-periphery

db-update-images: ## Обновить картинки в БД из xcore-images.json (после scraper-fetch-images)
	@echo "$(CYAN)Обновление изображений в БД...$(RESET)"
	cd src/CatalogService && dotnet run -- seed-xcore-images

db-images-full: db-update-images scraper-download-images ## Импорт изображений в БД + скачивание в uploads (рекомендуемый порядок)

scraper-download-images: ## Скачать изображения с внешних URL в uploads, обновить path в БД
	@echo "$(CYAN)Скачивание изображений товаров и логотипов производителей...$(RESET)"
	cd scripts/scraper && npm run download-images

scraper-download-images-test: ## Скачать первые 20 изображений (тест)
	@echo "$(CYAN)Тест: скачивание 20 изображений...$(RESET)"
	cd scripts/scraper && npm run download-images:test

db-seed-filter-attributes: ## Синхронизировать атрибуты фильтров из xcore-filter-attributes.json
	@echo "$(CYAN)Синхронизация атрибутов фильтров...$(RESET)"
	cd src/CatalogService && dotnet run -- seed-filter-attributes

db-migrate-gpu-release-year: ## Миграция: data_vykhoda_na_rynok_2 → release_year для видеокарт
	@echo "$(CYAN)Миграция GPU release_year...$(RESET)"
	cd src/CatalogService && dotnet run -- migrate-gpu-release-year

dump-filters: ## Собрать все фильтры категорий в JSON+MD (требует запущенный dev)
	@echo "$(CYAN)Сбор фильтров...$(RESET)"
	node scripts/dump-all-filters.mjs

db-admin: ## Открыть Adminer интерфейс БД
	@echo "$(GREEN)Adminer available at: http://localhost:8080$(RESET)"
	$(DOCKER_COMPOSE_DEV) up -d adminer

backup: ## Создать резервные копии всех баз данных в файлы
	@echo "$(CYAN)Creating database backups...$(RESET)"
	@mkdir -p backups/$(shell date +%Y%m%d_%H%M%S)
	@for db in goldpc_catalog goldpc_auth goldpc_orders goldpc_services goldpc_warranty; do \
		echo "Backing up $$db..."; \
		$(DOCKER_COMPOSE_DEV) exec -T postgres pg_dump -U postgres $$db > backups/$(shell date +%Y%m%d_%H%M%S)/$$db.sql; \
	done
	@echo "$(GREEN)Backups created in backups/$(shell date +%Y%m%d_%H%M%S)/$(RESET)"

backup-pitr: ## Создать базовую резервную копию для PITR
	@echo "$(CYAN)Creating base backup for PITR...$(RESET)"
	@mkdir -p backups/pitr/$(shell date +%Y%m%d_%H%M%S)
	$(DOCKER_COMPOSE_DEV) exec postgres pg_basebackup -U postgres -D /tmp/base_backup -Ft -z -P
	$(DOCKER_COMPOSE_DEV) cp postgres:/tmp/base_backup backups/pitr/$(shell date +%Y%m%d_%H%M%S)/base.tar.gz
	$(DOCKER_COMPOSE_DEV) exec postgres rm -rf /tmp/base_backup
	@echo "$(GREEN)Base backup created in backups/pitr/$(shell date +%Y%m%d_%H%M%S)/$(RESET)"

restore: ## Восстановить базу данных из резервной копии (использование: make restore FILE=backups/dir/db.sql DB=goldpc_catalog)
ifndef FILE
	@echo "$(RED)Error: FILE parameter required$(RESET)"
	@echo "Usage: make restore FILE=backups/20240324_120000/goldpc_catalog.sql DB=goldpc_catalog"
	@exit 1
endif
ifndef DB
	@echo "$(RED)Error: DB parameter required$(RESET)"
	@echo "Usage: make restore FILE=backups/20240324_120000/goldpc_catalog.sql DB=goldpc_catalog"
	@exit 1
endif
	@echo "$(CYAN)Restoring database $(DB) from $(FILE)...$(RESET)"
	$(DOCKER_COMPOSE_DEV) exec -T postgres psql -U postgres -d postgres -c "DROP DATABASE IF EXISTS $(DB);"
	$(DOCKER_COMPOSE_DEV) exec -T postgres psql -U postgres -d postgres -c "CREATE DATABASE $(DB);"
	$(DOCKER_COMPOSE_DEV) exec -T postgres psql -U postgres -d $(DB) < $(FILE)
	@echo "$(GREEN)Database $(DB) restored$(RESET)"

## REDIS
## =====

redis-shell: ## Открыть Redis CLI
	$(DOCKER_COMPOSE_DEV) exec redis redis-cli

redis-flush: ## Очистить кэш Redis (ВНИМАНИЕ: очищает весь кэш)
	@echo "$(RED)WARNING: This will clear all Redis data!$(RESET)"
	@read -p "Are you sure? [y/N] " confirm && [ "$$confirm" = "y" ] || exit 1
	$(DOCKER_COMPOSE_DEV) exec redis redis-cli FLUSHALL
	@echo "$(GREEN)Redis cache cleared$(RESET)"

## ТЕСТИРОВАНИЕ
## =======

test: test-unit test-integration ## Запустить все тесты

test-unit: ## Запустить модульные тесты
	@echo "$(CYAN)Running unit tests...$(RESET)"
	cd src && dotnet test --filter "FullyQualifiedName~Unit" --logger "console;verbosity=normal"

test-integration: ## Запустить интеграционные тесты
	@echo "$(CYAN)Running integration tests...$(RESET)"
	cd src && dotnet test --filter "FullyQualifiedName~Integration" --logger "console;verbosity=normal"

test-e2e: ## Запустить сквозные тесты
	@echo "$(CYAN)Running E2E tests...$(RESET)"
	cd tests/e2e && npm test

test-coverage: ## Запустить тесты с отчётом о покрытии
	@echo "$(CYAN)Running tests with coverage...$(RESET)"
	cd src && dotnet test --collect:"XPlat Code Coverage"

## КАЧЕСТВО КОДА
## ===========

lint: ## Запустить линтеры
	@echo "$(CYAN)Running linters...$(RESET)"
	cd src && dotnet format --verify-no-changes --severity warn
	@cd src/frontend && npm run lint 2>/dev/null || true

format: ## Форматировать код
	@echo "$(CYAN)Formatting code...$(RESET)"
	cd src && dotnet format
	@cd src/frontend && npm run format 2>/dev/null || true

security: ## Запустить сканирование безопасности
	@echo "$(CYAN)Running security scans...$(RESET)"
	@command -v trivy >/dev/null 2>&1 && trivy image goldpc-backend:latest || echo "$(YELLOW)trivy not installed, skipping$(RESET)"
	@command -v snyk >/dev/null 2>&1 && snyk test || echo "$(YELLOW)snyk not installed, skipping$(RESET)"

## PRODUCTION
## =========

prod-up: ## Запустить производственное окружение (синий слот)
	@echo "$(CYAN)Starting production (blue slot)...$(RESET)"
	$(DOCKER_COMPOSE_PROD) --profile blue up -d

prod-up-green: ## Запустить производственное окружение (зелёный слот)
	@echo "$(CYAN)Starting production (green slot)...$(RESET)"
	$(DOCKER_COMPOSE_PROD) --profile green up -d

prod-down: ## Остановить производственное окружение
	@echo "$(CYAN)Stopping production...$(RESET)"
	$(DOCKER_COMPOSE_PROD) down

prod-logs: ## Показать производственные логи
	$(DOCKER_COMPOSE_PROD) logs -f

prod-switch: ## Переключиться с синего на зелёный (или наоборот)
	@echo "$(CYAN)Switching deployment slots...$(RESET)"
	@# This would typically update nginx config
	@echo "$(YELLOW)Manual nginx reconfiguration required$(RESET)"

prod-build: ## Собрать производственные образы
	@echo "$(CYAN)Building production images...$(RESET)"
	$(DOCKER_COMPOSE_PROD) build

prod-push: ## Отправить производственные образы в реестр
	@echo "$(CYAN)Pushing images to registry...$(RESET)"
	$(DOCKER_COMPOSE_PROD) push

## МОНИТОРИНГ
## =========

monitoring-up: ## Запустить стек мониторинга (Prometheus + Grafana)
	@echo "$(CYAN)Starting monitoring stack...$(RESET)"
	$(DOCKER_COMPOSE_PROD) --profile monitoring up -d
	@echo "$(GREEN)Prometheus: http://localhost:9090$(RESET)"
	@echo "$(GREEN)Grafana: http://localhost:3002$(RESET)"

monitoring-down: ## Остановить стек мониторинга
	$(DOCKER_COMPOSE_PROD) --profile monitoring down

## ОЧИСТКА
## ======

clean: ## Остановить и удалить контейнеры, сохранить тома
	$(DOCKER_COMPOSE_DEV) down
	@echo "$(GREEN)Cleaned up containers$(RESET)"

clean-all: ## Остановить и удалить контейнеры И тома (ВНИМАНИЕ: потеря данных!)
	@echo "$(RED)WARNING: This will remove all data!$(RESET)"
	@read -p "Are you sure? [y/N] " confirm && [ "$$confirm" = "y" ] || exit 1
	$(DOCKER_COMPOSE_DEV) down -v --rmi local
	@echo "$(GREEN)Cleaned up all containers, volumes and local images$(RESET)"

docker-clean: ## Удалить зависшие ресурсы Docker
	docker system prune -f

docker-prune: ## Полная очистка Docker (ВНИМАНИЕ: удаляет неиспользуемые ресурсы)
	@echo "$(RED)WARNING: This will remove all unused Docker resources!$(RESET)"
	@read -p "Are you sure? [y/N] " confirm && [ "$$confirm" = "y" ] || exit 1
	docker system prune -a --volumes -f

## ПРОВЕРКИ ЗДОРОВЬЯ
## ============

health: ## Проверить здоровье всех сервисов
	@echo "$(CYAN)Checking service health...$(RESET)"
	@$(MAKE) health-infra
	@$(MAKE) health-backend
	@$(MAKE) health-frontend

health-infra:
	@docker exec goldpc-postgres pg_isready -U postgres -d goldpc >/dev/null 2>&1 && echo "$(GREEN)✓ PostgreSQL: healthy$(RESET)" || echo "$(RED)✗ PostgreSQL: unhealthy$(RESET)"
	@docker exec goldpc-redis redis-cli ping >/dev/null 2>&1 && echo "$(GREEN)✓ Redis: healthy$(RESET)" || echo "$(RED)✗ Redis: unhealthy$(RESET)"

health-backend:
	@curl -sf http://localhost:5001/health >/dev/null 2>&1 && echo "$(GREEN)✓ CatalogService: healthy$(RESET)" || echo "$(RED)✗ CatalogService: unhealthy$(RESET)"
	@curl -sf http://localhost:5002/health >/dev/null 2>&1 && echo "$(GREEN)✓ PCBuilderService: healthy$(RESET)" || echo "$(RED)✗ PCBuilderService: unhealthy$(RESET)"
	@curl -sf http://localhost:5003/health >/dev/null 2>&1 && echo "$(GREEN)✓ AuthService: healthy$(RESET)" || echo "$(RED)✗ AuthService: unhealthy$(RESET)"

health-frontend:
	@curl -sf http://localhost:3000/health >/dev/null 2>&1 && echo "$(GREEN)✓ Frontend: healthy$(RESET)" || echo "$(RED)✗ Frontend: unhealthy$(RESET)"

## УТИЛИТЫ
## ========

check-env: ## Проверить существование файла .env
	@if [ ! -f .env ]; then \
		echo "$(YELLOW)Warning: .env file not found$(RESET)"; \
		echo "Run 'make install' to create one from .env.example"; \
	fi

shell-backend: ## Открыть оболочку в контейнере бэкенда
	$(DOCKER_COMPOSE_DEV) exec catalogservice /bin/sh

shell-frontend: ## Открыть оболочку в контейнере фронтенда
	$(DOCKER_COMPOSE_DEV) exec frontend /bin/sh

version: ## Показать версии
	@echo "$(CYAN)Docker version:$(RESET)"
	@docker --version
	@echo "$(CYAN)Docker Compose version:$(RESET)"
	@$(DOCKER_COMPOSE) version
	@echo "$(CYAN).NET SDK version:$(RESET)"
	@dotnet --version 2>/dev/null || echo "not installed locally"

# =============================================================================
# Быстрые команды разработки
# =============================================================================
dev-quick: infra ## Быстрый запуск: только инфраструктура (запускать бэкенд локально)
	@echo "$(GREEN)Infrastructure ready. Run backend with: dotnet run$(RESET)"

dev-test: ## Запустить тестовое окружение
	@echo "$(CYAN)Starting test environment...$(RESET)"
	docker compose -f docker-compose.test.yml up -d
