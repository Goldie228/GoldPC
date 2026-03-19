#!/bin/bash
# =============================================================================
# GoldPC Local Development Startup (without Docker)
# =============================================================================
# Usage: ./scripts/dev-local.sh [OPTIONS]
#
# Options:
#   --frontend-only    Start only frontend
#   --backend-only     Start only backend services
#   --infra-only       Start only infrastructure (postgres, redis) via Docker
#   --help             Show this help message
# =============================================================================
# NOTE: This script handles the '#' character in the project path by 
# copying frontend to /tmp for Vite compatibility.
# =============================================================================

set -e

# Colors
CYAN='\033[36m'
GREEN='\033[32m'
YELLOW='\033[33m'
RED='\033[31m'
RESET='\033[0m'

# Parse arguments
FRONTEND_ONLY=false
BACKEND_ONLY=false
INFRA_ONLY=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --frontend-only)
            FRONTEND_ONLY=true
            shift
            ;;
        --backend-only)
            BACKEND_ONLY=true
            shift
            ;;
        --infra-only)
            INFRA_ONLY=true
            shift
            ;;
        --help|-h)
            echo "GoldPC Local Development Startup"
            echo ""
            echo "Usage: ./scripts/dev-local.sh [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --frontend-only    Start only frontend"
            echo "  --backend-only     Start only backend services"
            echo "  --infra-only       Start only infrastructure (postgres, redis)"
            echo "  --help             Show this help message"
            exit 0
            ;;
        *)
            echo -e "${RED}Unknown option: $1${RESET}"
            exit 1
            ;;
    esac
done

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
FRONTEND_SRC="$PROJECT_DIR/src/frontend"
FRONTEND_TMP="/tmp/goldpc-frontend-dev"

echo -e "${CYAN}================================================${RESET}"
echo -e "${CYAN}   GoldPC Local Development Environment${RESET}"
echo -e "${CYAN}================================================${RESET}"
echo ""

# Function to start infrastructure
start_infra() {
    echo -e "${CYAN}Starting infrastructure (PostgreSQL, Redis)...${RESET}"
    docker compose -f "$PROJECT_DIR/docker/docker-compose.yml" up -d postgres redis
    
    # Wait for PostgreSQL to be ready
    echo -e "${CYAN}Waiting for PostgreSQL...${RESET}"
    sleep 3
    
    # Create databases if not exist
    echo -e "${CYAN}Creating databases...${RESET}"
    docker exec goldpc-postgres psql -U postgres -c "CREATE DATABASE goldpc_catalog;" 2>/dev/null || true
    docker exec goldpc-postgres psql -U postgres -c "CREATE DATABASE goldpc_auth;" 2>/dev/null || true
    docker exec goldpc-postgres psql -U postgres -c "CREATE DATABASE goldpc_orders;" 2>/dev/null || true
    docker exec goldpc-postgres psql -U postgres -c "CREATE DATABASE goldpc_services;" 2>/dev/null || true
    docker exec goldpc-postgres psql -U postgres -c "CREATE DATABASE goldpc_warranty;" 2>/dev/null || true
    
    echo -e "${GREEN}✓ Infrastructure ready${RESET}"
    echo -e "  PostgreSQL: localhost:5434"
    echo -e "  Redis: localhost:6379"
}

# Function to kill existing processes on ports
kill_existing_processes() {
    echo -e "${CYAN}Stopping existing services...${RESET}"
    pkill -f "dotnet run" 2>/dev/null || true
    pkill -f "vite" 2>/dev/null || true
    sleep 1
}

# Function to start backend services
start_backend() {
    echo -e "${CYAN}Starting backend services...${RESET}"
    
    # Kill any existing processes
    kill_existing_processes
    
    # Run each service in background
    cd "$PROJECT_DIR/src/CatalogService" && dotnet run --urls http://localhost:5000 &
    cd "$PROJECT_DIR/src/AuthService" && dotnet run --urls http://localhost:5001 &
    cd "$PROJECT_DIR/src/OrdersService" && dotnet run --urls http://localhost:5002 &
    cd "$PROJECT_DIR/src/PCBuilderService" && dotnet run --urls http://localhost:5005 &
    
    echo -e "${GREEN}✓ Backend services starting...${RESET}"
    echo -e "  CatalogService: http://localhost:5000/swagger"
    echo -e "  AuthService: http://localhost:5001/swagger"
    echo -e "  OrdersService: http://localhost:5002/swagger"
    echo -e "  PCBuilderService: http://localhost:5005/swagger"
}

# Function to start frontend
start_frontend() {
    echo -e "${CYAN}Preparing frontend...${RESET}"
    
    # Check if path contains '#' - Vite cannot handle this
    if [[ "$FRONTEND_SRC" == *"#"* ]]; then
        echo -e "${YELLOW}Path contains '#' character. Copying frontend to /tmp...${RESET}"
        
        # Remove old tmp directory
        rm -rf "$FRONTEND_TMP"
        
        # Copy frontend to tmp (excluding node_modules for speed)
        cp -r "$FRONTEND_SRC" "$FRONTEND_TMP"
        
        # Remove old node_modules if exists
        rm -rf "$FRONTEND_TMP/node_modules"
        
        # Always install dependencies in tmp
        echo -e "${CYAN}Installing dependencies in /tmp...${RESET}"
        cd "$FRONTEND_TMP" && npm install
        
        # Start from tmp directory
        echo -e "${CYAN}Starting frontend from /tmp...${RESET}"
        cd "$FRONTEND_TMP" && npm run dev &
    else
        # Start directly
        cd "$FRONTEND_SRC" && npm run dev &
    fi
    
    echo -e "${GREEN}✓ Frontend starting...${RESET}"
    echo -e "  Frontend: http://localhost:5173"
}

# Main execution
if [ "$INFRA_ONLY" = true ]; then
    start_infra
elif [ "$FRONTEND_ONLY" = true ]; then
    start_frontend
elif [ "$BACKEND_ONLY" = true ]; then
    start_backend
else
    # Start everything
    start_infra
    sleep 3
    start_backend
    sleep 3
    start_frontend
fi

echo ""
echo -e "${CYAN}================================================${RESET}"
echo -e "${CYAN}   Services Status${RESET}"
echo -e "${CYAN}================================================${RESET}"
echo -e "${GREEN}Frontend:${RESET}     http://localhost:5173"
echo -e "${GREEN}Catalog API:${RESET}  http://localhost:5000/swagger"
echo -e "${GREEN}Auth API:${RESET}     http://localhost:5001/swagger"
echo -e "${GREEN}Orders API:${RESET}   http://localhost:5002/swagger"
echo -e "${GREEN}PCBuilder API:${RESET} http://localhost:5005/swagger"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop all services${RESET}"

# Wait for all background processes
wait