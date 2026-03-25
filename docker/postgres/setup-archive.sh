#!/bin/bash
mkdir -p /var/lib/postgresql/data/archive
chown postgres:postgres /var/lib/postgresql/data/archive
chmod 700 /var/lib/postgresql/data/archive
