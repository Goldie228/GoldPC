#!/usr/bin/env bash
# Seed default admin user for GoldPC
# Usage: bash scripts/seed-data/seed-admin-user.sh

set -e

AUTH_URL="http://localhost:5001/api/v1/auth"

ADMIN_EMAIL="${ADMIN_EMAIL:-admin@goldpc.by}"
ADMIN_PASSWORD="${ADMIN_PASSWORD:-G0ldPC#Adm1n2026!}"
ADMIN_FIRST="${ADMIN_FIRST:-Админ}"
ADMIN_LAST="${ADMIN_LAST:-Системы}"
ADMIN_PHONE="${ADMIN_PHONE:-+375291000001}"

echo "🔑 Seeding admin user: $ADMIN_EMAIL"

# Check if auth service is running
if ! curl -sf "http://localhost:5001/swagger" > /dev/null 2>&1; then
  echo "⚠️  Auth service not responding at $AUTH_URL"
  echo "   Make sure the service is running on port 5001"
  exit 1
fi

# Try to login first — if it works, admin already exists
LOGIN_RESPONSE=$(curl -s -X POST "$AUTH_URL/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}")

SUCCESS=$(echo "$LOGIN_RESPONSE" | python3 -c "import sys,json; print(json.load(sys.stdin).get('success', False))" 2>/dev/null || echo "false")

if [ "$SUCCESS" = "True" ]; then
  echo "✅ Admin user already exists"
  exit 0
fi

# Register admin user
echo "📝 Registering admin user..."
REG_RESPONSE=$(curl -s -X POST "$AUTH_URL/register" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$ADMIN_EMAIL\",
    \"password\": \"$ADMIN_PASSWORD\",
    \"firstName\": \"$ADMIN_FIRST\",
    \"lastName\": \"$ADMIN_LAST\",
    \"phone\": \"$ADMIN_PHONE\"
  }")

REG_SUCCESS=$(echo "$REG_RESPONSE" | python3 -c "import sys,json; print(json.load(sys.stdin).get('success', False))" 2>/dev/null || echo "false")

if [ "$REG_SUCCESS" = "True" ]; then
  echo "✅ Admin user registered successfully"
  echo ""
  echo "📋 Credentials:"
  echo "   Email:    $ADMIN_EMAIL"
  echo "   Password: $ADMIN_PASSWORD"
  echo ""
  echo "⚠️  Note: User role is 'Client' by default."
  echo "   To promote to Admin, run this SQL:"
  echo "   UPDATE users SET role = 3, roles = '[3]' WHERE email = '$ADMIN_EMAIL';"
else
  echo "❌ Failed to register admin user"
  echo "   Response: $REG_RESPONSE"
  exit 1
fi
