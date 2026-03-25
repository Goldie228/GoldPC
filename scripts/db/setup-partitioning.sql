-- setup-partitioning.sql
-- Run this on goldpc_orders database

-- 1. Drop existing table if needed (WARNING: data loss!)
DROP TABLE IF EXISTS order_history;

-- 2. Create partitioned table
CREATE TABLE order_history (
    id UUID NOT NULL,
    order_id UUID NOT NULL,
    previous_status VARCHAR(20) NOT NULL,
    new_status VARCHAR(20) NOT NULL,
    comment VARCHAR(500),
    changed_by UUID NOT NULL,
    changed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() AT TIME ZONE 'utc'),
    PRIMARY KEY (id, changed_at)
) PARTITION BY RANGE (changed_at);

-- 3. Create partitions for 2024 (as example)
CREATE TABLE order_history_y2024m01 PARTITION OF order_history FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');
CREATE TABLE order_history_y2024m02 PARTITION OF order_history FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');
CREATE TABLE order_history_y2024m03 PARTITION OF order_history FOR VALUES FROM ('2024-03-01') TO ('2024-04-01');
CREATE TABLE order_history_y2024m04 PARTITION OF order_history FOR VALUES FROM ('2024-04-01') TO ('2024-05-01');
CREATE TABLE order_history_y2024m05 PARTITION OF order_history FOR VALUES FROM ('2024-05-01') TO ('2024-06-01');
CREATE TABLE order_history_y2024m06 PARTITION OF order_history FOR VALUES FROM ('2024-06-01') TO ('2024-07-01');
CREATE TABLE order_history_y2024m07 PARTITION OF order_history FOR VALUES FROM ('2024-07-01') TO ('2024-08-01');
CREATE TABLE order_history_y2024m08 PARTITION OF order_history FOR VALUES FROM ('2024-08-01') TO ('2024-09-01');
CREATE TABLE order_history_y2024m09 PARTITION OF order_history FOR VALUES FROM ('2024-09-01') TO ('2024-10-01');
CREATE TABLE order_history_y2024m10 PARTITION OF order_history FOR VALUES FROM ('2024-10-01') TO ('2024-11-01');
CREATE TABLE order_history_y2024m11 PARTITION OF order_history FOR VALUES FROM ('2024-11-01') TO ('2024-12-01');
CREATE TABLE order_history_y2024m12 PARTITION OF order_history FOR VALUES FROM ('2024-12-01') TO ('2025-01-01');

-- 4. Create default partition
CREATE TABLE order_history_default PARTITION OF order_history DEFAULT;

-- 5. Indexes on partitions are handled by Postgres 16
CREATE INDEX idx_order_history_order_id ON order_history(order_id);
