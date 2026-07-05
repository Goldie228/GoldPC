#!/bin/bash
# Создать базы данных сервисов для GoldPC (выполняется при первой инициализации контейнера postgres)
# ON_ERROR_STOP=0 позволяет скрипту продолжить, если БД уже существует
set +e
for db in goldpc_catalog goldpc_auth goldpc_orders goldpc_services goldpc_warranty goldpc_pcbuilder goldpc_reporting; do
  psql -v ON_ERROR_STOP=0 -U postgres -c "CREATE DATABASE $db;" 2>/dev/null || true
done
