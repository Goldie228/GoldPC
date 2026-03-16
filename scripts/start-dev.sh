#!/bin/bash
# =============================================================================
# GoldPC Development Startup Script
# =============================================================================
# Usage: ./scripts/start-dev.sh [OPTIONS]
#
# Options:
#   --infra-only     Start only infrastructure (postgres, redis)
#   --backend-only   Start only backend services (requires infra running)
#   --frontend-only  Start only frontend service
#   --with-stubs     Start with mock/stub services
#   --skip-build     Skip building images
#   --detach, -d     Run in detached mode
#   --logs           Show logs after startup
#   --clean          Clean up before starting (removes containers)
#   --reset-db       Reset database (WARNING: destroys data)
#   --help, -h       Show this help message
# =============================================================================

set -e

# Colors for output
CYAN='\033[36m'
GREEN='\033[32m'
YELLOW='\033[33m'
RED='\033[31m'
RESET='\033[0m'

# Default options
INFRA_ONLY=false
BACKEND_ONLY=false
FRONTEND_ONLY=false
WITH_STUBS=false
SKIP_BUILD=false
DETACH=false
SHOW_LOGS=false
CLEAN=false
RESET_DB=false

# Parse arguments
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
        --with-stubs)
            WITH_STUBS=true
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
            echo "GoldPC Development Startup Script"
            echo ""
            echo "Usage: ./scripts/start-dev.sh [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --infra-only     Start only infrastructure (postgres, redis)"
            echo "  --backend-only   Start only backend services (requires infra running)"
            echo "  --frontend-only Start only frontend service"
            echo "  --with-stubs     Start with mock/stub services"
            echo "  --skip-build    Skip building images"
            echo "  --detach, -d    Run in detached mode"
            echo "  --logs          Show logs after startup"
            echo "  --clean         Clean up before starting"
            echo "  --reset-db      Reset database (WARNING: destroys data)"
            echo "  --help, -h      Show this help message"
            exit 0
            ;;
        *)
            echo -e "${RED}Unknown option: $1${RESET}"
            exit 1
            ;;
    esac
done

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
DOCKER_COMPOSE="docker compose -f $PROJECT_DIR/docker/docker-compose.yml"
DOCKER_COMPOSE_STUBS="docker compose -f $PROJECT_DIR/docker/docker-compose.stubs.yml"

# Change to project directory
cd "$PROJECT_DIR"

echo -e "${CYAN}================================================${RESET}"
echo -e "${CYAN}   GoldPC Development Environment${RESET}"
echo -e "${CYAN}================================================${RESET}"
echo ""

# Check if .env exists
check_env() {
    if [ ! -f "$PROJECT_DIR/.env" ]; then
        echo -e "${YELLOW}Warning: .env file not found${RESET}"
        if [ -f "$PROJECT_DIR/.env.example" ]; then
            echo -e "${CYAN}Creating .env from .env.example...${RESET}"
            cp "$PROJECT_DIR/.env.example" "$PROJECT_DIR/.env"
            echo -e "${GREEN}Created .env file. Please edit with your values.${RESET}"
        else
            echo -e "${RED}Error: .env.example not found!${RESET}"
            exit 1
        fi
    fi
}

# Clean up containers
do_clean() {
    echo -e "${CYAN}Cleaning up containers...${RESET}"
    $DOCKER_COMPOSE down
    echo -e "${GREEN}Cleanup complete${RESET}"
}

# Reset database
do_reset_db() {
    echo -e "${RED}WARNING: This will destroy all database data!${RESET}"
    read -p "Are you sure? [y/N] " confirm
    if [ "$confirm" = "y" ] || [ "$confirm" = "Y" ]; then
        echo -e "${CYAN}Resetting database...${RESET}"
        $DOCKER_COMPOSE down -v postgres
        echo -e "${GREEN}Database reset complete${RESET}"
    else
        echo -e "${YELLOW}Database reset cancelled${RESET}"
    fi
}

# Wait for service health
wait_for_healthy() {
    local service=$1
    local max_attempts=30
    local attempt=1
    
    echo -e "${CYAN}Waiting for $service to be healthy...${RESET}"
    
    while [ $attempt -le $max_attempts ]; do
        if docker exec "goldpc-$service" pg_isready -U postgres -d goldpc >/dev/null 2>&1 || \
           docker exec "goldpc-$service" redis-cli ping >/dev/null 2>&1; then
            echo -e "${GREEN}✓ $service is healthy${RESET}"
            return 0
        fi
        echo -n "."
        sleep 1
        ((attempt++))
    done
    
    echo -e "${RED}✗ $service health check failed${RESET}"
    return 1
}

# Build images
build_images() {
    if [ "$SKIP_BUILD" = true ]; then
        echo -e "${YELLOW}Skipping build (--skip-build)${RESET}"
        return
    fi
    
    echo -e "${CYAN}Building Docker images...${RESET}"
    $DOCKER_COMPOSE build
}

# Start infrastructure
start_infra() {
    echo -e "${CYAN}Starting infrastructure services...${RESET}"
    $DOCKER_COMPOSE up -d postgres redis
    
    # Wait for services to be healthy
    sleep 5
    
    echo -e "${GREEN}✓ PostgreSQL: localhost:5432${RESET}"
    echo -e "${GREEN}✓ Redis: localhost:6379${RESET}"
}

# Start backend services
start_backend() {
    echo -e "${CYAN}Starting backend services...${RESET}"
    
    # Check if infra is running
    if ! docker ps --format '{{.Names}}' | grep -q "goldpc-postgres"; then
        echo -e "${YELLOW}Infrastructure not running. Starting...${RESET}"
        start_infra
    fi
    
    $DOCKER_COMPOSE up -d catalogservice pcbuilderservice authservice
    
    echo -e "${GREEN}✓ CatalogService: http://localhost:5001${RESET}"
    echo -e "${GREEN}✓ PCBuilderService: http://localhost:5002${RESET}"
    echo -e "${GREEN}✓ AuthService: http://localhost:5003${RESET}"
}

# Start frontend
start_frontend() {
    echo -e "${CYAN}Starting frontend...${RESET}"
    $DOCKER_COMPOSE up -d frontend
    
    echo -e "${GREEN}✓ Frontend: http://localhost:3000${RESET}"
}

# Start with stubs
start_with_stubs() {
    echo -e "${CYAN}Starting with stub services...${RESET}"
    $DOCKER_COMPOSE_STUBS up -d
    
    echo -e "${GREEN}✓ Stub services started${RESET}"
}

# Show logs
show_logs() {
    echo -e "${CYAN}Showing logs (Ctrl+C to exit)...${RESET}"
    $DOCKER_COMPOSE logs -f
}

# Print service status
print_status() {
    echo ""
    echo -e "${CYAN}================================================${RESET}"
    echo -e "${CYAN}   Service Status${RESET}"
    echo -e "${CYAN}================================================${RESET}"
    $DOCKER_COMPOSE ps
    echo ""
    echo -e "${CYAN}Available endpoints:${RESET}"
    echo -e "  ${GREEN}Frontend:${RESET}     http://localhost:3000"
    echo -e "  ${GREEN}Catalog API:${RESET}  http://localhost:5001/swagger"
    echo -e "  ${GREEN}PCBuilder API:${RESET} http://localhost:5002/swagger"
    echo -e "  ${GREEN}Auth API:${RESET}     http://localhost:5003/swagger"
    echo -e "  ${GREEN}Adminer:${RESET}      http://localhost:8080"
    echo ""
}

# Main execution
main() {
    check_env
    
    # Handle clean option
    if [ "$CLEAN" = true ]; then
        do_clean
    fi
    
    # Handle reset-db option
    if [ "$RESET_DB" = true ]; then
        do_reset_db
    fi
    
    # Build images
    build_images
    
    # Start services based on options
    if [ "$WITH_STUBS" = true ]; then
        start_with_stubs
    elif [ "$INFRA_ONLY" = true ]; then
        start_infra
    elif [ "$BACKEND_ONLY" = true ]; then
        start_backend
    elif [ "$FRONTEND_ONLY" = true ]; then
        start_frontend
    else
        # Start everything
        start_infra
        sleep 5
        start_backend
        sleep 5
        start_frontend
    fi
    
    # Print status
    print_status
    
    # Handle logs option
    if [ "$SHOW_LOGS" = true ] && [ "$DETACH" = false ]; then
        show_logs
    fi
}

# Run main
main