#!/bin/bash

# =============================================================================
# Stryker.NET Mutation Testing Script for GoldPC
# =============================================================================
# This script runs mutation testing for the CatalogService using Stryker.NET.
# 
# Prerequisites:
#   - dotnet-stryker tool installed globally: dotnet tool install --global dotnet-stryker
#   - Tests must be passing before running mutation tests
#
# Usage:
#   ./scripts/run-mutation-tests.sh           # Run with default config
#   ./scripts/run-mutation-tests.sh --ci      # Run in CI mode (exit code on threshold breach)
#   ./scripts/run-mutation-tests.sh --help    # Show help
#
# Configuration: stryker-config.json
# =============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
CONFIG_FILE="$PROJECT_ROOT/stryker-config.json"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

show_help() {
    echo "Stryker.NET Mutation Testing Script for GoldPC"
    echo ""
    echo "Usage: $0 [options]"
    echo ""
    echo "Options:"
    echo "  --ci        Run in CI mode (exit with non-zero code if mutation score below break threshold)"
    echo "  --help, -h  Show this help message"
    echo ""
    echo "Configuration file: stryker-config.json"
    echo ""
    echo "Thresholds:"
    echo "  - High: 80% (excellent mutation score)"
    echo "  - Low:  60% (acceptable mutation score)"
    echo "  - Break: 50% (minimum required, CI fails below this)"
    echo ""
    echo "For more information, see: https://github.com/stryker-mutator/stryker-net"
}

# Parse arguments
CI_MODE=false
while [[ $# -gt 0 ]]; do
    case $1 in
        --ci)
            CI_MODE=true
            shift
            ;;
        --help|-h)
            show_help
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
done

# Check if dotnet-stryker is installed
if ! command -v dotnet-stryker &> /dev/null; then
    print_warning "Stryker.NET not found. Installing..."
    dotnet tool install --global dotnet-stryker
    
    # Refresh PATH if needed
    if ! command -v dotnet-stryker &> /dev/null; then
        print_error "Failed to install Stryker.NET. Please install manually:"
        print_error "  dotnet tool install --global dotnet-stryker"
        exit 1
    fi
fi

# Check if config file exists
if [[ ! -f "$CONFIG_FILE" ]]; then
    print_error "Configuration file not found: $CONFIG_FILE"
    exit 1
fi

# Navigate to project root
cd "$PROJECT_ROOT"

print_info "Running Stryker.NET mutation testing..."
print_info "Configuration: $CONFIG_FILE"
echo ""

# Build command
CMD="dotnet stryker --config-file $CONFIG_FILE"

if [[ "$CI_MODE" == true ]]; then
    print_info "Running in CI mode - will exit with error if mutation score < 50%"
    CMD="$CMD --reporter json --output StrykerOutput"
fi

# Run Stryker
if $CMD; then
    echo ""
    print_success "Mutation testing completed successfully!"
    print_info "Report generated in: $PROJECT_ROOT/StrykerOutput"
else
    EXIT_CODE=$?
    echo ""
    if [[ "$CI_MODE" == true ]]; then
        print_error "Mutation testing failed or mutation score below break threshold (50%)"
    else
        print_warning "Mutation testing completed with warnings or below threshold"
    fi
    exit $EXIT_CODE
fi