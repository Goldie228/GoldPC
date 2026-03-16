#!/bin/bash
#===============================================================================
# Database Migration Script for GoldPC Project
#===============================================================================
# This script safely applies database migrations for microservices using
# Entity Framework Core with PostgreSQL.
#
# Usage: ./migrate.sh [OPTIONS]
#
# Options:
#   -s, --service      Service name (CatalogService, OrdersService, etc.)
#   -e, --environment  Environment (Development, Staging, Production)
#   -n, --no-backup    Skip backup creation (NOT RECOMMENDED for production)
#   -v, --verbose      Enable verbose output
#   -d, --dry-run      Show what would be done without executing
#   -h, --help         Show this help message
#
# Requirements:
#   - PostgreSQL client tools (pg_dump, psql)
#   - .NET SDK 8.0+
#   - EF Core tools (dotnet-ef)
#
# Zero-Downtime Migration Strategy:
#   This script follows the principle of backward-compatible migrations.
#   See the "Zero-Downtime Migration Strategy" section below for details.
#===============================================================================

set -e  # Exit on error
set -o pipefail  # Catch errors in pipes

#-------------------------------------------------------------------------------
# Configuration
#-------------------------------------------------------------------------------

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
SRC_DIR="$PROJECT_ROOT/src"
BACKUP_DIR="$PROJECT_ROOT/backups"
LOG_DIR="$PROJECT_ROOT/logs"

# Default values
SERVICE_NAME=""
ENVIRONMENT="Development"
NO_BACKUP=false
VERBOSE=false
DRY_RUN=false
TIMEOUT=300  # 5 minutes timeout for migrations

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

#-------------------------------------------------------------------------------
# Zero-Downtime Migration Strategy
#-------------------------------------------------------------------------------
#
# IMPORTANT: For production databases, follow this multi-step strategy to avoid
# downtime during schema changes:
#
# Phase 1: Add Column (Backward Compatible)
# ──────────────────────────────────────────
#   migrationBuilder.AddColumn<string>(
#       "NewColumn", 
#       "Orders", 
#       nullable: true);  // MUST be nullable!
//
#   ✓ Application continues working with old code
//   ✓ Old code ignores the new column
//   ✓ New code can use the column (handling nulls)
#
# Phase 2: Deploy Application Code
// ──────────────────────────────────────────
//   public class Order
//   {
//       public string? NewColumn { get; set; }  // Nullable in code
//
//       public string GetNewColumnSafe() => NewColumn ?? "default";
//   }
//
//   ✓ Deploy new version of application
//   ✓ Verify no errors in logs
//   ✓ Monitor for any issues
//
// Phase 3: Backfill Data (Background Task)
// ──────────────────────────────────────────
//   -- Run in batches during low traffic
//   UPDATE Orders SET NewColumn = 'default' 
//   WHERE NewColumn IS NULL 
//   AND id BETWEEN 1 AND 10000;
//
//   -- Or use a background job/service
//   ✓ Avoid locking the entire table
//   ✓ Process in small batches
//   ✓ Monitor performance impact
//
// Phase 4: Make NOT NULL (Final Migration)
// ──────────────────────────────────────────
//   -- Only after ALL data is populated
//   migrationBuilder.AlterColumn<string>(
//       "NewColumn", 
//       "Orders", 
//       nullable: false);
//
//   ✓ Requires all rows to have values
//   ✓ Creates CHECK constraint
//   ✓ Now fully enforced at DB level
//
// Breaking Changes (Require Coordination):
// ──────────────────────────────────────────
//   - Dropping columns: First deploy code that doesn't use column
//   - Renaming columns: Create new column, migrate data, update code, drop old
//   - Changing data types: Create new column, migrate, update code, swap names
//
// See: development-plan/11-deployment.md Section 11.4 for more details.
//------------------------------------------------------------------------------

#-------------------------------------------------------------------------------
# Helper Functions
#-------------------------------------------------------------------------------

log_info() {
    echo -e "${CYAN}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

log_debug() {
    if [[ "$VERBOSE" == true ]]; then
        echo -e "${BLUE}[DEBUG]${NC} $1"
    fi
}

show_help() {
    cat << EOF
Database Migration Script for GoldPC Project

Usage: $(basename "$0") [OPTIONS]

Options:
  -s, --service      Service name (required)
                     Available: CatalogService, OrdersService, AuthService, 
                                PCBuilderService, WarrantyService
  -e, --environment  Environment (default: Development)
                     Options: Development, Staging, Production
  -n, --no-backup    Skip backup creation (NOT RECOMMENDED for production)
  -v, --verbose      Enable verbose output
  -d, --dry-run      Show what would be done without executing
  -h, --help         Show this help message

Examples:
  # Apply migrations for CatalogService in Development
  $(basename "$0") -s CatalogService

  # Apply migrations for OrdersService in Production with verbose output
  $(basename "$0") -s OrdersService -e Production -v

  # Dry run to see what would happen
  $(basename "$0") -s CatalogService --dry-run

Zero-Downtime Migration Strategy:
  This script supports backward-compatible migrations. For production
  deployments, follow the multi-phase strategy documented in the script
  header and in development-plan/11-deployment.md Section 11.4.

Environment Variables:
  DATABASE_URL        Full PostgreSQL connection URL
  DB_HOST            Database host (default: localhost)
  DB_PORT            Database port (default: 5432)
  DB_NAME            Database name
  DB_USER            Database user
  DB_PASSWORD        Database password
  DB_CONNECTION_STRING  Full connection string (alternative to individual vars)

EOF
}

check_prerequisites() {
    log_info "Checking prerequisites..."
    
    local missing_tools=()
    
    # Check for dotnet
    if ! command -v dotnet &> /dev/null; then
        missing_tools+=("dotnet")
    fi
    
    # Check for dotnet-ef tool
    if ! dotnet ef --version &> /dev/null 2>&1; then
        log_warning "dotnet-ef tool not found. Installing..."
        dotnet tool install --global dotnet-ef 2>/dev/null || {
            missing_tools+=("dotnet-ef")
        }
    fi
    
    # Check for PostgreSQL tools (only if backup is needed)
    if [[ "$NO_BACKUP" == false ]]; then
        if ! command -v pg_dump &> /dev/null; then
            missing_tools+=("pg_dump (postgresql-client)")
        fi
        
        if ! command -v psql &> /dev/null; then
            missing_tools+=("psql (postgresql-client)")
        fi
    fi
    
    if [[ ${#missing_tools[@]} -gt 0 ]]; then
        log_error "Missing required tools: ${missing_tools[*]}"
        log_info "Please install missing tools and try again."
        exit 1
    fi
    
    log_success "All prerequisites met"
}

validate_service() {
    local service="$1"
    local valid_services=(
        "CatalogService"
        "OrdersService"
        "AuthService"
        "PCBuilderService"
        "WarrantyService"
    )
    
    for valid in "${valid_services[@]}"; do
        if [[ "$service" == "$valid" ]]; then
            return 0
        fi
    done
    
    log_error "Invalid service: $service"
    log_info "Valid services: ${valid_services[*]}"
    return 1
}

get_connection_string() {
    local service="$1"
    local env="$2"
    
    # First, try environment variable
    if [[ -n "$DB_CONNECTION_STRING" ]]; then
        echo "$DB_CONNECTION_STRING"
        return 0
    fi
    
    # Try DATABASE_URL (common format: postgresql://user:pass@host:port/db)
    if [[ -n "$DATABASE_URL" ]]; then
        # Convert DATABASE_URL to connection string format
        # postgresql://user:pass@host:port/db -> Host=host;Port=port;Database=db;Username=user;Password=pass
        local parsed_url
        parsed_url=$(echo "$DATABASE_URL" | sed -E 's|postgresql://([^:]+):([^@]+)@([^:]+):([0-9]+)/(.+)|Host=\3;Port=\4;Database=\5;Username=\1;Password=\2|')
        echo "$parsed_url"
        return 0
    fi
    
    # Build from individual components
    local host="${DB_HOST:-localhost}"
    local port="${DB_PORT:-5432}"
    local db_name="${DB_NAME:-goldpc_${service,,}}"  # Lowercase service name
    local user="${DB_USER:-goldpc}"
    local password="${DB_PASSWORD:-}"
    
    if [[ -n "$password" ]]; then
        echo "Host=$host;Port=$port;Database=$db_name;Username=$user;Password=$password"
    else
        echo "Host=$host;Port=$port;Database=$db_name;Username=$user"
    fi
}

get_db_version() {
    local conn_string="$1"
    
    log_debug "Querying database version..."
    
    # Parse connection string for psql
    local host port db_name user password
    
    # Extract components from connection string
    host=$(echo "$conn_string" | grep -oP 'Host=\K[^;]+' || echo "localhost")
    port=$(echo "$conn_string" | grep -oP 'Port=\K[^;]+' || echo "5432")
    db_name=$(echo "$conn_string" | grep -oP 'Database=\K[^;]+' || echo "postgres")
    user=$(echo "$conn_string" | grep -oP 'Username=\K[^;]+' || echo "postgres")
    password=$(echo "$conn_string" | grep -oP 'Password=\K[^;+' || echo "")
    
    # Export password for psql
    export PGPASSWORD="$password"
    
    # Check if __EFMigrationsHistory table exists
    local table_exists
    table_exists=$(psql -h "$host" -p "$port" -U "$user" -d "$db_name" -t -c \
        "SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = '__EFMigrationsHistory'
        );" 2>/dev/null | tr -d '[:space:]')
    
    if [[ "$table_exists" != "t" ]]; then
        echo "NONE (No migrations applied)"
        return 0
    fi
    
    # Get latest applied migration
    local latest_migration
    latest_migration=$(psql -h "$host" -p "$port" -U "$user" -d "$db_name" -t -c \
        "SELECT MigrationId FROM __EFMigrationsHistory ORDER BY MigrationId DESC LIMIT 1;" 2>/dev/null | tr -d '[:space:]')
    
    echo "${latest_migration:-NONE}"
    
    # Unset password
    unset PGPASSWORD
}

create_backup() {
    local conn_string="$1"
    local service="$2"
    local timestamp
    timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_file="$BACKUP_DIR/${service}_${timestamp}.sql"
    
    # Ensure backup directory exists
    mkdir -p "$BACKUP_DIR"
    
    log_info "Creating database backup..."
    log_debug "Backup file: $backup_file"
    
    # Parse connection string for pg_dump
    local host port db_name user password
    
    host=$(echo "$conn_string" | grep -oP 'Host=\K[^;]+' || echo "localhost")
    port=$(echo "$conn_string" | grep -oP 'Port=\K[^;]+' || echo "5432")
    db_name=$(echo "$conn_string" | grep -oP 'Database=\K[^;]+' || echo "postgres")
    user=$(echo "$conn_string" | grep -oP 'Username=\K[^;]+' || echo "postgres")
    password=$(echo "$conn_string" | grep -oP 'Password=\K[^;]+' || echo "")
    
    # Export password for pg_dump
    export PGPASSWORD="$password"
    
    if pg_dump -h "$host" -p "$port" -U "$user" -d "$db_name" -F p -f "$backup_file" 2>/dev/null; then
        local size
        size=$(du -h "$backup_file" | cut -f1)
        log_success "Backup created: $backup_file ($size)"
        echo "$backup_file"
    else
        log_error "Failed to create backup"
        unset PGPASSWORD
        return 1
    fi
    
    unset PGPASSWORD
}

get_pending_migrations() {
    local service="$1"
    local project_path="$SRC_DIR/$service"
    
    log_debug "Checking for pending migrations in $service..."
    
    # Navigate to project and check migrations
    cd "$project_path" 2>/dev/null || {
        log_error "Service directory not found: $project_path"
        return 1
    }
    
    # Get list of migrations and their status
    local output
    output=$(dotnet ef migrations list --no-color 2>&1) || {
        log_error "Failed to list migrations"
        cd "$PROJECT_ROOT"
        return 1
    }
    
    cd "$PROJECT_ROOT"
    
    # Count pending migrations (lines that don't contain "(Applied)")
    local pending
    pending=$(echo "$output" | grep -v "Applied" | grep -c "^[0-9]")
    
    echo "$pending"
}

apply_migrations() {
    local service="$1"
    local project_path="$SRC_DIR/$service"
    
    log_info "Applying migrations for $service..."
    
    cd "$project_path" 2>/dev/null || {
        log_error "Service directory not found: $project_path"
        return 1
    }
    
    # Apply migrations with timeout
    log_debug "Running: dotnet ef database update"
    
    local result
    if result=$(timeout "$TIMEOUT" dotnet ef database update --no-color 2>&1); then
        cd "$PROJECT_ROOT"
        if echo "$result" | grep -q "Done\|already up to date"; then
            log_success "Migrations applied successfully"
            return 0
        else
            log_error "Migration output indicates failure: $result"
            return 1
        fi
    else
        cd "$PROJECT_ROOT"
        log_error "Migration failed or timed out"
        log_debug "$result"
        return 1
    fi
}

verify_migration() {
    local conn_string="$1"
    local service="$2"
    
    log_info "Verifying migration success..."
    
    # Get new DB version
    local new_version
    new_version=$(get_db_version "$conn_string")
    
    # Check database connectivity
    local host port db_name user password
    host=$(echo "$conn_string" | grep -oP 'Host=\K[^;]+' || echo "localhost")
    port=$(echo "$conn_string" | grep -oP 'Port=\K[^;]+' || echo "5432")
    db_name=$(echo "$conn_string" | grep -oP 'Database=\K[^;]+' || echo "postgres")
    user=$(echo "$conn_string" | grep -oP 'Username=\K[^;]+' || echo "postgres")
    password=$(echo "$conn_string" | grep -oP 'Password=\K[^;]+' || echo "")
    
    export PGPASSWORD="$password"
    
    # Verify __EFMigrationsHistory table
    local table_check
    table_check=$(psql -h "$host" -p "$port" -U "$user" -d "$db_name" -t -c \
        "SELECT COUNT(*) FROM __EFMigrationsHistory;" 2>/dev/null | tr -d '[:space:]')
    
    unset PGPASSWORD
    
    if [[ "$table_check" -gt 0 ]] 2>/dev/null; then
        log_success "Verification passed: $table_check migrations recorded"
        log_info "Current DB version: $new_version"
        return 0
    else
        log_error "Verification failed: No migrations found in history"
        return 1
    fi
}

cleanup_old_backups() {
    local keep_count=${1:-10}
    
    log_debug "Cleaning up old backups (keeping last $keep_count)..."
    
    if [[ -d "$BACKUP_DIR" ]]; then
        ls -t "$BACKUP_DIR"/*.sql 2>/dev/null | tail -n +"$((keep_count + 1))" | while read -r file; do
            log_debug "Removing old backup: $file"
            rm -f "$file"
        done
    fi
}

#-------------------------------------------------------------------------------
# Main Script
#-------------------------------------------------------------------------------

parse_arguments() {
    while [[ $# -gt 0 ]]; do
        case "$1" in
            -s|--service)
                SERVICE_NAME="$2"
                shift 2
                ;;
            -e|--environment)
                ENVIRONMENT="$2"
                shift 2
                ;;
            -n|--no-backup)
                NO_BACKUP=true
                shift
                ;;
            -v|--verbose)
                VERBOSE=true
                shift
                ;;
            -d|--dry-run)
                DRY_RUN=true
                shift
                ;;
            -h|--help)
                show_help
                exit 0
                ;;
            *)
                log_error "Unknown option: $1"
                show_help
                exit 1
                ;;
        esac
    done
}

main() {
    local start_time
    start_time=$(date +%s)
    
    echo ""
    echo "========================================"
    echo "  GoldPC Database Migration Script"
    echo "========================================"
    echo ""
    
    # Validate required arguments
    if [[ -z "$SERVICE_NAME" ]]; then
        log_error "Service name is required. Use -s or --service option."
        show_help
        exit 1
    fi
    
    # Validate service name
    if ! validate_service "$SERVICE_NAME"; then
        exit 1
    fi
    
    log_info "Service: $SERVICE_NAME"
    log_info "Environment: $ENVIRONMENT"
    log_info "Timestamp: $(date '+%Y-%m-%d %H:%M:%S')"
    
    if [[ "$DRY_RUN" == true ]]; then
        log_warning "DRY RUN MODE - No changes will be made"
    fi
    
    # Check prerequisites
    check_prerequisites
    
    # Get connection string
    local conn_string
    conn_string=$(get_connection_string "$SERVICE_NAME" "$ENVIRONMENT")
    log_debug "Connection string: ${conn_string//Password=*/Password=***}"
    
    # Step 1: Check current DB version
    echo ""
    log_info "=== Step 1: Checking current database version ==="
    
    if [[ "$DRY_RUN" == true ]]; then
        log_info "[DRY RUN] Would check database version"
    else
        local current_version
        current_version=$(get_db_version "$conn_string")
        log_info "Current DB version: $current_version"
    fi
    
    # Step 2: Check for pending migrations
    echo ""
    log_info "=== Step 2: Checking for pending migrations ==="
    
    if [[ "$DRY_RUN" == true ]]; then
        log_info "[DRY RUN] Would check for pending migrations"
    else
        local pending
        pending=$(get_pending_migrations "$SERVICE_NAME")
        
        if [[ "$pending" -eq 0 ]]; then
            log_success "No pending migrations found"
            log_info "Database is up to date"
            exit 0
        fi
        
        log_info "Found $pending pending migration(s)"
    fi
    
    # Step 3: Create backup (unless skipped or dry run)
    echo ""
    log_info "=== Step 3: Creating backup ==="
    
    local backup_file=""
    if [[ "$NO_BACKUP" == true ]]; then
        log_warning "Backup skipped (--no-backup flag)"
    elif [[ "$DRY_RUN" == true ]]; then
        log_info "[DRY RUN] Would create database backup"
    else
        if [[ "$ENVIRONMENT" == "Production" ]]; then
            log_warning "Creating backup for Production environment"
        fi
        backup_file=$(create_backup "$conn_string" "$SERVICE_NAME") || {
            log_error "Backup creation failed. Aborting migration."
            exit 1
        }
    fi
    
    # Step 4: Apply migrations
    echo ""
    log_info "=== Step 4: Applying migrations ==="
    
    if [[ "$DRY_RUN" == true ]]; then
        log_info "[DRY RUN] Would apply migrations using: dotnet ef database update"
    else
        if ! apply_migrations "$SERVICE_NAME"; then
            log_error "Migration failed!"
            
            if [[ -n "$backup_file" && -f "$backup_file" ]]; then
                log_warning "A backup is available at: $backup_file"
                log_warning "To restore, run: psql $conn_string < $backup_file"
            fi
            
            exit 1
        fi
    fi
    
    # Step 5: Verify success
    echo ""
    log_info "=== Step 5: Verifying migration success ==="
    
    if [[ "$DRY_RUN" == true ]]; then
        log_info "[DRY RUN] Would verify migration"
    else
        if ! verify_migration "$conn_string" "$SERVICE_NAME"; then
            log_error "Verification failed!"
            exit 1
        fi
    fi
    
    # Cleanup old backups
    cleanup_old_backups 10
    
    # Summary
    local end_time duration
    end_time=$(date +%s)
    duration=$((end_time - start_time))
    
    echo ""
    echo "========================================"
    log_success "Migration completed successfully!"
    echo "========================================"
    log_info "Duration: ${duration}s"
    log_info "Service: $SERVICE_NAME"
    log_info "Environment: $ENVIRONMENT"
    
    if [[ -n "$backup_file" ]]; then
        log_info "Backup: $backup_file"
    fi
    
    echo ""
    log_info "Next steps:"
    echo "  1. Monitor application logs for any errors"
    echo "  2. Verify application functionality"
    echo "  3. For production: follow Zero-Downtime Migration Strategy"
    echo ""
    
    return 0
}

# Run main function with all arguments
parse_arguments "$@"
main