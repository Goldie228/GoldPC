#!/bin/bash
# GoldPC: скрипт линтинга и проверки ошибок
# Запускает все линтеры и проверки типов для проекта

set -e

echo "🔍 GoldPC - Running Lint & Error Detection..."
echo "=============================================="

# ESLint фронтенда
echo ""
echo "📦 Frontend ESLint:"
echo "--------------------"
cd src/frontend
npx eslint . --ext .ts,.tsx --max-warnings 100 2>&1 || echo "⚠️  ESLint warnings found"

# TypeScript фронтенда
echo ""
echo "📝 Frontend TypeScript Check:"
echo "----------------------------"
npx tsc --noEmit 2>&1 || echo "⚠️  TypeScript errors found"

# C# бэкенда
echo ""
echo "🔧 Backend C# Build:"
echo "--------------------"
cd ../..
dotnet build src/GoldPC.sln --no-restore 2>&1 || echo "⚠️  C# build errors found"

# Проверка форматирования Prettier
echo ""
echo "✨ Prettier Format Check:"
echo "-------------------------"
cd src/frontend
npx prettier --check "src/**/*.{ts,tsx,js,jsx,json,css}" 2>&1 || echo "⚠️  Prettier violations found"

echo ""
echo "✅ Lint & Error Detection Complete!"
