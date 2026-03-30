#!/bin/bash

# Скрипт для запуска миграций фасетных фильтров
# Требует: запущенный CatalogService и токен администратора

set -e

API_BASE="${CATALOG_API:-http://localhost:5000}"
TOKEN="${ADMIN_TOKEN:-}"

if [ -z "$TOKEN" ]; then
    echo "❌ Ошибка: необходим токен администратора"
    echo "Использование: ADMIN_TOKEN=your_token ./run-filter-migrations.sh"
    echo "Или установите переменную окружения: export ADMIN_TOKEN=your_token"
    exit 1
fi

echo "🚀 Запуск миграций фасетных фильтров..."
echo "API: $API_BASE"
echo ""

# Функция для выполнения миграции
run_migration() {
    local name=$1
    local endpoint=$2
    
    echo "▶️  $name..."
    
    response=$(curl -s -w "\n%{http_code}" \
        -X POST \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        "$API_BASE/api/v1/admin/data/migrate/$endpoint")
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" -eq 200 ]; then
        echo "✅ $name: успешно"
        echo "$body" | jq -r '.message // .totalMessage // "Миграция завершена"'
        
        # Показываем статистику если есть
        valid=$(echo "$body" | jq -r '.valid // empty')
        fixed=$(echo "$body" | jq -r '.fixed // empty')
        removed=$(echo "$body" | jq -r '.removed // empty')
        
        if [ -n "$valid" ] || [ -n "$fixed" ] || [ -n "$removed" ]; then
            echo "   Валидных: ${valid:-0}, Исправлено: ${fixed:-0}, Удалено: ${removed:-0}"
        fi
    else
        echo "❌ $name: ошибка (HTTP $http_code)"
        echo "$body" | jq '.' 2>/dev/null || echo "$body"
        return 1
    fi
    
    echo ""
}

# Последовательность миграций согласно плану
echo "📋 План миграций:"
echo "  1. Пересчёт частот процессоров (МГц → ГГц)"
echo "  2. Пересчёт видеопамяти (ГБ → МБ)"
echo "  3. Удаление leaked values"
echo "  4. Нормализация дубликатов"
echo ""
read -p "Продолжить? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Отменено"
    exit 0
fi
echo ""

# Запуск миграций
run_migration "Пересчёт частот процессоров" "recalculate-frequencies"
run_migration "Пересчёт видеопамяти" "recalculate-vram"
run_migration "Удаление leaked values" "remove-leaked-values"
run_migration "Нормализация дубликатов" "normalize-duplicates"

echo "🎉 Все миграции завершены!"
echo ""
echo "📊 Следующие шаги:"
echo "  1. Проверьте фильтры через API: GET $API_BASE/api/v1/catalog/categories/{slug}/filter-facets"
echo "  2. Запустите аудит: cd scripts/filter-audit && npm run audit"
echo "  3. Сравните отчёты до и после миграций"
