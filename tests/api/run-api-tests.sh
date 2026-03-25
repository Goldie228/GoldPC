#!/bin/bash

# Скрипт для запуска API тестов через Newman (Postman CLI)
# Требуется установленный newman: npm install -g newman

set -e

echo "Starting GoldPC API Tests..."

# Переменные окружения (можно переопределить через аргументы или env vars)
CATALOG_URL=${CATALOG_URL:-"http://localhost:5000"}
ORDERS_URL=${ORDERS_URL:-"http://localhost:5002"}
PCBUILDER_URL=${PCBUILDER_URL:-"http://localhost:5003"}

# Запуск коллекции
newman run tests/api/GoldPC_API_Tests.postman_collection.json \
  --env-var catalog_url=$CATALOG_URL \
  --env-var orders_url=$ORDERS_URL \
  --env-var pcbuilder_url=$PCBUILDER_URL \
  --reporters cli,html \
  --reporter-html-export tests/api/reports/api-report.html

echo "API Tests completed. Report: tests/api/reports/api-report.html"
