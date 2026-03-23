#!/bin/bash
# Create service databases for GoldPC (runs on first postgres container init)
# ON_ERROR_STOP=0 allows script to continue if DB already exists
set +e
for db in goldpc_catalog goldpc_auth goldpc_orders goldpc_services goldpc_warranty; do
  psql -v ON_ERROR_STOP=0 -U postgres -c "CREATE DATABASE $db;" 2>/dev/null || true
done
