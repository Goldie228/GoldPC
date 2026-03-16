#!/bin/bash
#
# GitHub Labels Setup Script
# Defines standard labels for PR feedback organization in GoldPC project
#
# Usage: ./setup-labels.sh [--dry-run]
#
# Prerequisites:
#   - GitHub CLI (gh) installed and authenticated
#   - Repository must exist on GitHub
#
# Reference: docs/processes/pr-labels.md
#

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
ORANGE='\033[0;33m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

DRY_RUN=false

# Parse arguments
if [[ "${1:-}" == "--dry-run" ]]; then
    DRY_RUN=true
    echo -e "${YELLOW}🔍 DRY RUN MODE - No changes will be made${NC}"
fi

# Check if gh CLI is installed
if ! command -v gh &> /dev/null; then
    echo -e "${RED}❌ GitHub CLI (gh) is not installed.${NC}"
    echo "Please install it from: https://cli.github.com/"
    exit 1
fi

# Check if gh is authenticated
if ! gh auth status &> /dev/null; then
    echo -e "${RED}❌ GitHub CLI is not authenticated.${NC}"
    echo "Please run: gh auth login"
    exit 1
fi

# Get repository info
REPO=$(gh repo view --json nameWithOwner -q '.nameWithOwner' 2>/dev/null || echo "")
if [[ -z "$REPO" ]]; then
    echo -e "${RED}❌ Could not determine repository. Are you in a GitHub repository?${NC}"
    exit 1
fi

echo -e "${GREEN}📁 Repository: $REPO${NC}"
echo ""

# Function to create or update a label
create_or_update_label() {
    local name="$1"
    local color="$2"
    local description="$3"
    
    if $DRY_RUN; then
        echo -e "  ${BLUE}Would create/update label:${NC}"
        echo -e "    Name: ${name}"
        echo -e "    Color: #${color}"
        echo -e "    Description: ${description}"
        return
    fi
    
    # Check if label exists
    if gh label view "$name" &> /dev/null; then
        echo -e "  ${YELLOW}Updating existing label: ${name}${NC}"
        gh label edit "$name" --color "$color" --description "$description"
    else
        echo -e "  ${GREEN}Creating new label: ${name}${NC}"
        gh label create "$name" --color "$color" --description "$description"
    fi
}

echo -e "${BLUE}🏷️  Setting up GitHub Labels...${NC}"
echo ""

# ===========================================
# Priority Labels (from Section 9.4)
# ===========================================

echo -e "${PURPLE}📋 Priority Labels:${NC}"

create_or_update_label "blocker" "D73A4A" "🔴 Blocks merge. Must be fixed immediately."

create_or_update_label "major" "D93F0B" "🟠 Needs fix before merge. Should be addressed within 1 day."

create_or_update_label "minor" "FBCA04" "🟡 Fix later. Can be addressed within 3 days. Does not block merge."

create_or_update_label "suggestion" "1D76DB" "🔵 Optional improvement. Does not block merge."

echo ""

# ===========================================
# Category Labels
# ===========================================

echo -e "${PURPLE}📂 Category Labels:${NC}"

create_or_update_label "security" "B60205" "🔒 Security-related issue. Requires careful review."

create_or_update_label "architecture" "5319E7" "🏗️ Architectural change. May affect system structure."

create_or_update_label "breaking-change" "E99695" "⚠️ Breaking change. Requires migration or coordination."

echo ""

# ===========================================
# Additional Useful Labels
# ===========================================

echo -e "${PURPLE}📌 Additional Labels:${NC}"

create_or_update_label "discussion" "C5DEF5" "💬 Needs discussion before proceeding."

create_or_update_label "documentation" "0075CA" "📄 Changes or improvements to documentation."

create_or_update_label "tests" "0E8A16" "🧪 Related to testing infrastructure."

create_or_update_label "frontend" "D4C5F9" "🌐 Frontend-related changes."

create_or_update_label "backend" "BFDADC" "⚙️ Backend-related changes."

create_or_update_label "infrastructure" "F9D0C4" "🔧 Infrastructure/DevOps changes."

create_or_update_label "needs-review" "FBCA04" "👀 Ready for review."

create_or_update_label "work-in-progress" "EDEDED" "🚧 Work in progress. Do not merge."

create_or_update_label "approved" "0E8A16" "✅ Approved for merge."

create_or_update_label "needs-attention" "B60205" "⚠️ Requires human attention."

echo ""

if $DRY_RUN; then
    echo -e "${YELLOW}🔍 DRY RUN COMPLETE - No changes were made${NC}"
    echo "Run without --dry-run to apply changes."
else
    echo -e "${GREEN}✅ GitHub Labels setup complete!${NC}"
fi

echo ""
echo -e "${BLUE}📚 See docs/processes/pr-labels.md for label usage guidelines.${NC}"