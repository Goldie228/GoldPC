# =============================================================================
# GoldPC Makefile - Development and Deployment Automation
# =============================================================================
# Usage: make <target>
# Run 'make help' to see all available targets
# =============================================================================

SHELL := /bin/bash
DOCKER_COMPOSE := docker compose
DOCKER_COMPOSE_DEV := docker compose -f docker/docker-compose.yml
DOCKER_COMPOSE_PROD := docker compose -f docker/docker-compose.prod.yml
PROJECT_NAME := goldpc

# Colors for output
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
# DEFAULT TARGET
# =============================================================================
help: ## Show this help message
	@echo "$(CYAN)GoldPC Development Commands$(RESET)"
	@echo ""
	@awk 'BEGIN {FS = ":.*##"; section=""} \
		/^## / { section=substr($$0, 4); printf "\n$(YELLOW)%s$(RESET)\n", section } \
		/^[a-zA-Z_-]+:.*##/ { printf "  $(GREEN)%-20s$(RESET) %s\n", $$1, $$2 }' $(MAKEFILE_LIST)
	@echo ""

## INSTALLATION
## ============

install: check-env ## Install dependencies (copy .env.example to .env if not exists)
	@if [ ! -f .env ]; then \
		cp .env.example .env; \
		echo "$(GREEN)Created .env from .env.example$(RESET)"; \
		echo "$(YELLOW)Please edit .env with your values$(RESET)"; \
	fi
	@echo "$(GREEN)Dependencies ready!$(RESET)"

## DEVELOPMENT
## ==========

dev: infra backend frontend ## Start full development environment
	@echo "$(GREEN)Development environment is ready!$(RESET)"
	@echo "Services:"
	@echo "  - Frontend: http://localhost:3000"
	@echo "  - Catalog API: http://localhost:5001"
	@echo "  - PCBuilder API: http://localhost:5002"
	@echo "  - Auth API: http://localhost:5003"
	@echo "  - Adminer: http://localhost:8080"

infra: ## Start infrastructure services (postgres, redis)
	@echo "$(CYAN)Starting infrastructure services...$(RESET)"
	$(DOCKER_COMPOSE_DEV) up -d postgres redis
	@echo "$(GREEN)Waiting for services to be healthy...$(RESET)"
	@sleep 5
	@$(MAKE) health-infra

backend: ## Start backend services
	@echo "$(CYAN)Starting backend services...$(RESET)"
	$(DOCKER_COMPOSE_DEV) up -d catalogservice pcbuilderservice authservice
	@echo "$(GREEN)Waiting for backend services...$(RESET)"
	@sleep 10

frontend: ## Start frontend service
	@echo "$(CYAN)Starting frontend...$(RESET)"
	$(DOCKER_COMPOSE_DEV) up -d frontend

up: ## Start all services
	@echo "$(CYAN)Starting all services...$(RESET)"
	$(DOCKER_COMPOSE_DEV) up -d

down: ## Stop all services
	@echo "$(CYAN)Stopping all services...$(RESET)"
	$(DOCKER_COMPOSE_DEV) down

logs: ## Show logs for all services (Ctrl+C to exit)
	$(DOCKER_COMPOSE_DEV) logs -f

logs-backend: ## Show backend logs
	$(DOCKER_COMPOSE_DEV) logs -f catalogservice pcbuilderservice authservice

logs-infra: ## Show infrastructure logs
	$(DOCKER_COMPOSE_DEV) logs -f postgres redis

ps: ## Show running containers
	$(DOCKER_COMPOSE_DEV) ps

status: ps ## Alias for 'ps'

## BUILDING
## ========

build: ## Build all services
	@echo "$(CYAN)Building all services...$(RESET)"
	$(DOCKER_COMPOSE_DEV) build

rebuild: ## Rebuild all services (no cache)
	@echo "$(CYAN)Rebuilding all services without cache...$(RESET)"
	$(DOCKER_COMPOSE_DEV) build --no-cache

build-backend: ## Build backend services only
	$(DOCKER_COMPOSE_DEV) build catalogservice pcbuilderservice authservice

build-frontend: ## Build frontend only
	$(DOCKER_COMPOSE_DEV) build frontend

## DATABASE
## =======

db-shell: ## Open PostgreSQL shell
	$(DOCKER_COMPOSE_DEV) exec postgres psql -U postgres -d goldpc

db-reset: ## Reset database (WARNING: destroys all data)
	@echo "$(RED)WARNING: This will destroy all database data!$(RESET)"
	@read -p "Are you sure? [y/N] " confirm && [ "$$confirm" = "y" ] || exit 1
	$(DOCKER_COMPOSE_DEV) down -v postgres
	$(DOCKER_COMPOSE_DEV) up -d postgres
	@echo "$(GREEN)Database reset complete$(RESET)"

db-migrate: ## Run database migrations
	@echo "$(CYAN)Running migrations...$(RESET)"
	cd scripts/db && ./migrate.sh

db-seed: ## Seed database with test data
	@echo "$(CYAN)Seeding database...$(RESET)"
	$(DOCKER_COMPOSE_DEV) exec catalogservice dotnet seed

db-seed-xcore: ## Импорт товаров X-Core из scripts/scraper/data/xcore-products.json
	@echo "$(CYAN)Импорт товаров X-Core...$(RESET)"
	cd src/CatalogService && dotnet run -- seed-xcore

scraper-fetch-images: ## Загрузить изображения с x-core.by (div.slides) -> xcore-images.json
	@echo "$(CYAN)Загрузка изображений товаров...$(RESET)"
	cd scripts/scraper && npm run fetch-images

db-update-images: ## Обновить картинки в БД из xcore-images.json (после scraper-fetch-images)
	@echo "$(CYAN)Обновление изображений в БД...$(RESET)"
	cd src/CatalogService && dotnet run -- seed-xcore-images

db-admin: ## Open Adminer database UI
	@echo "$(GREEN)Adminer available at: http://localhost:8080$(RESET)"
	$(DOCKER_COMPOSE_DEV) up -d adminer

backup: ## Backup database to file
	@echo "$(CYAN)Creating database backup...$(RESET)"
	@mkdir -p backups
	$(DOCKER_COMPOSE_DEV) exec postgres pg_dump -U postgres goldpc > backups/backup_$$(date +%Y%m%d_%H%M%S).sql
	@echo "$(GREEN)Backup created in backups/$(RESET)"

restore: ## Restore database from backup (use: make restore FILE=backups/backup.sql)
ifndef FILE
	@echo "$(RED)Error: FILE parameter required$(RESET)"
	@echo "Usage: make restore FILE=backups/backup.sql"
	@exit 1
endif
	@echo "$(CYAN)Restoring database from $(FILE)...$(RESET)"
	$(DOCKER_COMPOSE_DEV) exec -T postgres psql -U postgres goldpc < $(FILE)
	@echo "$(GREEN)Database restored$(RESET)"

## REDIS
## =====

redis-shell: ## Open Redis CLI
	$(DOCKER_COMPOSE_DEV) exec redis redis-cli

redis-flush: ## Flush Redis cache (WARNING: clears all cache)
	@echo "$(RED)WARNING: This will clear all Redis data!$(RESET)"
	@read -p "Are you sure? [y/N] " confirm && [ "$$confirm" = "y" ] || exit 1
	$(DOCKER_COMPOSE_DEV) exec redis redis-cli FLUSHALL
	@echo "$(GREEN)Redis cache cleared$(RESET)"

## TESTING
## =======

test: test-unit test-integration ## Run all tests

test-unit: ## Run unit tests
	@echo "$(CYAN)Running unit tests...$(RESET)"
	cd src && dotnet test --filter "FullyQualifiedName~Unit" --logger "console;verbosity=normal"

test-integration: ## Run integration tests
	@echo "$(CYAN)Running integration tests...$(RESET)"
	cd src && dotnet test --filter "FullyQualifiedName~Integration" --logger "console;verbosity=normal"

test-e2e: ## Run end-to-end tests
	@echo "$(CYAN)Running E2E tests...$(RESET)"
	cd tests/e2e && npm test

test-coverage: ## Run tests with coverage report
	@echo "$(CYAN)Running tests with coverage...$(RESET)"
	cd src && dotnet test --collect:"XPlat Code Coverage"

## CODE QUALITY
## ===========

lint: ## Run linters
	@echo "$(CYAN)Running linters...$(RESET)"
	cd src && dotnet format --verify-no-changes --severity warn
	@cd src/frontend && npm run lint 2>/dev/null || true

format: ## Format code
	@echo "$(CYAN)Formatting code...$(RESET)"
	cd src && dotnet format
	@cd src/frontend && npm run format 2>/dev/null || true

security: ## Run security scans
	@echo "$(CYAN)Running security scans...$(RESET)"
	@command -v trivy >/dev/null 2>&1 && trivy image goldpc-backend:latest || echo "$(YELLOW)trivy not installed, skipping$(RESET)"
	@command -v snyk >/dev/null 2>&1 && snyk test || echo "$(YELLOW)snyk not installed, skipping$(RESET)"

## PRODUCTION
## =========

prod-up: ## Start production environment (blue slot)
	@echo "$(CYAN)Starting production (blue slot)...$(RESET)"
	$(DOCKER_COMPOSE_PROD) --profile blue up -d

prod-up-green: ## Start production environment (green slot)
	@echo "$(CYAN)Starting production (green slot)...$(RESET)"
	$(DOCKER_COMPOSE_PROD) --profile green up -d

prod-down: ## Stop production environment
	@echo "$(CYAN)Stopping production...$(RESET)"
	$(DOCKER_COMPOSE_PROD) down

prod-logs: ## Show production logs
	$(DOCKER_COMPOSE_PROD) logs -f

prod-switch: ## Switch from blue to green (or vice versa)
	@echo "$(CYAN)Switching deployment slots...$(RESET)"
	@# This would typically update nginx config
	@echo "$(YELLOW)Manual nginx reconfiguration required$(RESET)"

prod-build: ## Build production images
	@echo "$(CYAN)Building production images...$(RESET)"
	$(DOCKER_COMPOSE_PROD) build

prod-push: ## Push production images to registry
	@echo "$(CYAN)Pushing images to registry...$(RESET)"
	$(DOCKER_COMPOSE_PROD) push

## MONITORING
## =========

monitoring-up: ## Start monitoring stack (Prometheus + Grafana)
	@echo "$(CYAN)Starting monitoring stack...$(RESET)"
	$(DOCKER_COMPOSE_PROD) --profile monitoring up -d
	@echo "$(GREEN)Prometheus: http://localhost:9090$(RESET)"
	@echo "$(GREEN)Grafana: http://localhost:3002$(RESET)"

monitoring-down: ## Stop monitoring stack
	$(DOCKER_COMPOSE_PROD) --profile monitoring down

## CLEANUP
## ======

clean: ## Stop and remove containers, keep volumes
	$(DOCKER_COMPOSE_DEV) down
	@echo "$(GREEN)Cleaned up containers$(RESET)"

clean-all: ## Stop and remove containers AND volumes (WARNING: data loss!)
	@echo "$(RED)WARNING: This will remove all data!$(RESET)"
	@read -p "Are you sure? [y/N] " confirm && [ "$$confirm" = "y" ] || exit 1
	$(DOCKER_COMPOSE_DEV) down -v --rmi local
	@echo "$(GREEN)Cleaned up all containers, volumes and local images$(RESET)"

docker-clean: ## Remove dangling Docker resources
	docker system prune -f

docker-prune: ## Full Docker cleanup (WARNING: removes unused resources)
	@echo "$(RED)WARNING: This will remove all unused Docker resources!$(RESET)"
	@read -p "Are you sure? [y/N] " confirm && [ "$$confirm" = "y" ] || exit 1
	docker system prune -a --volumes -f

## HEALTH CHECKS
## ============

health: ## Check health of all services
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

## UTILITIES
## ========

check-env: ## Check if .env file exists
	@if [ ! -f .env ]; then \
		echo "$(YELLOW)Warning: .env file not found$(RESET)"; \
		echo "Run 'make install' to create one from .env.example"; \
	fi

shell-backend: ## Open shell in backend container
	$(DOCKER_COMPOSE_DEV) exec catalogservice /bin/sh

shell-frontend: ## Open shell in frontend container
	$(DOCKER_COMPOSE_DEV) exec frontend /bin/sh

version: ## Show versions
	@echo "$(CYAN)Docker version:$(RESET)"
	@docker --version
	@echo "$(CYAN)Docker Compose version:$(RESET)"
	@$(DOCKER_COMPOSE) version
	@echo "$(CYAN).NET SDK version:$(RESET)"
	@dotnet --version 2>/dev/null || echo "not installed locally"

# =============================================================================
# Development Shortcuts
# =============================================================================
dev-quick: infra ## Quick dev: start infra only (run backend locally)
	@echo "$(GREEN)Infrastructure ready. Run backend with: dotnet run$(RESET)"

dev-stubs: ## Start with stub services
	@echo "$(CYAN)Starting stub services...$(RESET)"
	docker compose -f docker/docker-compose.stubs.yml up -d

dev-test: ## Start test environment
	@echo "$(CYAN)Starting test environment...$(RESET)"
	docker compose -f docker-compose.test.yml up -d