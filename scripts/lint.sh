#!/bin/bash
# GoldPC Lint & Error Detection Script
# Runs all linting and type checking for the project

set -e

echo "🔍 GoldPC - Running Lint & Error Detection..."
echo "=============================================="

# Frontend ESLint
echo ""
echo "📦 Frontend ESLint:"
echo "--------------------"
cd src/frontend
npx eslint . --ext .ts,.tsx --max-warnings 100 2>&1 || echo "⚠️  ESLint warnings found"

# Frontend TypeScript
echo ""
echo "📝 Frontend TypeScript Check:"
echo "----------------------------"
npx tsc --noEmit 2>&1 || echo "⚠️  TypeScript errors found"

# Backend C#
echo ""
echo "🔧 Backend C# Build:"
echo "--------------------"
cd ../..
dotnet build src/GoldPC.sln --no-restore 2>&1 || echo "⚠️  C# build errors found"

# Prettier check
echo ""
echo "✨ Prettier Format Check:"
echo "-------------------------"
cd src/frontend
npx prettier --check "src/**/*.{ts,tsx,js,jsx,json,css}" 2>&1 || echo "⚠️  Prettier violations found"

echo ""
echo "✅ Lint & Error Detection Complete!"
