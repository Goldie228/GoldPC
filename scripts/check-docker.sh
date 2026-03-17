#!/bin/bash
# =============================================================================
# GoldPC Docker Environment Check Script
# =============================================================================
# Usage: ./scripts/check-docker.sh
#
# This script verifies that the environment is ready for building:
#   - Docker daemon is running
#   - Ports 3001 and 8081 are not occupied
#   - Required folders (src/CatalogService, src/frontend) exist
# =============================================================================

set -e

# Colors for output
CYAN='\033[36m'
GREEN='\033[32m'
YELLOW='\033[33m'
RED='\033[31m'
RESET='\033[0m'

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

# Track check status
ALL_CHECKS_PASSED=true

echo -e "${CYAN}================================================${RESET}"
echo -e "${CYAN}   GoldPC Docker Environment Check${RESET}"
echo -e "${CYAN}================================================${RESET}"
echo ""

# Check 1: Docker is running
check_docker_running() {
    echo -e "${CYAN}[1/3] Checking if Docker is running...${RESET}"
    
    if docker info >/dev/null 2>&1; then
        echo -e "${GREEN}✓ Docker daemon is running${RESET}"
        return 0
    else
        echo -e "${RED}✗ Docker daemon is not running${RESET}"
        echo -e "${YELLOW}  Please start Docker and try again${RESET}"
        ALL_CHECKS_PASSED=false
        return 1
    fi
}

# Check 2: Ports 3001 and 8081 are not occupied
check_ports_available() {
    echo ""
    echo -e "${CYAN}[2/3] Checking if required ports are available...${RESET}"
    
    local ports_check_passed=true
    
    # Check port 3001
    if ss -tuln 2>/dev/null | grep -q ":3001 " || \
       netstat -tuln 2>/dev/null | grep -q ":3001 " || \
       lsof -i :3001 2>/dev/null | grep -q LISTEN; then
        echo -e "${RED}✗ Port 3001 is already in use${RESET}"
        ports_check_passed=false
    else
        echo -e "${GREEN}✓ Port 3001 is available${RESET}"
    fi
    
    # Check port 8081
    if ss -tuln 2>/dev/null | grep -q ":8081 " || \
       netstat -tuln 2>/dev/null | grep -q ":8081 " || \
       lsof -i :8081 2>/dev/null | grep -q LISTEN; then
        echo -e "${RED}✗ Port 8081 is already in use${RESET}"
        ports_check_passed=false
    else
        echo -e "${GREEN}✓ Port 8081 is available${RESET}"
    fi
    
    if [ "$ports_check_passed" = false ]; then
        ALL_CHECKS_PASSED=false
        return 1
    fi
    
    return 0
}

# Check 3: Required folders exist
check_required_folders() {
    echo ""
    echo -e "${CYAN}[3/3] Checking if required folders exist...${RESET}"
    
    local folders_check_passed=true
    
    # Check src/CatalogService
    if [ -d "$PROJECT_DIR/src/CatalogService" ]; then
        echo -e "${GREEN}✓ src/CatalogService exists${RESET}"
    else
        echo -e "${RED}✗ src/CatalogService not found${RESET}"
        folders_check_passed=false
    fi
    
    # Check src/frontend
    if [ -d "$PROJECT_DIR/src/frontend" ]; then
        echo -e "${GREEN}✓ src/frontend exists${RESET}"
    else
        echo -e "${RED}✗ src/frontend not found${RESET}"
        folders_check_passed=false
    fi
    
    if [ "$folders_check_passed" = false ]; then
        ALL_CHECKS_PASSED=false
        return 1
    fi
    
    return 0
}

# Main execution
main() {
    check_docker_running
    check_ports_available
    check_required_folders
    
    echo ""
    echo -e "${CYAN}================================================${RESET}"
    
    if [ "$ALL_CHECKS_PASSED" = true ]; then
        echo -e "${GREEN}Ready to build${RESET}"
        exit 0
    else
        echo -e "${RED}Some checks failed. Please fix the issues above.${RESET}"
        exit 1
    fi
}

# Run main
main