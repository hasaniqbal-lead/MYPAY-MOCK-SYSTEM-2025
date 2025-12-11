#!/bin/bash

###############################################################################
# MyPay Mock Platform - Rollback Script
# Version: 1.0.0
# Description: Rollback to previous deployment or restore from backup
###############################################################################

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
PROJECT_DIR="/opt/mypay-mock"
BACKUP_DIR="${PROJECT_DIR}/backups"
LOG_FILE="${PROJECT_DIR}/logs/rollback-$(date +%Y%m%d-%H%M%S).log"

# Logging function
log() {
    echo "$1" | tee -a "$LOG_FILE"
}

# Print header
echo ""
echo "=============================================================================="
echo "  MyPay Mock Platform - Rollback Utility"
echo "  Time: $(date '+%Y-%m-%d %H:%M:%S')"
echo "=============================================================================="
echo ""

# Check if running as root
if [[ $EUID -ne 0 ]]; then
    echo -e "${RED}ERROR: This script must be run as root${NC}"
    exit 1
fi

# Create directories
mkdir -p "${BACKUP_DIR}" "$(dirname "$LOG_FILE")"

# Function to stop current deployment
stop_current_deployment() {
    log "${YELLOW}Stopping current deployment...${NC}"

    cd "$PROJECT_DIR"

    if docker compose ps --services 2>/dev/null | grep -q .; then
        docker compose down --timeout 30
        log "${GREEN}Current deployment stopped${NC}"
    else
        log "${YELLOW}No running deployment found${NC}"
    fi
}

# Function to restore database from backup
restore_database() {
    local backup_file=$1

    log "${YELLOW}Restoring database from backup...${NC}"

    if [[ ! -f "$backup_file" ]]; then
        log "${RED}ERROR: Backup file not found: $backup_file${NC}"
        return 1
    fi

    # Start MySQL container if not running
    cd "$PROJECT_DIR"
    if ! docker compose ps mysql | grep -q "Up"; then
        log "${YELLOW}Starting MySQL container...${NC}"
        docker compose up -d mysql
        sleep 10
    fi

    # Decompress if needed
    if [[ "$backup_file" == *.gz ]]; then
        log "${YELLOW}Decompressing backup...${NC}"
        gunzip -c "$backup_file" | docker compose exec -T mysql mysql -u root -p"${DB_PASSWORD:-MyPay@Secure2025!}"
    else
        docker compose exec -T mysql mysql -u root -p"${DB_PASSWORD:-MyPay@Secure2025!}" < "$backup_file"
    fi

    if [[ $? -eq 0 ]]; then
        log "${GREEN}Database restored successfully${NC}"
        return 0
    else
        log "${RED}ERROR: Database restore failed${NC}"
        return 1
    fi
}

# Main rollback menu
main_menu() {
    echo ""
    echo "Select rollback option:"
    echo ""
    echo "1) Quick rollback - Restart services with current code"
    echo "2) Database rollback - Restore database from backup"
    echo "3) Full rollback - Stop services and restore database"
    echo "4) List available backups"
    echo "5) Cancel"
    echo ""
    read -p "Enter option [1-5]: " option

    case $option in
        1)
            quick_rollback
            ;;
        2)
            database_rollback
            ;;
        3)
            full_rollback
            ;;
        4)
            list_backups
            main_menu
            ;;
        5)
            log "${YELLOW}Rollback cancelled${NC}"
            exit 0
            ;;
        *)
            log "${RED}Invalid option${NC}"
            main_menu
            ;;
    esac
}

# Quick rollback - just restart services
quick_rollback() {
    log "${BLUE}=== QUICK ROLLBACK ===${NC}"

    cd "$PROJECT_DIR"

    log "${YELLOW}Restarting all services...${NC}"
    docker compose restart

    sleep 5

    log "${YELLOW}Checking service health...${NC}"
    docker compose ps

    log "${GREEN}Quick rollback completed${NC}"
    log "Check service status with: docker compose ps"
}

# Database rollback
database_rollback() {
    log "${BLUE}=== DATABASE ROLLBACK ===${NC}"

    # List available backups
    echo ""
    echo "Available database backups:"
    echo ""

    backups=($(find "$BACKUP_DIR" -name "mysql-backup-*.sql*" -type f 2>/dev/null | sort -r))

    if [[ ${#backups[@]} -eq 0 ]]; then
        log "${RED}ERROR: No database backups found in $BACKUP_DIR${NC}"
        return 1
    fi

    for i in "${!backups[@]}"; do
        backup_file="${backups[$i]}"
        backup_date=$(basename "$backup_file" | sed 's/mysql-backup-//' | sed 's/\.sql.*//')
        backup_size=$(du -h "$backup_file" | awk '{print $1}')
        echo "  $((i+1))) $backup_date ($backup_size)"
    done

    echo ""
    read -p "Select backup number to restore [1-${#backups[@]}]: " backup_num

    if [[ $backup_num -ge 1 ]] && [[ $backup_num -le ${#backups[@]} ]]; then
        selected_backup="${backups[$((backup_num-1))]}"

        echo ""
        log "${RED}WARNING: This will overwrite the current database!${NC}"
        read -p "Are you sure you want to continue? (yes/no): " confirm

        if [[ "$confirm" == "yes" ]]; then
            restore_database "$selected_backup"

            # Restart services
            log "${YELLOW}Restarting services...${NC}"
            docker compose restart payout-api payment-api merchant-portal admin-portal

            log "${GREEN}Database rollback completed${NC}"
        else
            log "${YELLOW}Database rollback cancelled${NC}"
        fi
    else
        log "${RED}Invalid selection${NC}"
    fi
}

# Full rollback
full_rollback() {
    log "${BLUE}=== FULL ROLLBACK ===${NC}"

    echo ""
    log "${RED}WARNING: This will stop all services and restore from backup!${NC}"
    read -p "Are you sure you want to continue? (yes/no): " confirm

    if [[ "$confirm" != "yes" ]]; then
        log "${YELLOW}Full rollback cancelled${NC}"
        return
    fi

    # Stop current deployment
    stop_current_deployment

    # Database rollback
    database_rollback

    # Start services
    log "${YELLOW}Starting services...${NC}"
    cd "$PROJECT_DIR"
    docker compose up -d

    # Wait for services
    log "${YELLOW}Waiting for services to start...${NC}"
    sleep 15

    # Health check
    log "${YELLOW}Running health check...${NC}"
    docker compose ps

    log "${GREEN}Full rollback completed${NC}"
}

# List backups
list_backups() {
    echo ""
    echo "=============================================================================="
    echo "  Available Backups"
    echo "=============================================================================="
    echo ""

    backups=$(find "$BACKUP_DIR" -name "*.sql*" -o -name "*.tar.gz" 2>/dev/null | sort -r)

    if [[ -z "$backups" ]]; then
        echo "No backups found in $BACKUP_DIR"
    else
        echo "Database Backups:"
        find "$BACKUP_DIR" -name "mysql-backup-*.sql*" 2>/dev/null | sort -r | while read file; do
            size=$(du -h "$file" | awk '{print $1}')
            date=$(basename "$file" | sed 's/mysql-backup-//' | sed 's/\.sql.*//')
            echo "  - $date ($size)"
        done

        echo ""
        echo "Full Backups:"
        find "$BACKUP_DIR" -name "*.tar.gz" -not -name "mysql-backup-*" 2>/dev/null | sort -r | while read file; do
            size=$(du -h "$file" | awk '{print $1}')
            name=$(basename "$file")
            echo "  - $name ($size)"
        done
    fi

    echo ""
    echo "Total backup size: $(du -sh "$BACKUP_DIR" 2>/dev/null | awk '{print $1}')"
    echo ""
}

# Emergency stop
emergency_stop() {
    log "${RED}=== EMERGENCY STOP ===${NC}"

    echo ""
    log "${YELLOW}This will immediately stop all MyPay services${NC}"
    read -p "Continue? (yes/no): " confirm

    if [[ "$confirm" == "yes" ]]; then
        docker compose down --timeout 10
        docker stop $(docker ps -a | grep mypay | awk '{print $1}') 2>/dev/null || true
        log "${GREEN}All services stopped${NC}"
    fi
}

# Check if emergency flag is passed
if [[ "${1:-}" == "--emergency" ]]; then
    emergency_stop
    exit 0
fi

# Run main menu
main_menu

echo ""
log "Rollback log saved to: $LOG_FILE"
echo ""
