# Руководство по тестированию GoldPC

> **Версия**: 1.0 | **Дата**: 2026-06-17

---

## 1. Предусловия

- Docker запущен
- Все сервисы подняты (`./scripts/dev-local.sh` или `docker compose up`)
- Frontend: `http://localhost:5173`
- API Gateway: `http://localhost:5000`
- Adminer: `http://localhost:8080`

---

## 2. E2E тесты (Playwright)

### Установка

```bash
cd tests/e2e
npm install
npx playwright install chromium
```

### Запуск

```bash
# Все тесты
npx playwright test

# Только Chromium
npx playwright test --project=chromium

# С видеозаписью
npx playwright test --video=on

# С HTML отчётом
npx playwright test --reporter=html

# Конкретный spec
npx playwright test specs/auth/login.spec.ts
```

### Отчёт

- HTML: `tests/e2e/playwright-report/index.html`
- Видео: `tests/e2e/test-results/`

---

## 3. Нагрузочные тесты (k6)

### Установка

```bash
# Ubuntu/Debian
sudo snap install k6

# macOS
brew install k6

# Docker
docker pull grafana/k6
```

### Запуск

```bash
# Smoke test (10 VUs, 1 мин, p95 < 200ms)
k6 run tests/load/smoke-test.js

# Stress test (10→100 VUs, < 1% ошибок)
k6 run tests/load/stress-test.js

# Search performance (100 VUs, p95 < 500ms)
k6 run tests/load/search_performance.js

# С увеличенной нагрузкой
k6 run --vus 50 --duration 5m tests/load/smoke-test.js

# С выводом JSON (для Grafana)
k6 run --out json=results.json tests/load/smoke-test.js
```

### Пороги производительности (из ТЗ)

| Метрика | Порог | Описание |
|---------|-------|----------|
| `http_req_duration` (p95) | < 200ms | 95% запросов быстрее 200мс |
| `http_req_failed` | < 1% | Менее 1% ошибок |
| `http_reqs` | > 50/s | Более 50 запросов в секунду |
| `http_req_duration` (p99) | < 1s | 99% запросов быстрее 1с |

---

## 4. Security тесты (OWASP ZAP)

### Установка

```bash
# Docker
docker pull ghcr.io/zaproxy/zaproxy:stable
```

### Baseline scan (пассивный, ~5 мин)

```bash
docker run -t ghcr.io/zaproxy/zaproxy:stable \
  zap-baseline.py -t http://host.docker.internal:5000 \
  -r report.html -J report.json
```

### Full scan (активный, ~30 мин)

```bash
docker run -t ghcr.io/zaproxy/zaproxy:stable \
  zap-full-scan.py -t http://host.docker.internal:5000 \
  -r full-report.html -J full-report.json
```

### API scan (для REST API)

```bash
docker run -t ghcr.io/zaproxy/zaproxy:stable \
  zap-api-scan.py -t http://host.docker.internal:5000/openapi.json \
  -f openapi -r api-report.html
```

### Результаты

- HTML: `report.html`
- JSON: `report.json` (для интеграции с CI/CD)

---

## 5. Архитектурные тесты

```bash
dotnet test tests/ArchitectureTests/ --verbosity normal
```

Проверяет:
- Chinnings Rule (依赖方向)
- Controller слой не зависит от Repository
- Service слой изолирован

---

## 6. Все тесты сразу

```bash
# Backend unit tests (147 тестов)
dotnet test src/GoldPC.sln --verbosity quiet

# Frontend unit tests
cd src/frontend && npm test

# E2E тесты (147 тестов Playwright)
cd tests/e2e && npx playwright test

# Архитектурные тесты
dotnet test tests/ArchitectureTests/
```

---

## 7. CI/CD автоматизация

Все тесты автоматически запускаются в GitHub Actions:

| Workflow | Триггер | Что делает |
|----------|---------|-----------|
| `unit-tests.yml` | PR, push to main | Backend unit tests |
| `e2e-tests.yml` | PR, push to main | Playwright E2E tests |
| `tests.yml` | PR, push to main | Полный прогон всех тестов |
| `security-scan.yml` | Ежедневно (cron) | Trivy container scan |
| `dependency-scan.yml` | Еженедельно (cron) | Snyk + dotnet vulnerable packages |
| `sast.yml` | PR | SonarQube static analysis |
| `quality-gate.yml` | PR | Code quality checks |

---

## 8. Мониторинг после деплоя

### Grafana дашборд

```bash
# Запуск с мониторингом
docker compose -f docker/docker-compose.prod.yml --profile monitoring up -d

# Доступ
# Grafana: http://localhost:3002 (admin/admin)
# Prometheus: http://localhost:9090
```

### Health checks

```bash
# CatalogService
curl http://localhost:5000/health

# AuthService
curl http://localhost:5001/health

# OrdersService
curl http://localhost:5002/health

# Все сервисы
for port in 5000 5001 5002 5003 5004 5005 5008; do
  echo "Port $port: $(curl -s -o /dev/null -w '%{http_code}' http://localhost:$port/health)"
done
```
