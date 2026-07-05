# =============================================================================
# GoldPC Frontend Dockerfile
# Многоэтапная сборка для React + Vite приложения
# Безопасность: Не-root пользователь (nginx), минимальная Alpine среда выполнения, Проверки здоровья
# =============================================================================

# -----------------------------------------------------------------------------
# Этап 1: Сборка
# -----------------------------------------------------------------------------
FROM node:20-alpine AS build

WORKDIR /app

# Сначала установить зависимости (лучшее кэширование слоёв)
COPY src/frontend/package*.json ./
RUN npm ci

# Копировать исходный код
COPY src/frontend/. .

# Сборка приложения (вывод в /app/dist)
RUN npm run build

# -----------------------------------------------------------------------------
# Этап 2: Среда выполнения с Nginx
# -----------------------------------------------------------------------------
FROM nginx:alpine AS runtime

# Метки для метаданных контейнера
LABEL maintainer="GoldPC Team"
LABEL description="GoldPC Frontend - React/Vite Application"
LABEL version="1.0.0"

# Безопасность: Установка ca-certificates для TLS соединений
RUN apk add --no-cache ca-certificates && \
    update-ca-certificates

# Удаление конфигурации nginx по умолчанию
RUN rm /etc/nginx/conf.d/default.conf

# Копировать пользовательскую конфигурацию nginx
COPY docker/frontend/nginx.conf /etc/nginx/nginx.conf

# Копировать собранные ресурсы из этапа сборки
COPY --from=build /app/dist /usr/share/nginx/html

# Безопасность: Создание временных директорий nginx с правильными разрешениями
# Пользователь nginx (UID 101) уже существует в образе nginx:alpine
RUN mkdir -p /var/lib/nginx/tmp /var/cache/nginx /var/log/nginx && \
    chown -R nginx:nginx /usr/share/nginx/html && \
    chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    chown -R nginx:nginx /var/lib/nginx && \
    touch /var/run/nginx.pid && \
    chown nginx:nginx /var/run/nginx.pid

# Безопасность: Запуск от не-root пользователя (пользователь nginx, UID 101)
USER nginx

# Открыть порт 3000 (непривилегированный порт)
EXPOSE 3000

# Безопасность: Проверка здоровья для оркестрации контейнеров
# Проверяет конечную точку /health, определённую в nginx.conf
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Запуск nginx на переднем плане
CMD ["nginx", "-g", "daemon off;"]
