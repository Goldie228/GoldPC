# Нагрузочное тестирование GoldPC

Данная папка содержит скрипты нагрузочного тестирования с использованием [k6](https://k6.io/).

## Структура

```
tests/load/
├── README.md           # Данная документация
├── k6.config.js        # Конфигурационный файл для комплексного тестирования
├── smoke-test.js       # Дымовой тест (базовая проверка)
└── stress-test.js      # Стресс-тест (нагрузочное тестирование)
```

## Установка k6

### Linux (Debian/Ubuntu)

```bash
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg \
  --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A364E10D9AE364B9E5F596B3E
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt update
sudo apt install k6
```

### Linux (Fedora/RHEL)

```bash
sudo dnf install https://dl.k6.io/rpm/repo.rpm
sudo dnf install k6
```

### macOS (Homebrew)

```bash
brew install k6
```

### Windows (Chocolatey)

```powershell
choco install k6
```

### Windows (Scoop)

```powershell
scoop install k6
```

### Docker

```bash
docker pull grafana/k6:latest
```

## Запуск тестов

### Предварительные требования

1. Убедитесь, что сервер API запущен и доступен:
   ```bash
   # Проверка доступности API
   curl http://localhost:5000/api/products
   ```

2. При необходимости укажите базовый URL через переменную окружения:
   ```bash
   export BASE_URL=http://your-server:5000
   ```

### Smoke Test (Дымовой тест)

Минимальная нагрузка для проверки работоспособности системы:

```bash
# Базовый запуск
k6 run smoke-test.js

# С указанием URL
BASE_URL=http://localhost:5000 k6 run smoke-test.js

# Через Docker
docker run --rm -i grafana/k6 run - < smoke-test.js
```

**Параметры теста:**
- 10 виртуальных пользователей
- Длительность: 1 минута
- Целевое время ответа: < 200ms (p95)
- Допустимый уровень ошибок: < 1%

### Stress Test (Стресс-тест)

Проверка системы под высокой нагрузкой:

```bash
# Базовый запуск
k6 run stress-test.js

# С указанием URL
BASE_URL=http://localhost:5000 k6 run stress-test.js

# Через Docker
docker run --rm -i grafana/k6 run - < stress-test.js
```

**Параметры теста:**
- Плавное увеличение от 10 до 100 VU за 1 минуту
- Удержание пиковой нагрузки: 30 секунд
- Целевое время ответа: < 500ms (p95)
- Допустимый уровень ошибок: < 1%

### Комплексное тестирование

```bash
k6 run k6.config.js
```

## Расширенные опции

### Вывод результатов в формате JSON

```bash
k6 run --out json=results.json smoke-test.js
```

### Вывод в InfluxDB + Grafana

```bash
k6 run --out influxdb=http://localhost:8086/k6 smoke-test.js
```

### Ограничение продолжительности

```bash
k6 run --duration 30s smoke-test.js
```

### Запуск с определённым количеством VU

```bash
k6 run --vus 50 smoke-test.js
```

## Интерпретация результатов

### Успешный тест

```
✓ status is 200
✓ response time < 200ms
✓ response has data

checks.........................: 100.00% ✓ 600      ✗ 0
data_received..................: 1.2 MB  20 kB/s
data_sent......................: 120 kB  2.0 kB/s
http_req_duration..............: avg=45ms min=12ms med=40ms max=180ms p(90)=80ms p(95)=95ms
http_req_failed................: 0.00%   ✓ 0        ✗ 200
http_reqs......................: 200     3.333333/s
```

### Неудачный тест

Если тест завершился с ошибкой, проверьте:

1. **Высокий уровень ошибок (error_rate > 1%)**
   - Сервер не справляется с нагрузкой
   - Проверьте логи сервера
   - Увеличьте ресурсы или оптимизируйте код

2. **Превышение времени ответа (p95 > порога)**
   - Медленные запросы к базе данных
   - Неоптимальные алгоритмы
   - Недостаток ресурсов

3. **Ошибки соединения**
   - Сервер недоступен
   - Неверный URL
   - Проблемы с сетью

## Интеграция с CI/CD

### GitHub Actions

```yaml
name: Load Tests

on:
  pull_request:
    branches: [main]
  schedule:
    - cron: '0 2 * * *'  # Ежедневно в 2:00 UTC

jobs:
  smoke-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup k6
        uses: grafana/setup-k6@v1
      
      - name: Run Smoke Test
        run: k6 run tests/load/smoke-test.js
        env:
          BASE_URL: ${{ secrets.API_URL }}

  stress-test:
    runs-on: ubuntu-latest
    needs: smoke-test
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup k6
        uses: grafana/setup-k6@v1
      
      - name: Run Stress Test
        run: k6 run tests/load/stress-test.js
        env:
          BASE_URL: ${{ secrets.API_URL }}
```

## Метрики

| Метрика | Описание |
|---------|----------|
| `http_req_duration` | Время ответа HTTP запроса |
| `http_req_failed` | Процент неудачных HTTP запросов |
| `vus` | Количество виртуальных пользователей |
| `iterations` | Количество выполненных итераций |
| `error_rate` | Кастомная метрика уровня ошибок |

## Полезные ссылки

- [Официальная документация k6](https://k6.io/docs/)
- [k6 JavaScript API](https://k6.io/docs/javascript-api/)
- [Метрики k6](https://k6.io/docs/using-k6/metrics/)
- [Пороги (thresholds)](https://k6.io/docs/using-k6/thresholds/)
- [Сценарии выполнения](https://k6.io/docs/using-k6/scenarios/)