CREATE TABLE IF NOT EXISTS "__EFMigrationsHistory" (
    "MigrationId" character varying(150) NOT NULL,
    "ProductVersion" character varying(32) NOT NULL,
    CONSTRAINT "PK___EFMigrationsHistory" PRIMARY KEY ("MigrationId")
);

START TRANSACTION;

CREATE TABLE categories (
    id uuid NOT NULL,
    name character varying(100) NOT NULL,
    slug character varying(100) NOT NULL,
    description character varying(500),
    parent_id uuid,
    "Icon" text,
    component_type integer,
    "Order" integer NOT NULL,
    CONSTRAINT "PK_categories" PRIMARY KEY (id),
    CONSTRAINT "FK_categories_categories_parent_id" FOREIGN KEY (parent_id) REFERENCES categories (id) ON DELETE RESTRICT
);

CREATE TABLE manufacturers (
    id uuid NOT NULL,
    name character varying(100) NOT NULL,
    country character varying(50),
    logo_url character varying(500),
    description character varying(1000),
    CONSTRAINT "PK_manufacturers" PRIMARY KEY (id)
);

CREATE TABLE products (
    id uuid NOT NULL,
    name character varying(200) NOT NULL,
    sku character varying(50) NOT NULL,
    description text,
    "CategoryId" uuid NOT NULL,
    "ManufacturerId" uuid,
    price numeric(12,2) NOT NULL,
    "OldPrice" numeric,
    stock integer NOT NULL,
    specifications jsonb NOT NULL,
    warranty_months integer NOT NULL,
    rating double precision NOT NULL,
    review_count integer NOT NULL,
    is_active boolean NOT NULL,
    "IsFeatured" boolean NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone,
    CONSTRAINT "PK_products" PRIMARY KEY (id),
    CONSTRAINT "FK_products_categories_CategoryId" FOREIGN KEY ("CategoryId") REFERENCES categories (id) ON DELETE RESTRICT,
    CONSTRAINT "FK_products_manufacturers_ManufacturerId" FOREIGN KEY ("ManufacturerId") REFERENCES manufacturers (id) ON DELETE RESTRICT
);

CREATE TABLE product_images (
    id uuid NOT NULL,
    product_id uuid NOT NULL,
    url character varying(500) NOT NULL,
    alt_text character varying(200),
    is_primary boolean NOT NULL,
    sort_order integer NOT NULL,
    CONSTRAINT "PK_product_images" PRIMARY KEY (id),
    CONSTRAINT "FK_product_images_products_product_id" FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE
);

CREATE TABLE reviews (
    id uuid NOT NULL,
    product_id uuid NOT NULL,
    user_id uuid NOT NULL,
    user_name character varying(100) NOT NULL,
    rating integer NOT NULL,
    "Title" text,
    comment text,
    pros text,
    cons text,
    created_at timestamp with time zone NOT NULL,
    is_verified boolean NOT NULL,
    "IsApproved" boolean NOT NULL,
    "Helpful" integer NOT NULL,
    CONSTRAINT "PK_reviews" PRIMARY KEY (id),
    CONSTRAINT "FK_reviews_products_product_id" FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE
);

INSERT INTO categories (id, component_type, description, "Icon", name, "Order", parent_id, slug)
VALUES ('00000000-0000-0000-0000-000000000001', 1, NULL, NULL, 'Процессоры', 0, NULL, 'processors');
INSERT INTO categories (id, component_type, description, "Icon", name, "Order", parent_id, slug)
VALUES ('00000000-0000-0000-0000-000000000002', 2, NULL, NULL, 'Материнские платы', 0, NULL, 'motherboards');
INSERT INTO categories (id, component_type, description, "Icon", name, "Order", parent_id, slug)
VALUES ('00000000-0000-0000-0000-000000000003', 3, NULL, NULL, 'Оперативная память', 0, NULL, 'ram');
INSERT INTO categories (id, component_type, description, "Icon", name, "Order", parent_id, slug)
VALUES ('00000000-0000-0000-0000-000000000004', 4, NULL, NULL, 'Видеокарты', 0, NULL, 'gpu');
INSERT INTO categories (id, component_type, description, "Icon", name, "Order", parent_id, slug)
VALUES ('00000000-0000-0000-0000-000000000005', 5, NULL, NULL, 'Блоки питания', 0, NULL, 'psu');
INSERT INTO categories (id, component_type, description, "Icon", name, "Order", parent_id, slug)
VALUES ('00000000-0000-0000-0000-000000000006', 6, NULL, NULL, 'Накопители', 0, NULL, 'storage');
INSERT INTO categories (id, component_type, description, "Icon", name, "Order", parent_id, slug)
VALUES ('00000000-0000-0000-0000-000000000007', 7, NULL, NULL, 'Корпуса', 0, NULL, 'cases');
INSERT INTO categories (id, component_type, description, "Icon", name, "Order", parent_id, slug)
VALUES ('00000000-0000-0000-0000-000000000008', 8, NULL, NULL, 'Системы охлаждения', 0, NULL, 'coolers');
INSERT INTO categories (id, component_type, description, "Icon", name, "Order", parent_id, slug)
VALUES ('00000000-0000-0000-0000-000000000009', 9, NULL, NULL, 'Периферия', 0, NULL, 'periphery');

INSERT INTO manufacturers (id, country, description, logo_url, name)
VALUES ('10000000-0000-0000-0000-000000000001', 'USA', NULL, NULL, 'Intel');
INSERT INTO manufacturers (id, country, description, logo_url, name)
VALUES ('10000000-0000-0000-0000-000000000002', 'USA', NULL, NULL, 'AMD');
INSERT INTO manufacturers (id, country, description, logo_url, name)
VALUES ('10000000-0000-0000-0000-000000000003', 'Taiwan', NULL, NULL, 'ASUS');
INSERT INTO manufacturers (id, country, description, logo_url, name)
VALUES ('10000000-0000-0000-0000-000000000004', 'Taiwan', NULL, NULL, 'MSI');
INSERT INTO manufacturers (id, country, description, logo_url, name)
VALUES ('10000000-0000-0000-0000-000000000005', 'Taiwan', NULL, NULL, 'Gigabyte');
INSERT INTO manufacturers (id, country, description, logo_url, name)
VALUES ('10000000-0000-0000-0000-000000000006', 'Taiwan', NULL, NULL, 'ASRock');
INSERT INTO manufacturers (id, country, description, logo_url, name)
VALUES ('10000000-0000-0000-0000-000000000007', 'USA', NULL, NULL, 'NVIDIA');
INSERT INTO manufacturers (id, country, description, logo_url, name)
VALUES ('10000000-0000-0000-0000-000000000008', 'Taiwan', NULL, NULL, 'Palit');
INSERT INTO manufacturers (id, country, description, logo_url, name)
VALUES ('10000000-0000-0000-0000-000000000009', 'USA', NULL, NULL, 'Kingston');
INSERT INTO manufacturers (id, country, description, logo_url, name)
VALUES ('10000000-0000-0000-0000-000000000010', 'USA', NULL, NULL, 'Corsair');
INSERT INTO manufacturers (id, country, description, logo_url, name)
VALUES ('10000000-0000-0000-0000-000000000011', 'Taiwan', NULL, NULL, 'G.Skill');
INSERT INTO manufacturers (id, country, description, logo_url, name)
VALUES ('10000000-0000-0000-0000-000000000012', 'Germany', NULL, NULL, 'be quiet!');
INSERT INTO manufacturers (id, country, description, logo_url, name)
VALUES ('10000000-0000-0000-0000-000000000013', 'Taiwan', NULL, NULL, 'Seasonic');
INSERT INTO manufacturers (id, country, description, logo_url, name)
VALUES ('10000000-0000-0000-0000-000000000014', 'South Korea', NULL, NULL, 'Samsung');
INSERT INTO manufacturers (id, country, description, logo_url, name)
VALUES ('10000000-0000-0000-0000-000000000015', 'USA', NULL, NULL, 'Western Digital');
INSERT INTO manufacturers (id, country, description, logo_url, name)
VALUES ('10000000-0000-0000-0000-000000000016', 'USA', NULL, NULL, 'NZXT');
INSERT INTO manufacturers (id, country, description, logo_url, name)
VALUES ('10000000-0000-0000-0000-000000000017', 'Sweden', NULL, NULL, 'Fractal Design');

INSERT INTO products (id, "CategoryId", created_at, description, is_active, "IsFeatured", "ManufacturerId", name, "OldPrice", price, rating, review_count, sku, specifications, stock, updated_at, warranty_months)
VALUES ('20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', TIMESTAMPTZ '2024-01-01T00:00:00Z', 'Процессор AMD Ryzen 5 5600X, 6 ядер, 12 потоков, базовая частота 3.7 ГГц, турбо до 4.6 ГГц. Socket AM4. Отличное соотношение цена/производительность для игр и работы.', TRUE, TRUE, '10000000-0000-0000-0000-000000000002', 'AMD Ryzen 5 5600X', NULL, 549.0, 4.7999999999999998, 156, 'CPU-AMD-5600X', '{"socket":"AM4","cores":6,"threads":12,"base_clock":"3.7 GHz","boost_clock":"4.6 GHz","tdp":"65W","l3_cache":"32MB","unlocked":true,"integrated_graphics":false}', 25, NULL, 36);
INSERT INTO products (id, "CategoryId", created_at, description, is_active, "IsFeatured", "ManufacturerId", name, "OldPrice", price, rating, review_count, sku, specifications, stock, updated_at, warranty_months)
VALUES ('20000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', TIMESTAMPTZ '2024-01-01T00:00:00Z', 'Лучший игровой процессор с технологией 3D V-Cache. 8 ядер, 16 потоков, Socket AM5. Идеален для игр с объёмным кэшем 104MB.', TRUE, TRUE, '10000000-0000-0000-0000-000000000002', 'AMD Ryzen 7 7800X3D', NULL, 1299.0, 4.9000000000000004, 89, 'CPU-AMD-7800X3D', '{"socket":"AM5","cores":8,"threads":16,"base_clock":"4.2 GHz","boost_clock":"5.0 GHz","tdp":"120W","l3_cache":"104MB","unlocked":true,"integrated_graphics":true}', 12, NULL, 36);
INSERT INTO products (id, "CategoryId", created_at, description, is_active, "IsFeatured", "ManufacturerId", name, "OldPrice", price, rating, review_count, sku, specifications, stock, updated_at, warranty_months)
VALUES ('20000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', TIMESTAMPTZ '2024-01-01T00:00:00Z', 'Процессор Intel Core i5 13-го поколения, 14 ядер (6P+8E), 20 потоков. Socket LGA1700. Отличная производительность для игр и контента.', TRUE, FALSE, '10000000-0000-0000-0000-000000000001', 'Intel Core i5-13600KF', 849.0, 749.0, 4.7000000000000002, 134, 'CPU-INT-13600KF', '{"socket":"LGA1700","cores":14,"threads":20,"base_clock":"3.5 GHz","boost_clock":"5.1 GHz","tdp":"125W","l3_cache":"24MB","unlocked":true,"integrated_graphics":false}', 18, NULL, 36);
INSERT INTO products (id, "CategoryId", created_at, description, is_active, "IsFeatured", "ManufacturerId", name, "OldPrice", price, rating, review_count, sku, specifications, stock, updated_at, warranty_months)
VALUES ('20000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000002', TIMESTAMPTZ '2024-01-01T00:00:00Z', 'Материнская плата ASUS TUF Gaming на чипсете B650, Socket AM5. Поддержка DDR5, PCIe 5.0, WiFi 6, 2.5G LAN. Надёжность военного класса.', TRUE, TRUE, '10000000-0000-0000-0000-000000000003', 'ASUS TUF Gaming B650-Plus WiFi', NULL, 429.0, 4.5999999999999996, 67, 'MB-ASUS-B650TUF', '{"socket":"AM5","chipset":"B650","form_factor":"ATX","memory_slots":4,"max_memory":"128GB","memory_type":"DDR5","pcie_slots":"1x PCIe 5.0 x16, 1x PCIe 4.0 x16","m2_slots":3,"usb_ports":"8x USB-A, 2x USB-C","wifi":"WiFi 6","lan":"2.5G"}', 15, NULL, 36);
INSERT INTO products (id, "CategoryId", created_at, description, is_active, "IsFeatured", "ManufacturerId", name, "OldPrice", price, rating, review_count, sku, specifications, stock, updated_at, warranty_months)
VALUES ('20000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000002', TIMESTAMPTZ '2024-01-01T00:00:00Z', 'Материнская плата MSI MAG B650 Tomahawk, Socket AM5. DDR5, PCIe 4.0, WiFi 6E, 2.5G LAN. Идеальна для Ryzen 7000 серии.', TRUE, FALSE, '10000000-0000-0000-0000-000000000004', 'MSI MAG B650 TOMAHAWK WIFI', NULL, 389.0, 4.7000000000000002, 98, 'MB-MSI-B650TOM', '{"socket":"AM5","chipset":"B650","form_factor":"ATX","memory_slots":4,"max_memory":"128GB","memory_type":"DDR5","pcie_slots":"2x PCIe 4.0 x16","m2_slots":4,"usb_ports":"9x USB-A, 1x USB-C","wifi":"WiFi 6E","lan":"2.5G"}', 22, NULL, 36);
INSERT INTO products (id, "CategoryId", created_at, description, is_active, "IsFeatured", "ManufacturerId", name, "OldPrice", price, rating, review_count, sku, specifications, stock, updated_at, warranty_months)
VALUES ('20000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000003', TIMESTAMPTZ '2024-01-01T00:00:00Z', 'Комплект оперативной памяти Kingston FURY Beast 2x16GB DDR5-5600 MHz. CL36, 1.25V. Высокая производительность для игр и работы.', TRUE, TRUE, '10000000-0000-0000-0000-000000000009', 'Kingston FURY Beast 32GB DDR5-5600', 299.0, 249.0, 4.7999999999999998, 203, 'RAM-KING-32D5', '{"capacity":"32GB","kit_config":"2x16GB","type":"DDR5","speed":"5600 MHz","cas_latency":36,"voltage":"1.25V","heat_spreader":true,"rgb":false}', 45, NULL, 36);
INSERT INTO products (id, "CategoryId", created_at, description, is_active, "IsFeatured", "ManufacturerId", name, "OldPrice", price, rating, review_count, sku, specifications, stock, updated_at, warranty_months)
VALUES ('20000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000003', TIMESTAMPTZ '2024-01-01T00:00:00Z', 'Память G.Skill Trident Z5 RGB 2x16GB DDR5-6000 MHz CL30. Эффектная RGB-подсветка, оптимизировано для Intel XMP 3.0.', TRUE, TRUE, '10000000-0000-0000-0000-000000000011', 'G.Skill Trident Z5 RGB 32GB DDR5-6000', NULL, 329.0, 4.9000000000000004, 145, 'RAM-GSKILL-32Z5', '{"capacity":"32GB","kit_config":"2x16GB","type":"DDR5","speed":"6000 MHz","cas_latency":30,"voltage":"1.35V","heat_spreader":true,"rgb":true}', 30, NULL, 36);
INSERT INTO products (id, "CategoryId", created_at, description, is_active, "IsFeatured", "ManufacturerId", name, "OldPrice", price, rating, review_count, sku, specifications, stock, updated_at, warranty_months)
VALUES ('20000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000004', TIMESTAMPTZ '2024-01-01T00:00:00Z', 'Видеокарта Palit GeForce RTX 4070 SUPER 12GB GDDR6X. DLSS 3, Ray Tracing, 12GB VRAM. Отличная производительность в 1440p.', TRUE, TRUE, '10000000-0000-0000-0000-000000000008', 'Palit GeForce RTX 4070 SUPER Dual', NULL, 2199.0, 4.7000000000000002, 72, 'GPU-PALIT-4070S', '{"gpu":"NVIDIA GeForce RTX 4070 SUPER","vram":"12GB GDDR6X","memory_bus":"192-bit","base_clock":"1980 MHz","boost_clock":"2475 MHz","cuda_cores":7168,"rt_cores":56,"tdp":"220W","outputs":"3x DisplayPort 1.4a, 1x HDMI 2.1","recommended_psu":"650W"}', 8, NULL, 36);
INSERT INTO products (id, "CategoryId", created_at, description, is_active, "IsFeatured", "ManufacturerId", name, "OldPrice", price, rating, review_count, sku, specifications, stock, updated_at, warranty_months)
VALUES ('20000000-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000004', TIMESTAMPTZ '2024-01-01T00:00:00Z', 'Видеокарта Gigabyte Radeon RX 7800 XT 16GB GDDR6. 16GB VRAM, FSR 3, отличное соотношение цена/производительность для 1440p.', TRUE, FALSE, '10000000-0000-0000-0000-000000000005', 'Gigabyte Radeon RX 7800 XT GAMING OC', NULL, 1899.0, 4.5999999999999996, 58, 'GPU-GIGA-7800XT', '{"gpu":"AMD Radeon RX 7800 XT","vram":"16GB GDDR6","memory_bus":"256-bit","base_clock":"1295 MHz","boost_clock":"2430 MHz","stream_processors":3840,"ray_accelerators":60,"tdp":"263W","outputs":"2x DisplayPort 2.1, 2x HDMI 2.1, 1x USB-C","recommended_psu":"700W"}', 14, NULL, 36);
INSERT INTO products (id, "CategoryId", created_at, description, is_active, "IsFeatured", "ManufacturerId", name, "OldPrice", price, rating, review_count, sku, specifications, stock, updated_at, warranty_months)
VALUES ('20000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000005', TIMESTAMPTZ '2024-01-01T00:00:00Z', 'Блок питания Corsair RM750e 750W, сертификат 80+ Gold, полностью модульный. Тихий 120mm вентилятор, ATX 3.0 совместимость.', TRUE, TRUE, '10000000-0000-0000-0000-000000000010', 'Corsair RM750e 750W 80+ Gold', NULL, 289.0, 4.7999999999999998, 189, 'PSU-CORS-RM750E', '{"wattage":"750W","efficiency":"80\u002B Gold","modular":"Full","fan_size":"120mm","fan_type":"Rifle Bearing","atx_version":"ATX 3.0","pcie_connectors":"4x 8-pin (2x 12VHPWR)","sata_connectors":8,"noise_level":"10-25 dBA"}', 35, NULL, 60);
INSERT INTO products (id, "CategoryId", created_at, description, is_active, "IsFeatured", "ManufacturerId", name, "OldPrice", price, rating, review_count, sku, specifications, stock, updated_at, warranty_months)
VALUES ('20000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000005', TIMESTAMPTZ '2024-01-01T00:00:00Z', 'Блок питания be quiet! Pure Power 12 M 850W, 80+ Gold, полумодульный. Немецкая разработка, сверхтихая работа.', TRUE, FALSE, '10000000-0000-0000-0000-000000000012', 'be quiet! Pure Power 12 M 850W', NULL, 319.0, 4.7000000000000002, 156, 'PSU-BEQT-PP12M', '{"wattage":"850W","efficiency":"80\u002B Gold","modular":"Semi","fan_size":"135mm","fan_type":"Silent Wings","atx_version":"ATX 3.0","pcie_connectors":"6x 8-pin","sata_connectors":6,"noise_level":"5-18 dBA"}', 20, NULL, 60);
INSERT INTO products (id, "CategoryId", created_at, description, is_active, "IsFeatured", "ManufacturerId", name, "OldPrice", price, rating, review_count, sku, specifications, stock, updated_at, warranty_months)
VALUES ('20000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000005', TIMESTAMPTZ '2024-01-01T00:00:00Z', 'Блок питания Seasonic Focus GX-850 850W, 80+ Gold, полностью модульный. Премиум качество, 10 лет гарантии.', TRUE, TRUE, '10000000-0000-0000-0000-000000000013', 'Seasonic Focus GX-850 850W', NULL, 349.0, 4.9000000000000004, 234, 'PSU-SEAS-GX850', '{"wattage":"850W","efficiency":"80\u002B Gold","modular":"Full","fan_size":"120mm","fan_type":"Fluid Dynamic Bearing","atx_version":"ATX 3.0","pcie_connectors":"6x 8-pin","sata_connectors":8,"noise_level":"8-22 dBA"}', 18, NULL, 120);

CREATE INDEX "IX_categories_parent_id" ON categories (parent_id);

CREATE UNIQUE INDEX "IX_categories_slug" ON categories (slug);

CREATE UNIQUE INDEX "IX_manufacturers_name" ON manufacturers (name);

CREATE INDEX "IX_product_images_product_id" ON product_images (product_id);

CREATE INDEX "IX_products_CategoryId" ON products ("CategoryId");

CREATE INDEX "IX_products_is_active" ON products (is_active);

CREATE INDEX "IX_products_ManufacturerId" ON products ("ManufacturerId");

CREATE INDEX "IX_products_price" ON products (price);

CREATE UNIQUE INDEX "IX_products_sku" ON products (sku);

CREATE INDEX "IX_reviews_product_id" ON reviews (product_id);

CREATE INDEX "IX_reviews_user_id" ON reviews (user_id);

INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('20260315162629_SeedProductsData', '8.0.11');

COMMIT;

START TRANSACTION;

ALTER TABLE products ADD external_id character varying(100);

ALTER TABLE products ADD source_url character varying(1000);

CREATE TABLE category_filter_attributes (
    id uuid NOT NULL,
    category_id uuid NOT NULL,
    attribute_key character varying(50) NOT NULL,
    display_name character varying(100) NOT NULL,
    filter_type integer NOT NULL,
    sort_order integer NOT NULL,
    CONSTRAINT "PK_category_filter_attributes" PRIMARY KEY (id),
    CONSTRAINT "FK_category_filter_attributes_categories_category_id" FOREIGN KEY (category_id) REFERENCES categories (id) ON DELETE CASCADE
);

INSERT INTO categories (id, component_type, description, "Icon", name, "Order", parent_id, slug)
VALUES ('00000000-0000-0000-0000-00000000000a', 10, NULL, NULL, 'Мониторы', 0, NULL, 'monitors');

INSERT INTO category_filter_attributes (id, attribute_key, category_id, display_name, filter_type, sort_order)
VALUES ('30000000-0000-0000-0000-000000000001', 'vram', '00000000-0000-0000-0000-000000000004', 'Объём видеопамяти', 0, 1);
INSERT INTO category_filter_attributes (id, attribute_key, category_id, display_name, filter_type, sort_order)
VALUES ('30000000-0000-0000-0000-000000000002', 'gpu', '00000000-0000-0000-0000-000000000004', 'Серия GPU', 0, 2);
INSERT INTO category_filter_attributes (id, attribute_key, category_id, display_name, filter_type, sort_order)
VALUES ('30000000-0000-0000-0000-000000000003', 'socket', '00000000-0000-0000-0000-000000000001', 'Сокет', 0, 1);
INSERT INTO category_filter_attributes (id, attribute_key, category_id, display_name, filter_type, sort_order)
VALUES ('30000000-0000-0000-0000-000000000004', 'cores', '00000000-0000-0000-0000-000000000001', 'Количество ядер', 1, 2);
INSERT INTO category_filter_attributes (id, attribute_key, category_id, display_name, filter_type, sort_order)
VALUES ('30000000-0000-0000-0000-000000000005', 'socket', '00000000-0000-0000-0000-000000000002', 'Сокет', 0, 1);
INSERT INTO category_filter_attributes (id, attribute_key, category_id, display_name, filter_type, sort_order)
VALUES ('30000000-0000-0000-0000-000000000006', 'chipset', '00000000-0000-0000-0000-000000000002', 'Чипсет', 0, 2);
INSERT INTO category_filter_attributes (id, attribute_key, category_id, display_name, filter_type, sort_order)
VALUES ('30000000-0000-0000-0000-000000000007', 'type', '00000000-0000-0000-0000-000000000003', 'Тип памяти', 0, 1);
INSERT INTO category_filter_attributes (id, attribute_key, category_id, display_name, filter_type, sort_order)
VALUES ('30000000-0000-0000-0000-000000000008', 'capacity', '00000000-0000-0000-0000-000000000003', 'Объём', 0, 2);
INSERT INTO category_filter_attributes (id, attribute_key, category_id, display_name, filter_type, sort_order)
VALUES ('30000000-0000-0000-0000-000000000009', 'capacity', '00000000-0000-0000-0000-000000000006', 'Объём', 0, 1);
INSERT INTO category_filter_attributes (id, attribute_key, category_id, display_name, filter_type, sort_order)
VALUES ('30000000-0000-0000-0000-00000000000a', 'wattage', '00000000-0000-0000-0000-000000000005', 'Мощность', 0, 1);
INSERT INTO category_filter_attributes (id, attribute_key, category_id, display_name, filter_type, sort_order)
VALUES ('30000000-0000-0000-0000-00000000000b', 'efficiency', '00000000-0000-0000-0000-000000000005', 'Сертификат', 0, 2);

UPDATE products SET external_id = NULL, source_url = NULL, specifications = '{"socket":"AM4","cores":6,"threads":12,"base_clock":"3.7 GHz","boost_clock":"4.6 GHz","tdp":"65W","l3_cache":"32MB","unlocked":true,"integrated_graphics":false}'
WHERE id = '20000000-0000-0000-0000-000000000001';

UPDATE products SET external_id = NULL, source_url = NULL, specifications = '{"socket":"AM5","cores":8,"threads":16,"base_clock":"4.2 GHz","boost_clock":"5.0 GHz","tdp":"120W","l3_cache":"104MB","unlocked":true,"integrated_graphics":true}'
WHERE id = '20000000-0000-0000-0000-000000000002';

UPDATE products SET external_id = NULL, source_url = NULL, specifications = '{"socket":"LGA1700","cores":14,"threads":20,"base_clock":"3.5 GHz","boost_clock":"5.1 GHz","tdp":"125W","l3_cache":"24MB","unlocked":true,"integrated_graphics":false}'
WHERE id = '20000000-0000-0000-0000-000000000003';

UPDATE products SET external_id = NULL, source_url = NULL, specifications = '{"socket":"AM5","chipset":"B650","form_factor":"ATX","memory_slots":4,"max_memory":"128GB","memory_type":"DDR5","pcie_slots":"1x PCIe 5.0 x16, 1x PCIe 4.0 x16","m2_slots":3,"usb_ports":"8x USB-A, 2x USB-C","wifi":"WiFi 6","lan":"2.5G"}'
WHERE id = '20000000-0000-0000-0000-000000000004';

UPDATE products SET external_id = NULL, source_url = NULL, specifications = '{"socket":"AM5","chipset":"B650","form_factor":"ATX","memory_slots":4,"max_memory":"128GB","memory_type":"DDR5","pcie_slots":"2x PCIe 4.0 x16","m2_slots":4,"usb_ports":"9x USB-A, 1x USB-C","wifi":"WiFi 6E","lan":"2.5G"}'
WHERE id = '20000000-0000-0000-0000-000000000005';

UPDATE products SET external_id = NULL, source_url = NULL, specifications = '{"capacity":"32GB","kit_config":"2x16GB","type":"DDR5","speed":"5600 MHz","cas_latency":36,"voltage":"1.25V","heat_spreader":true,"rgb":false}'
WHERE id = '20000000-0000-0000-0000-000000000006';

UPDATE products SET external_id = NULL, source_url = NULL, specifications = '{"capacity":"32GB","kit_config":"2x16GB","type":"DDR5","speed":"6000 MHz","cas_latency":30,"voltage":"1.35V","heat_spreader":true,"rgb":true}'
WHERE id = '20000000-0000-0000-0000-000000000007';

UPDATE products SET external_id = NULL, source_url = NULL, specifications = '{"gpu":"NVIDIA GeForce RTX 4070 SUPER","vram":"12GB GDDR6X","memory_bus":"192-bit","base_clock":"1980 MHz","boost_clock":"2475 MHz","cuda_cores":7168,"rt_cores":56,"tdp":"220W","outputs":"3x DisplayPort 1.4a, 1x HDMI 2.1","recommended_psu":"650W"}'
WHERE id = '20000000-0000-0000-0000-000000000008';

UPDATE products SET external_id = NULL, source_url = NULL, specifications = '{"gpu":"AMD Radeon RX 7800 XT","vram":"16GB GDDR6","memory_bus":"256-bit","base_clock":"1295 MHz","boost_clock":"2430 MHz","stream_processors":3840,"ray_accelerators":60,"tdp":"263W","outputs":"2x DisplayPort 2.1, 2x HDMI 2.1, 1x USB-C","recommended_psu":"700W"}'
WHERE id = '20000000-0000-0000-0000-000000000009';

UPDATE products SET external_id = NULL, source_url = NULL, specifications = '{"wattage":"750W","efficiency":"80\u002B Gold","modular":"Full","fan_size":"120mm","fan_type":"Rifle Bearing","atx_version":"ATX 3.0","pcie_connectors":"4x 8-pin (2x 12VHPWR)","sata_connectors":8,"noise_level":"10-25 dBA"}'
WHERE id = '20000000-0000-0000-0000-000000000010';

UPDATE products SET external_id = NULL, source_url = NULL, specifications = '{"wattage":"850W","efficiency":"80\u002B Gold","modular":"Semi","fan_size":"135mm","fan_type":"Silent Wings","atx_version":"ATX 3.0","pcie_connectors":"6x 8-pin","sata_connectors":6,"noise_level":"5-18 dBA"}'
WHERE id = '20000000-0000-0000-0000-000000000011';

UPDATE products SET external_id = NULL, source_url = NULL, specifications = '{"wattage":"850W","efficiency":"80\u002B Gold","modular":"Full","fan_size":"120mm","fan_type":"Fluid Dynamic Bearing","atx_version":"ATX 3.0","pcie_connectors":"6x 8-pin","sata_connectors":8,"noise_level":"8-22 dBA"}'
WHERE id = '20000000-0000-0000-0000-000000000012';

CREATE UNIQUE INDEX "IX_products_external_id" ON products (external_id) WHERE external_id IS NOT NULL;

CREATE INDEX "IX_category_filter_attributes_category_id" ON category_filter_attributes (category_id);

INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('20260320073752_AddXCoreFields', '8.0.11');

COMMIT;

START TRANSACTION;

INSERT INTO category_filter_attributes (id, attribute_key, category_id, display_name, filter_type, sort_order)
VALUES ('30000000-0000-0000-0000-00000000000c', 'form_factor', '00000000-0000-0000-0000-000000000007', 'Форм-фактор', 0, 1);
INSERT INTO category_filter_attributes (id, attribute_key, category_id, display_name, filter_type, sort_order)
VALUES ('30000000-0000-0000-0000-00000000000d', 'color', '00000000-0000-0000-0000-000000000007', 'Цвет', 0, 2);
INSERT INTO category_filter_attributes (id, attribute_key, category_id, display_name, filter_type, sort_order)
VALUES ('30000000-0000-0000-0000-00000000000e', 'type', '00000000-0000-0000-0000-000000000008', 'Тип', 0, 1);
INSERT INTO category_filter_attributes (id, attribute_key, category_id, display_name, filter_type, sort_order)
VALUES ('30000000-0000-0000-0000-00000000000f', 'socket', '00000000-0000-0000-0000-000000000008', 'Сокет', 0, 2);
INSERT INTO category_filter_attributes (id, attribute_key, category_id, display_name, filter_type, sort_order)
VALUES ('30000000-0000-0000-0000-000000000010', 'tdp', '00000000-0000-0000-0000-000000000008', 'TDP, Вт', 1, 3);
INSERT INTO category_filter_attributes (id, attribute_key, category_id, display_name, filter_type, sort_order)
VALUES ('30000000-0000-0000-0000-000000000011', 'diagonal', '00000000-0000-0000-0000-00000000000a', 'Диагональ', 0, 1);
INSERT INTO category_filter_attributes (id, attribute_key, category_id, display_name, filter_type, sort_order)
VALUES ('30000000-0000-0000-0000-000000000012', 'resolution', '00000000-0000-0000-0000-00000000000a', 'Разрешение', 0, 2);
INSERT INTO category_filter_attributes (id, attribute_key, category_id, display_name, filter_type, sort_order)
VALUES ('30000000-0000-0000-0000-000000000013', 'refresh_rate', '00000000-0000-0000-0000-00000000000a', 'Частота обновления', 0, 3);
INSERT INTO category_filter_attributes (id, attribute_key, category_id, display_name, filter_type, sort_order)
VALUES ('30000000-0000-0000-0000-000000000014', 'type', '00000000-0000-0000-0000-000000000009', 'Тип устройства', 0, 1);
INSERT INTO category_filter_attributes (id, attribute_key, category_id, display_name, filter_type, sort_order)
VALUES ('30000000-0000-0000-0000-000000000015', 'connection', '00000000-0000-0000-0000-000000000009', 'Подключение', 0, 2);

UPDATE products SET specifications = '{"socket":"AM4","cores":6,"threads":12,"base_clock":"3.7 GHz","boost_clock":"4.6 GHz","tdp":"65W","l3_cache":"32MB","unlocked":true,"integrated_graphics":false}'
WHERE id = '20000000-0000-0000-0000-000000000001';

UPDATE products SET specifications = '{"socket":"AM5","cores":8,"threads":16,"base_clock":"4.2 GHz","boost_clock":"5.0 GHz","tdp":"120W","l3_cache":"104MB","unlocked":true,"integrated_graphics":true}'
WHERE id = '20000000-0000-0000-0000-000000000002';

UPDATE products SET specifications = '{"socket":"LGA1700","cores":14,"threads":20,"base_clock":"3.5 GHz","boost_clock":"5.1 GHz","tdp":"125W","l3_cache":"24MB","unlocked":true,"integrated_graphics":false}'
WHERE id = '20000000-0000-0000-0000-000000000003';

UPDATE products SET specifications = '{"socket":"AM5","chipset":"B650","form_factor":"ATX","memory_slots":4,"max_memory":"128GB","memory_type":"DDR5","pcie_slots":"1x PCIe 5.0 x16, 1x PCIe 4.0 x16","m2_slots":3,"usb_ports":"8x USB-A, 2x USB-C","wifi":"WiFi 6","lan":"2.5G"}'
WHERE id = '20000000-0000-0000-0000-000000000004';

UPDATE products SET specifications = '{"socket":"AM5","chipset":"B650","form_factor":"ATX","memory_slots":4,"max_memory":"128GB","memory_type":"DDR5","pcie_slots":"2x PCIe 4.0 x16","m2_slots":4,"usb_ports":"9x USB-A, 1x USB-C","wifi":"WiFi 6E","lan":"2.5G"}'
WHERE id = '20000000-0000-0000-0000-000000000005';

UPDATE products SET specifications = '{"capacity":"32GB","kit_config":"2x16GB","type":"DDR5","speed":"5600 MHz","cas_latency":36,"voltage":"1.25V","heat_spreader":true,"rgb":false}'
WHERE id = '20000000-0000-0000-0000-000000000006';

UPDATE products SET specifications = '{"capacity":"32GB","kit_config":"2x16GB","type":"DDR5","speed":"6000 MHz","cas_latency":30,"voltage":"1.35V","heat_spreader":true,"rgb":true}'
WHERE id = '20000000-0000-0000-0000-000000000007';

UPDATE products SET specifications = '{"gpu":"NVIDIA GeForce RTX 4070 SUPER","vram":"12GB GDDR6X","memory_bus":"192-bit","base_clock":"1980 MHz","boost_clock":"2475 MHz","cuda_cores":7168,"rt_cores":56,"tdp":"220W","outputs":"3x DisplayPort 1.4a, 1x HDMI 2.1","recommended_psu":"650W"}'
WHERE id = '20000000-0000-0000-0000-000000000008';

UPDATE products SET specifications = '{"gpu":"AMD Radeon RX 7800 XT","vram":"16GB GDDR6","memory_bus":"256-bit","base_clock":"1295 MHz","boost_clock":"2430 MHz","stream_processors":3840,"ray_accelerators":60,"tdp":"263W","outputs":"2x DisplayPort 2.1, 2x HDMI 2.1, 1x USB-C","recommended_psu":"700W"}'
WHERE id = '20000000-0000-0000-0000-000000000009';

UPDATE products SET specifications = '{"wattage":"750W","efficiency":"80\u002B Gold","modular":"Full","fan_size":"120mm","fan_type":"Rifle Bearing","atx_version":"ATX 3.0","pcie_connectors":"4x 8-pin (2x 12VHPWR)","sata_connectors":8,"noise_level":"10-25 dBA"}'
WHERE id = '20000000-0000-0000-0000-000000000010';

UPDATE products SET specifications = '{"wattage":"850W","efficiency":"80\u002B Gold","modular":"Semi","fan_size":"135mm","fan_type":"Silent Wings","atx_version":"ATX 3.0","pcie_connectors":"6x 8-pin","sata_connectors":6,"noise_level":"5-18 dBA"}'
WHERE id = '20000000-0000-0000-0000-000000000011';

UPDATE products SET specifications = '{"wattage":"850W","efficiency":"80\u002B Gold","modular":"Full","fan_size":"120mm","fan_type":"Fluid Dynamic Bearing","atx_version":"ATX 3.0","pcie_connectors":"6x 8-pin","sata_connectors":8,"noise_level":"8-22 dBA"}'
WHERE id = '20000000-0000-0000-0000-000000000012';

INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('20260321052829_AddFilterAttributesForAllCategories', '8.0.11');

COMMIT;

START TRANSACTION;

INSERT INTO category_filter_attributes (id, attribute_key, category_id, display_name, filter_type, sort_order)
VALUES ('30000000-0000-0000-0000-000000000020', 'videopamyat', '00000000-0000-0000-0000-000000000004', 'Видеопамять, ГБ', 1, 1);

INSERT INTO category_filter_attributes (id, attribute_key, category_id, display_name, filter_type, sort_order)
VALUES ('30000000-0000-0000-0000-000000000021', 'graficheskiy_protsessor', '00000000-0000-0000-0000-000000000004', 'Графический процессор', 0, 2);

INSERT INTO category_filter_attributes (id, attribute_key, category_id, display_name, filter_type, sort_order)
VALUES ('30000000-0000-0000-0000-000000000022', 'proizvoditel_graficheskogo_protsessora', '00000000-0000-0000-0000-000000000004', 'Производитель ГП', 0, 3);

INSERT INTO category_filter_attributes (id, attribute_key, category_id, display_name, filter_type, sort_order)
VALUES ('30000000-0000-0000-0000-000000000023', 'tip_videopamyati', '00000000-0000-0000-0000-000000000004', 'Тип видеопамяти', 0, 4);

INSERT INTO category_filter_attributes (id, attribute_key, category_id, display_name, filter_type, sort_order)
VALUES ('30000000-0000-0000-0000-000000000024', 'data_vykhoda_na_rynok_2', '00000000-0000-0000-0000-000000000004', 'Дата выхода на рынок, г', 1, 5);

INSERT INTO category_filter_attributes (id, attribute_key, category_id, display_name, filter_type, sort_order)
VALUES ('30000000-0000-0000-0000-000000000025', 'shirina_shiny_pamyati', '00000000-0000-0000-0000-000000000004', 'Ширина шины памяти, бит', 1, 6);

INSERT INTO category_filter_attributes (id, attribute_key, category_id, display_name, filter_type, sort_order)
VALUES ('30000000-0000-0000-0000-000000000026', 'okhlazhdenie_1', '00000000-0000-0000-0000-000000000004', 'Охлаждение', 0, 7);

INSERT INTO category_filter_attributes (id, attribute_key, category_id, display_name, filter_type, sort_order)
VALUES ('30000000-0000-0000-0000-000000000027', 'razyemy_pitaniya', '00000000-0000-0000-0000-000000000004', 'Разъёмы питания', 0, 8);

INSERT INTO category_filter_attributes (id, attribute_key, category_id, display_name, filter_type, sort_order)
VALUES ('30000000-0000-0000-0000-000000000028', 'interfeys_1', '00000000-0000-0000-0000-000000000004', 'Интерфейс', 0, 9);

INSERT INTO category_filter_attributes (id, attribute_key, category_id, display_name, filter_type, sort_order)
VALUES ('30000000-0000-0000-0000-000000000029', 'rekomenduemyy_blok_pitaniya', '00000000-0000-0000-0000-000000000004', 'Рекомендуемый БП, Вт', 1, 10);

INSERT INTO category_filter_attributes (id, attribute_key, category_id, display_name, filter_type, sort_order)
VALUES ('30000000-0000-0000-0000-00000000002a', 'dlina_videokarty', '00000000-0000-0000-0000-000000000004', 'Длина, мм', 1, 11);

INSERT INTO category_filter_attributes (id, attribute_key, category_id, display_name, filter_type, sort_order)
VALUES ('30000000-0000-0000-0000-00000000002b', 'vysota_videokarty', '00000000-0000-0000-0000-000000000004', 'Высота, мм', 1, 12);

UPDATE products SET specifications = '{"socket":"AM4","cores":6,"threads":12,"base_clock":"3.7 GHz","boost_clock":"4.6 GHz","tdp":"65W","l3_cache":"32MB","unlocked":true,"integrated_graphics":false}'
WHERE id = '20000000-0000-0000-0000-000000000001';

UPDATE products SET specifications = '{"socket":"AM5","cores":8,"threads":16,"base_clock":"4.2 GHz","boost_clock":"5.0 GHz","tdp":"120W","l3_cache":"104MB","unlocked":true,"integrated_graphics":true}'
WHERE id = '20000000-0000-0000-0000-000000000002';

UPDATE products SET specifications = '{"socket":"LGA1700","cores":14,"threads":20,"base_clock":"3.5 GHz","boost_clock":"5.1 GHz","tdp":"125W","l3_cache":"24MB","unlocked":true,"integrated_graphics":false}'
WHERE id = '20000000-0000-0000-0000-000000000003';

UPDATE products SET specifications = '{"socket":"AM5","chipset":"B650","form_factor":"ATX","memory_slots":4,"max_memory":"128GB","memory_type":"DDR5","pcie_slots":"1x PCIe 5.0 x16, 1x PCIe 4.0 x16","m2_slots":3,"usb_ports":"8x USB-A, 2x USB-C","wifi":"WiFi 6","lan":"2.5G"}'
WHERE id = '20000000-0000-0000-0000-000000000004';

UPDATE products SET specifications = '{"socket":"AM5","chipset":"B650","form_factor":"ATX","memory_slots":4,"max_memory":"128GB","memory_type":"DDR5","pcie_slots":"2x PCIe 4.0 x16","m2_slots":4,"usb_ports":"9x USB-A, 1x USB-C","wifi":"WiFi 6E","lan":"2.5G"}'
WHERE id = '20000000-0000-0000-0000-000000000005';

UPDATE products SET specifications = '{"capacity":"32GB","kit_config":"2x16GB","type":"DDR5","speed":"5600 MHz","cas_latency":36,"voltage":"1.25V","heat_spreader":true,"rgb":false}'
WHERE id = '20000000-0000-0000-0000-000000000006';

UPDATE products SET specifications = '{"capacity":"32GB","kit_config":"2x16GB","type":"DDR5","speed":"6000 MHz","cas_latency":30,"voltage":"1.35V","heat_spreader":true,"rgb":true}'
WHERE id = '20000000-0000-0000-0000-000000000007';

UPDATE products SET specifications = '{"gpu":"NVIDIA GeForce RTX 4070 SUPER","vram":"12GB GDDR6X","memory_bus":"192-bit","base_clock":"1980 MHz","boost_clock":"2475 MHz","cuda_cores":7168,"rt_cores":56,"tdp":"220W","outputs":"3x DisplayPort 1.4a, 1x HDMI 2.1","recommended_psu":"650W"}'
WHERE id = '20000000-0000-0000-0000-000000000008';

UPDATE products SET specifications = '{"gpu":"AMD Radeon RX 7800 XT","vram":"16GB GDDR6","memory_bus":"256-bit","base_clock":"1295 MHz","boost_clock":"2430 MHz","stream_processors":3840,"ray_accelerators":60,"tdp":"263W","outputs":"2x DisplayPort 2.1, 2x HDMI 2.1, 1x USB-C","recommended_psu":"700W"}'
WHERE id = '20000000-0000-0000-0000-000000000009';

UPDATE products SET specifications = '{"wattage":"750W","efficiency":"80\u002B Gold","modular":"Full","fan_size":"120mm","fan_type":"Rifle Bearing","atx_version":"ATX 3.0","pcie_connectors":"4x 8-pin (2x 12VHPWR)","sata_connectors":8,"noise_level":"10-25 dBA"}'
WHERE id = '20000000-0000-0000-0000-000000000010';

UPDATE products SET specifications = '{"wattage":"850W","efficiency":"80\u002B Gold","modular":"Semi","fan_size":"135mm","fan_type":"Silent Wings","atx_version":"ATX 3.0","pcie_connectors":"6x 8-pin","sata_connectors":6,"noise_level":"5-18 dBA"}'
WHERE id = '20000000-0000-0000-0000-000000000011';

UPDATE products SET specifications = '{"wattage":"850W","efficiency":"80\u002B Gold","modular":"Full","fan_size":"120mm","fan_type":"Fluid Dynamic Bearing","atx_version":"ATX 3.0","pcie_connectors":"6x 8-pin","sata_connectors":8,"noise_level":"8-22 dBA"}'
WHERE id = '20000000-0000-0000-0000-000000000012';

INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('20260321135704_AddXCoreGpuFilterAttributes', '8.0.11');

COMMIT;

START TRANSACTION;

ALTER TABLE product_images ADD path character varying(500);

ALTER TABLE manufacturers ADD logo_path character varying(500);

INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('20260322110000_AddProductImagePathAndManufacturerLogoPath', '8.0.11');

COMMIT;

START TRANSACTION;

INSERT INTO categories (id, component_type, description, "Icon", name, "Order", parent_id, slug)
VALUES ('00000000-0000-0000-0000-00000000000b', 12, NULL, NULL, 'Клавиатуры', 0, NULL, 'keyboards');

INSERT INTO categories (id, component_type, description, "Icon", name, "Order", parent_id, slug)
VALUES ('00000000-0000-0000-0000-00000000000c', 13, NULL, NULL, 'Мыши', 0, NULL, 'mice');

INSERT INTO categories (id, component_type, description, "Icon", name, "Order", parent_id, slug)
VALUES ('00000000-0000-0000-0000-00000000000d', 14, NULL, NULL, 'Наушники', 0, NULL, 'headphones');

UPDATE products SET specifications = '{"socket":"AM4","cores":6,"threads":12,"base_clock":"3.7 GHz","boost_clock":"4.6 GHz","tdp":"65W","l3_cache":"32MB","unlocked":true,"integrated_graphics":false}'
WHERE id = '20000000-0000-0000-0000-000000000001';

UPDATE products SET specifications = '{"socket":"AM5","cores":8,"threads":16,"base_clock":"4.2 GHz","boost_clock":"5.0 GHz","tdp":"120W","l3_cache":"104MB","unlocked":true,"integrated_graphics":true}'
WHERE id = '20000000-0000-0000-0000-000000000002';

UPDATE products SET specifications = '{"socket":"LGA1700","cores":14,"threads":20,"base_clock":"3.5 GHz","boost_clock":"5.1 GHz","tdp":"125W","l3_cache":"24MB","unlocked":true,"integrated_graphics":false}'
WHERE id = '20000000-0000-0000-0000-000000000003';

UPDATE products SET specifications = '{"socket":"AM5","chipset":"B650","form_factor":"ATX","memory_slots":4,"max_memory":"128GB","memory_type":"DDR5","pcie_slots":"1x PCIe 5.0 x16, 1x PCIe 4.0 x16","m2_slots":3,"usb_ports":"8x USB-A, 2x USB-C","wifi":"WiFi 6","lan":"2.5G"}'
WHERE id = '20000000-0000-0000-0000-000000000004';

UPDATE products SET specifications = '{"socket":"AM5","chipset":"B650","form_factor":"ATX","memory_slots":4,"max_memory":"128GB","memory_type":"DDR5","pcie_slots":"2x PCIe 4.0 x16","m2_slots":4,"usb_ports":"9x USB-A, 1x USB-C","wifi":"WiFi 6E","lan":"2.5G"}'
WHERE id = '20000000-0000-0000-0000-000000000005';

UPDATE products SET specifications = '{"capacity":"32GB","kit_config":"2x16GB","type":"DDR5","speed":"5600 MHz","cas_latency":36,"voltage":"1.25V","heat_spreader":true,"rgb":false}'
WHERE id = '20000000-0000-0000-0000-000000000006';

UPDATE products SET specifications = '{"capacity":"32GB","kit_config":"2x16GB","type":"DDR5","speed":"6000 MHz","cas_latency":30,"voltage":"1.35V","heat_spreader":true,"rgb":true}'
WHERE id = '20000000-0000-0000-0000-000000000007';

UPDATE products SET specifications = '{"gpu":"NVIDIA GeForce RTX 4070 SUPER","vram":"12GB GDDR6X","memory_bus":"192-bit","base_clock":"1980 MHz","boost_clock":"2475 MHz","cuda_cores":7168,"rt_cores":56,"tdp":"220W","outputs":"3x DisplayPort 1.4a, 1x HDMI 2.1","recommended_psu":"650W"}'
WHERE id = '20000000-0000-0000-0000-000000000008';

UPDATE products SET specifications = '{"gpu":"AMD Radeon RX 7800 XT","vram":"16GB GDDR6","memory_bus":"256-bit","base_clock":"1295 MHz","boost_clock":"2430 MHz","stream_processors":3840,"ray_accelerators":60,"tdp":"263W","outputs":"2x DisplayPort 2.1, 2x HDMI 2.1, 1x USB-C","recommended_psu":"700W"}'
WHERE id = '20000000-0000-0000-0000-000000000009';

UPDATE products SET specifications = '{"wattage":"750W","efficiency":"80\u002B Gold","modular":"Full","fan_size":"120mm","fan_type":"Rifle Bearing","atx_version":"ATX 3.0","pcie_connectors":"4x 8-pin (2x 12VHPWR)","sata_connectors":8,"noise_level":"10-25 dBA"}'
WHERE id = '20000000-0000-0000-0000-000000000010';

UPDATE products SET specifications = '{"wattage":"850W","efficiency":"80\u002B Gold","modular":"Semi","fan_size":"135mm","fan_type":"Silent Wings","atx_version":"ATX 3.0","pcie_connectors":"6x 8-pin","sata_connectors":6,"noise_level":"5-18 dBA"}'
WHERE id = '20000000-0000-0000-0000-000000000011';

UPDATE products SET specifications = '{"wattage":"850W","efficiency":"80\u002B Gold","modular":"Full","fan_size":"120mm","fan_type":"Fluid Dynamic Bearing","atx_version":"ATX 3.0","pcie_connectors":"6x 8-pin","sata_connectors":8,"noise_level":"8-22 dBA"}'
WHERE id = '20000000-0000-0000-0000-000000000012';

INSERT INTO category_filter_attributes (id, attribute_key, category_id, display_name, filter_type, sort_order)
VALUES ('30000000-0000-0000-0000-000000000016', 'type', '00000000-0000-0000-0000-00000000000b', 'Тип/типоразмер', 0, 1);

INSERT INTO category_filter_attributes (id, attribute_key, category_id, display_name, filter_type, sort_order)
VALUES ('30000000-0000-0000-0000-000000000017', 'interface', '00000000-0000-0000-0000-00000000000b', 'Интерфейс', 0, 2);

INSERT INTO category_filter_attributes (id, attribute_key, category_id, display_name, filter_type, sort_order)
VALUES ('30000000-0000-0000-0000-000000000018', 'color', '00000000-0000-0000-0000-00000000000b', 'Цвет', 0, 3);

INSERT INTO category_filter_attributes (id, attribute_key, category_id, display_name, filter_type, sort_order)
VALUES ('30000000-0000-0000-0000-000000000019', 'type', '00000000-0000-0000-0000-00000000000c', 'Тип', 0, 1);

INSERT INTO category_filter_attributes (id, attribute_key, category_id, display_name, filter_type, sort_order)
VALUES ('30000000-0000-0000-0000-00000000001a', 'interface', '00000000-0000-0000-0000-00000000000c', 'Интерфейс', 0, 2);

INSERT INTO category_filter_attributes (id, attribute_key, category_id, display_name, filter_type, sort_order)
VALUES ('30000000-0000-0000-0000-00000000001b', 'dpi', '00000000-0000-0000-0000-00000000000c', 'DPI', 1, 3);

INSERT INTO category_filter_attributes (id, attribute_key, category_id, display_name, filter_type, sort_order)
VALUES ('30000000-0000-0000-0000-00000000001c', 'sensor_type', '00000000-0000-0000-0000-00000000000c', 'Тип сенсора', 0, 4);

INSERT INTO category_filter_attributes (id, attribute_key, category_id, display_name, filter_type, sort_order)
VALUES ('30000000-0000-0000-0000-00000000001d', 'type', '00000000-0000-0000-0000-00000000000d', 'Тип', 0, 1);

INSERT INTO category_filter_attributes (id, attribute_key, category_id, display_name, filter_type, sort_order)
VALUES ('30000000-0000-0000-0000-00000000001e', 'interface', '00000000-0000-0000-0000-00000000000d', 'Интерфейс', 0, 2);

INSERT INTO category_filter_attributes (id, attribute_key, category_id, display_name, filter_type, sort_order)
VALUES ('30000000-0000-0000-0000-00000000001f', 'color', '00000000-0000-0000-0000-00000000000d', 'Цвет', 0, 3);

INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('20260323055427_SplitPeripheryIntoKeyboardsMiceHeadphones', '8.0.11');

COMMIT;

START TRANSACTION;

ALTER TABLE category_filter_attributes ADD attribute_id uuid NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000';

CREATE TABLE specification_attributes (
    id uuid NOT NULL,
    key character varying(50) NOT NULL,
    display_name character varying(100) NOT NULL,
    value_type integer NOT NULL,
    is_multi_value boolean NOT NULL,
    CONSTRAINT "PK_specification_attributes" PRIMARY KEY (id)
);

CREATE TABLE specification_canonical_values (
    id uuid NOT NULL,
    attribute_id uuid NOT NULL,
    value_text character varying(200) NOT NULL,
    sort_order integer NOT NULL,
    CONSTRAINT "PK_specification_canonical_values" PRIMARY KEY (id),
    CONSTRAINT "FK_specification_canonical_values_specification_attributes_att~" FOREIGN KEY (attribute_id) REFERENCES specification_attributes (id) ON DELETE CASCADE
);

CREATE TABLE product_specification_values (
    id uuid NOT NULL,
    product_id uuid NOT NULL,
    attribute_id uuid NOT NULL,
    canonical_value_id uuid,
    value_number numeric(18,4),
    CONSTRAINT "PK_product_specification_values" PRIMARY KEY (id),
    CONSTRAINT "FK_product_specification_values_products_product_id" FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE,
    CONSTRAINT "FK_product_specification_values_specification_attributes_attri~" FOREIGN KEY (attribute_id) REFERENCES specification_attributes (id) ON DELETE RESTRICT,
    CONSTRAINT "FK_product_specification_values_specification_canonical_values~" FOREIGN KEY (canonical_value_id) REFERENCES specification_canonical_values (id) ON DELETE RESTRICT
);

UPDATE category_filter_attributes SET attribute_id = '40000000-0000-0000-0000-000000000002'
WHERE id = '30000000-0000-0000-0000-000000000001';

UPDATE category_filter_attributes SET attribute_id = '40000000-0000-0000-0000-000000000003'
WHERE id = '30000000-0000-0000-0000-000000000002';

UPDATE category_filter_attributes SET attribute_id = '40000000-0000-0000-0000-000000000001'
WHERE id = '30000000-0000-0000-0000-000000000003';

UPDATE category_filter_attributes SET attribute_id = '40000000-0000-0000-0000-000000000004'
WHERE id = '30000000-0000-0000-0000-000000000004';

UPDATE category_filter_attributes SET attribute_id = '40000000-0000-0000-0000-000000000001'
WHERE id = '30000000-0000-0000-0000-000000000005';

UPDATE category_filter_attributes SET attribute_id = '40000000-0000-0000-0000-000000000005'
WHERE id = '30000000-0000-0000-0000-000000000006';

UPDATE category_filter_attributes SET attribute_id = '40000000-0000-0000-0000-000000000006'
WHERE id = '30000000-0000-0000-0000-000000000007';

UPDATE category_filter_attributes SET attribute_id = '40000000-0000-0000-0000-000000000007'
WHERE id = '30000000-0000-0000-0000-000000000008';

UPDATE category_filter_attributes SET attribute_id = '40000000-0000-0000-0000-000000000007'
WHERE id = '30000000-0000-0000-0000-000000000009';

UPDATE category_filter_attributes SET attribute_id = '40000000-0000-0000-0000-000000000008'
WHERE id = '30000000-0000-0000-0000-00000000000a';

UPDATE category_filter_attributes SET attribute_id = '40000000-0000-0000-0000-000000000009'
WHERE id = '30000000-0000-0000-0000-00000000000b';

UPDATE category_filter_attributes SET attribute_id = '40000000-0000-0000-0000-00000000000a'
WHERE id = '30000000-0000-0000-0000-00000000000c';

UPDATE category_filter_attributes SET attribute_id = '40000000-0000-0000-0000-00000000000b'
WHERE id = '30000000-0000-0000-0000-00000000000d';

UPDATE category_filter_attributes SET attribute_id = '40000000-0000-0000-0000-000000000006'
WHERE id = '30000000-0000-0000-0000-00000000000e';

UPDATE category_filter_attributes SET attribute_id = '40000000-0000-0000-0000-000000000001'
WHERE id = '30000000-0000-0000-0000-00000000000f';

UPDATE category_filter_attributes SET attribute_id = '40000000-0000-0000-0000-00000000000c'
WHERE id = '30000000-0000-0000-0000-000000000010';

UPDATE category_filter_attributes SET attribute_id = '40000000-0000-0000-0000-00000000000d'
WHERE id = '30000000-0000-0000-0000-000000000011';

UPDATE category_filter_attributes SET attribute_id = '40000000-0000-0000-0000-00000000000e'
WHERE id = '30000000-0000-0000-0000-000000000012';

UPDATE category_filter_attributes SET attribute_id = '40000000-0000-0000-0000-00000000000f'
WHERE id = '30000000-0000-0000-0000-000000000013';

UPDATE category_filter_attributes SET attribute_id = '40000000-0000-0000-0000-000000000006'
WHERE id = '30000000-0000-0000-0000-000000000014';

UPDATE category_filter_attributes SET attribute_id = '40000000-0000-0000-0000-000000000010'
WHERE id = '30000000-0000-0000-0000-000000000015';

UPDATE category_filter_attributes SET attribute_id = '40000000-0000-0000-0000-000000000006'
WHERE id = '30000000-0000-0000-0000-000000000016';

UPDATE category_filter_attributes SET attribute_id = '40000000-0000-0000-0000-000000000019'
WHERE id = '30000000-0000-0000-0000-000000000017';

UPDATE category_filter_attributes SET attribute_id = '40000000-0000-0000-0000-00000000000b'
WHERE id = '30000000-0000-0000-0000-000000000018';

UPDATE category_filter_attributes SET attribute_id = '40000000-0000-0000-0000-000000000006'
WHERE id = '30000000-0000-0000-0000-000000000019';

UPDATE category_filter_attributes SET attribute_id = '40000000-0000-0000-0000-000000000019'
WHERE id = '30000000-0000-0000-0000-00000000001a';

UPDATE category_filter_attributes SET attribute_id = '40000000-0000-0000-0000-000000000011'
WHERE id = '30000000-0000-0000-0000-00000000001b';

UPDATE category_filter_attributes SET attribute_id = '40000000-0000-0000-0000-000000000012'
WHERE id = '30000000-0000-0000-0000-00000000001c';

UPDATE category_filter_attributes SET attribute_id = '40000000-0000-0000-0000-000000000006'
WHERE id = '30000000-0000-0000-0000-00000000001d';

UPDATE category_filter_attributes SET attribute_id = '40000000-0000-0000-0000-000000000019'
WHERE id = '30000000-0000-0000-0000-00000000001e';

UPDATE category_filter_attributes SET attribute_id = '40000000-0000-0000-0000-00000000000b'
WHERE id = '30000000-0000-0000-0000-00000000001f';

UPDATE category_filter_attributes SET attribute_id = '40000000-0000-0000-0000-000000000002'
WHERE id = '30000000-0000-0000-0000-000000000020';

UPDATE category_filter_attributes SET attribute_id = '40000000-0000-0000-0000-000000000003'
WHERE id = '30000000-0000-0000-0000-000000000021';

UPDATE category_filter_attributes SET attribute_id = '40000000-0000-0000-0000-00000000001c'
WHERE id = '30000000-0000-0000-0000-000000000022';

UPDATE category_filter_attributes SET attribute_id = '40000000-0000-0000-0000-000000000002'
WHERE id = '30000000-0000-0000-0000-000000000023';

UPDATE category_filter_attributes SET attribute_id = '40000000-0000-0000-0000-00000000001b'
WHERE id = '30000000-0000-0000-0000-000000000024';

UPDATE category_filter_attributes SET attribute_id = '40000000-0000-0000-0000-00000000001d'
WHERE id = '30000000-0000-0000-0000-000000000025';

UPDATE category_filter_attributes SET attribute_id = '40000000-0000-0000-0000-00000000001e'
WHERE id = '30000000-0000-0000-0000-000000000026';

UPDATE category_filter_attributes SET attribute_id = '40000000-0000-0000-0000-00000000001f'
WHERE id = '30000000-0000-0000-0000-000000000027';

UPDATE category_filter_attributes SET attribute_id = '40000000-0000-0000-0000-000000000019'
WHERE id = '30000000-0000-0000-0000-000000000028';

UPDATE category_filter_attributes SET attribute_id = '40000000-0000-0000-0000-000000000020'
WHERE id = '30000000-0000-0000-0000-000000000029';

UPDATE category_filter_attributes SET attribute_id = '40000000-0000-0000-0000-000000000021'
WHERE id = '30000000-0000-0000-0000-00000000002a';

UPDATE category_filter_attributes SET attribute_id = '40000000-0000-0000-0000-000000000022'
WHERE id = '30000000-0000-0000-0000-00000000002b';

INSERT INTO specification_attributes (id, display_name, is_multi_value, key, value_type)
VALUES ('40000000-0000-0000-0000-000000000001', 'Сокет', TRUE, 'socket', 0);
INSERT INTO specification_attributes (id, display_name, is_multi_value, key, value_type)
VALUES ('40000000-0000-0000-0000-000000000002', 'Объём видеопамяти', FALSE, 'vram', 0);
INSERT INTO specification_attributes (id, display_name, is_multi_value, key, value_type)
VALUES ('40000000-0000-0000-0000-000000000003', 'Серия GPU', FALSE, 'gpu', 0);
INSERT INTO specification_attributes (id, display_name, is_multi_value, key, value_type)
VALUES ('40000000-0000-0000-0000-000000000004', 'Количество ядер', FALSE, 'cores', 1);
INSERT INTO specification_attributes (id, display_name, is_multi_value, key, value_type)
VALUES ('40000000-0000-0000-0000-000000000005', 'Чипсет', FALSE, 'chipset', 0);
INSERT INTO specification_attributes (id, display_name, is_multi_value, key, value_type)
VALUES ('40000000-0000-0000-0000-000000000006', 'Тип', FALSE, 'type', 0);
INSERT INTO specification_attributes (id, display_name, is_multi_value, key, value_type)
VALUES ('40000000-0000-0000-0000-000000000007', 'Объём', FALSE, 'capacity', 0);
INSERT INTO specification_attributes (id, display_name, is_multi_value, key, value_type)
VALUES ('40000000-0000-0000-0000-000000000008', 'Мощность', FALSE, 'wattage', 0);
INSERT INTO specification_attributes (id, display_name, is_multi_value, key, value_type)
VALUES ('40000000-0000-0000-0000-000000000009', 'Сертификат', FALSE, 'efficiency', 0);
INSERT INTO specification_attributes (id, display_name, is_multi_value, key, value_type)
VALUES ('40000000-0000-0000-0000-00000000000a', 'Форм-фактор', TRUE, 'form_factor', 0);
INSERT INTO specification_attributes (id, display_name, is_multi_value, key, value_type)
VALUES ('40000000-0000-0000-0000-00000000000b', 'Цвет', FALSE, 'color', 0);
INSERT INTO specification_attributes (id, display_name, is_multi_value, key, value_type)
VALUES ('40000000-0000-0000-0000-00000000000c', 'TDP', FALSE, 'tdp', 1);
INSERT INTO specification_attributes (id, display_name, is_multi_value, key, value_type)
VALUES ('40000000-0000-0000-0000-00000000000d', 'Диагональ', FALSE, 'diagonal', 0);
INSERT INTO specification_attributes (id, display_name, is_multi_value, key, value_type)
VALUES ('40000000-0000-0000-0000-00000000000e', 'Разрешение', FALSE, 'resolution', 0);
INSERT INTO specification_attributes (id, display_name, is_multi_value, key, value_type)
VALUES ('40000000-0000-0000-0000-00000000000f', 'Частота обновления', FALSE, 'refresh_rate', 0);
INSERT INTO specification_attributes (id, display_name, is_multi_value, key, value_type)
VALUES ('40000000-0000-0000-0000-000000000010', 'Подключение', FALSE, 'connection', 0);
INSERT INTO specification_attributes (id, display_name, is_multi_value, key, value_type)
VALUES ('40000000-0000-0000-0000-000000000011', 'DPI', FALSE, 'dpi', 1);
INSERT INTO specification_attributes (id, display_name, is_multi_value, key, value_type)
VALUES ('40000000-0000-0000-0000-000000000012', 'Тип сенсора', FALSE, 'sensor_type', 0);
INSERT INTO specification_attributes (id, display_name, is_multi_value, key, value_type)
VALUES ('40000000-0000-0000-0000-000000000013', 'Тип памяти', TRUE, 'memory_type', 0);
INSERT INTO specification_attributes (id, display_name, is_multi_value, key, value_type)
VALUES ('40000000-0000-0000-0000-000000000014', 'Потоков', FALSE, 'threads', 1);
INSERT INTO specification_attributes (id, display_name, is_multi_value, key, value_type)
VALUES ('40000000-0000-0000-0000-000000000015', 'Встроенная графика', FALSE, 'integrated_graphics', 0);
INSERT INTO specification_attributes (id, display_name, is_multi_value, key, value_type)
VALUES ('40000000-0000-0000-0000-000000000016', 'Модульный', FALSE, 'modular', 0);
INSERT INTO specification_attributes (id, display_name, is_multi_value, key, value_type)
VALUES ('40000000-0000-0000-0000-000000000017', 'Слотов памяти', FALSE, 'memory_slots', 1);
INSERT INTO specification_attributes (id, display_name, is_multi_value, key, value_type)
VALUES ('40000000-0000-0000-0000-000000000018', 'Макс. память', FALSE, 'max_memory', 0);
INSERT INTO specification_attributes (id, display_name, is_multi_value, key, value_type)
VALUES ('40000000-0000-0000-0000-000000000019', 'Интерфейс', FALSE, 'interface', 0);
INSERT INTO specification_attributes (id, display_name, is_multi_value, key, value_type)
VALUES ('40000000-0000-0000-0000-00000000001a', 'Год выхода', FALSE, 'release_year', 0);
INSERT INTO specification_attributes (id, display_name, is_multi_value, key, value_type)
VALUES ('40000000-0000-0000-0000-00000000001b', 'Дата выхода (legacy)', FALSE, 'data_vykhoda_na_rynok_2', 0);
INSERT INTO specification_attributes (id, display_name, is_multi_value, key, value_type)
VALUES ('40000000-0000-0000-0000-00000000001c', 'Производитель ГП', FALSE, 'proizvoditel_graficheskogo_protsessora', 0);
INSERT INTO specification_attributes (id, display_name, is_multi_value, key, value_type)
VALUES ('40000000-0000-0000-0000-00000000001d', 'Ширина шины памяти', FALSE, 'shirina_shiny_pamyati', 1);
INSERT INTO specification_attributes (id, display_name, is_multi_value, key, value_type)
VALUES ('40000000-0000-0000-0000-00000000001e', 'Охлаждение', FALSE, 'okhlazhdenie_1', 0);
INSERT INTO specification_attributes (id, display_name, is_multi_value, key, value_type)
VALUES ('40000000-0000-0000-0000-00000000001f', 'Разъёмы питания', FALSE, 'razyemy_pitaniya', 0);
INSERT INTO specification_attributes (id, display_name, is_multi_value, key, value_type)
VALUES ('40000000-0000-0000-0000-000000000020', 'Рек. БП, Вт', FALSE, 'rekomenduemyy_blok_pitaniya', 1);
INSERT INTO specification_attributes (id, display_name, is_multi_value, key, value_type)
VALUES ('40000000-0000-0000-0000-000000000021', 'Длина видеокарты', FALSE, 'dlina_videokarty', 1);
INSERT INTO specification_attributes (id, display_name, is_multi_value, key, value_type)
VALUES ('40000000-0000-0000-0000-000000000022', 'Высота видеокарты', FALSE, 'vysota_videokarty', 1);

INSERT INTO specification_canonical_values (id, attribute_id, sort_order, value_text)
VALUES ('50000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', 1, 'AM4');
INSERT INTO specification_canonical_values (id, attribute_id, sort_order, value_text)
VALUES ('50000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000001', 2, 'AM5');
INSERT INTO specification_canonical_values (id, attribute_id, sort_order, value_text)
VALUES ('50000000-0000-0000-0000-000000000003', '40000000-0000-0000-0000-000000000001', 3, 'LGA1700');
INSERT INTO specification_canonical_values (id, attribute_id, sort_order, value_text)
VALUES ('50000000-0000-0000-0000-000000000004', '40000000-0000-0000-0000-000000000002', 1, '8GB GDDR6');
INSERT INTO specification_canonical_values (id, attribute_id, sort_order, value_text)
VALUES ('50000000-0000-0000-0000-000000000005', '40000000-0000-0000-0000-000000000002', 2, '12GB GDDR6X');
INSERT INTO specification_canonical_values (id, attribute_id, sort_order, value_text)
VALUES ('50000000-0000-0000-0000-000000000006', '40000000-0000-0000-0000-000000000002', 3, '16GB GDDR6');
INSERT INTO specification_canonical_values (id, attribute_id, sort_order, value_text)
VALUES ('50000000-0000-0000-0000-000000000007', '40000000-0000-0000-0000-000000000002', 4, '8GB');
INSERT INTO specification_canonical_values (id, attribute_id, sort_order, value_text)
VALUES ('50000000-0000-0000-0000-000000000008', '40000000-0000-0000-0000-000000000002', 5, '12GB');
INSERT INTO specification_canonical_values (id, attribute_id, sort_order, value_text)
VALUES ('50000000-0000-0000-0000-000000000009', '40000000-0000-0000-0000-000000000002', 6, '16GB');
INSERT INTO specification_canonical_values (id, attribute_id, sort_order, value_text)
VALUES ('50000000-0000-0000-0000-000000000010', '40000000-0000-0000-0000-000000000003', 1, 'NVIDIA GeForce RTX 4070 SUPER');
INSERT INTO specification_canonical_values (id, attribute_id, sort_order, value_text)
VALUES ('50000000-0000-0000-0000-000000000011', '40000000-0000-0000-0000-000000000003', 2, 'AMD Radeon RX 7800 XT');
INSERT INTO specification_canonical_values (id, attribute_id, sort_order, value_text)
VALUES ('50000000-0000-0000-0000-000000000012', '40000000-0000-0000-0000-000000000003', 3, 'GeForce RTX 4070 SUPER');
INSERT INTO specification_canonical_values (id, attribute_id, sort_order, value_text)
VALUES ('50000000-0000-0000-0000-000000000013', '40000000-0000-0000-0000-000000000003', 4, 'Radeon RX 7800 XT');
INSERT INTO specification_canonical_values (id, attribute_id, sort_order, value_text)
VALUES ('50000000-0000-0000-0000-000000000014', '40000000-0000-0000-0000-000000000005', 1, 'B650');
INSERT INTO specification_canonical_values (id, attribute_id, sort_order, value_text)
VALUES ('50000000-0000-0000-0000-000000000015', '40000000-0000-0000-0000-000000000005', 2, 'Z790');
INSERT INTO specification_canonical_values (id, attribute_id, sort_order, value_text)
VALUES ('50000000-0000-0000-0000-000000000016', '40000000-0000-0000-0000-000000000006', 1, 'DDR5');
INSERT INTO specification_canonical_values (id, attribute_id, sort_order, value_text)
VALUES ('50000000-0000-0000-0000-000000000017', '40000000-0000-0000-0000-000000000006', 2, 'DDR4');
INSERT INTO specification_canonical_values (id, attribute_id, sort_order, value_text)
VALUES ('50000000-0000-0000-0000-000000000018', '40000000-0000-0000-0000-000000000007', 1, '32GB');
INSERT INTO specification_canonical_values (id, attribute_id, sort_order, value_text)
VALUES ('50000000-0000-0000-0000-000000000019', '40000000-0000-0000-0000-000000000007', 2, '16GB');
INSERT INTO specification_canonical_values (id, attribute_id, sort_order, value_text)
VALUES ('50000000-0000-0000-0000-000000000020', '40000000-0000-0000-0000-000000000007', 3, '64GB');
INSERT INTO specification_canonical_values (id, attribute_id, sort_order, value_text)
VALUES ('50000000-0000-0000-0000-000000000021', '40000000-0000-0000-0000-000000000007', 4, '128GB');
INSERT INTO specification_canonical_values (id, attribute_id, sort_order, value_text)
VALUES ('50000000-0000-0000-0000-000000000022', '40000000-0000-0000-0000-000000000008', 1, '750W');
INSERT INTO specification_canonical_values (id, attribute_id, sort_order, value_text)
VALUES ('50000000-0000-0000-0000-000000000023', '40000000-0000-0000-0000-000000000008', 2, '850W');
INSERT INTO specification_canonical_values (id, attribute_id, sort_order, value_text)
VALUES ('50000000-0000-0000-0000-000000000024', '40000000-0000-0000-0000-000000000008', 3, '650W');
INSERT INTO specification_canonical_values (id, attribute_id, sort_order, value_text)
VALUES ('50000000-0000-0000-0000-000000000025', '40000000-0000-0000-0000-000000000008', 4, '700W');
INSERT INTO specification_canonical_values (id, attribute_id, sort_order, value_text)
VALUES ('50000000-0000-0000-0000-000000000026', '40000000-0000-0000-0000-000000000009', 1, '80+ Gold');
INSERT INTO specification_canonical_values (id, attribute_id, sort_order, value_text)
VALUES ('50000000-0000-0000-0000-000000000027', '40000000-0000-0000-0000-000000000009', 2, '80+ Bronze');
INSERT INTO specification_canonical_values (id, attribute_id, sort_order, value_text)
VALUES ('50000000-0000-0000-0000-000000000028', '40000000-0000-0000-0000-000000000009', 3, '80+ Platinum');
INSERT INTO specification_canonical_values (id, attribute_id, sort_order, value_text)
VALUES ('50000000-0000-0000-0000-000000000029', '40000000-0000-0000-0000-000000000009', 4, '80+');
INSERT INTO specification_canonical_values (id, attribute_id, sort_order, value_text)
VALUES ('50000000-0000-0000-0000-000000000030', '40000000-0000-0000-0000-00000000000a', 1, 'ATX');
INSERT INTO specification_canonical_values (id, attribute_id, sort_order, value_text)
VALUES ('50000000-0000-0000-0000-000000000031', '40000000-0000-0000-0000-00000000000a', 2, 'mATX');
INSERT INTO specification_canonical_values (id, attribute_id, sort_order, value_text)
VALUES ('50000000-0000-0000-0000-000000000032', '40000000-0000-0000-0000-00000000000a', 3, 'Mini-ITX');
INSERT INTO specification_canonical_values (id, attribute_id, sort_order, value_text)
VALUES ('50000000-0000-0000-0000-000000000033', '40000000-0000-0000-0000-00000000000a', 4, 'eATX (до 280 мм)');
INSERT INTO specification_canonical_values (id, attribute_id, sort_order, value_text)
VALUES ('50000000-0000-0000-0000-000000000034', '40000000-0000-0000-0000-000000000016', 1, 'Полностью модульный');
INSERT INTO specification_canonical_values (id, attribute_id, sort_order, value_text)
VALUES ('50000000-0000-0000-0000-000000000035', '40000000-0000-0000-0000-000000000016', 2, 'Полумодульный');
INSERT INTO specification_canonical_values (id, attribute_id, sort_order, value_text)
VALUES ('50000000-0000-0000-0000-000000000036', '40000000-0000-0000-0000-000000000016', 3, 'Нет');
INSERT INTO specification_canonical_values (id, attribute_id, sort_order, value_text)
VALUES ('50000000-0000-0000-0000-000000000037', '40000000-0000-0000-0000-000000000016', 4, 'Full');
INSERT INTO specification_canonical_values (id, attribute_id, sort_order, value_text)
VALUES ('50000000-0000-0000-0000-000000000038', '40000000-0000-0000-0000-000000000016', 5, 'Semi');
INSERT INTO specification_canonical_values (id, attribute_id, sort_order, value_text)
VALUES ('50000000-0000-0000-0000-000000000039', '40000000-0000-0000-0000-000000000018', 1, '128GB');
INSERT INTO specification_canonical_values (id, attribute_id, sort_order, value_text)
VALUES ('50000000-0000-0000-0000-000000000040', '40000000-0000-0000-0000-000000000018', 2, '64GB');
INSERT INTO specification_canonical_values (id, attribute_id, sort_order, value_text)
VALUES ('50000000-0000-0000-0000-000000000041', '40000000-0000-0000-0000-000000000015', 1, 'Есть');
INSERT INTO specification_canonical_values (id, attribute_id, sort_order, value_text)
VALUES ('50000000-0000-0000-0000-000000000042', '40000000-0000-0000-0000-000000000015', 2, 'Нет');
INSERT INTO specification_canonical_values (id, attribute_id, sort_order, value_text)
VALUES ('50000000-0000-0000-0000-000000000043', '40000000-0000-0000-0000-000000000013', 1, 'DDR5');
INSERT INTO specification_canonical_values (id, attribute_id, sort_order, value_text)
VALUES ('50000000-0000-0000-0000-000000000044', '40000000-0000-0000-0000-000000000013', 2, 'DDR4');

CREATE INDEX "IX_category_filter_attributes_attribute_id" ON category_filter_attributes (attribute_id);

CREATE INDEX "IX_product_specification_values_attribute_id_canonical_value_id" ON product_specification_values (attribute_id, canonical_value_id);

CREATE INDEX "IX_product_specification_values_attribute_id_value_number" ON product_specification_values (attribute_id, value_number);

CREATE INDEX "IX_product_specification_values_canonical_value_id" ON product_specification_values (canonical_value_id);

CREATE INDEX "IX_product_specification_values_product_id_attribute_id" ON product_specification_values (product_id, attribute_id);

CREATE UNIQUE INDEX "IX_specification_attributes_key" ON specification_attributes (key);

CREATE UNIQUE INDEX "IX_specification_canonical_values_attribute_id_value_text" ON specification_canonical_values (attribute_id, value_text);


                INSERT INTO specification_attributes (id, key, display_name, value_type, is_multi_value)
                SELECT
                    gen_random_uuid(),
                    cfa.attribute_key,
                    left(max(cfa.display_name), 100),
                    CASE WHEN max(cfa.filter_type) = 1 THEN 1 ELSE 0 END,
                    false
                FROM category_filter_attributes cfa
                LEFT JOIN specification_attributes sa ON sa.key = cfa.attribute_key
                WHERE sa.id IS NULL
                GROUP BY cfa.attribute_key;

                UPDATE category_filter_attributes cfa SET attribute_id = sa.id FROM specification_attributes sa WHERE cfa.attribute_key = sa.key;
                UPDATE category_filter_attributes cfa SET attribute_id = (SELECT id FROM specification_attributes WHERE key = 'vram') WHERE cfa.attribute_key = 'videopamyat';
                UPDATE category_filter_attributes cfa SET attribute_id = (SELECT id FROM specification_attributes WHERE key = 'gpu') WHERE cfa.attribute_key = 'graficheskiy_protsessor';
                UPDATE category_filter_attributes cfa SET attribute_id = (SELECT id FROM specification_attributes WHERE key = 'data_vykhoda_na_rynok_2') WHERE cfa.attribute_key = 'data_vykhoda_na_rynok_2';
                UPDATE category_filter_attributes cfa SET attribute_id = (SELECT id FROM specification_attributes WHERE key = 'proizvoditel_graficheskogo_protsessora') WHERE cfa.attribute_key = 'proizvoditel_graficheskogo_protsessora';
                UPDATE category_filter_attributes cfa SET attribute_id = (SELECT id FROM specification_attributes WHERE key = 'shirina_shiny_pamyati') WHERE cfa.attribute_key = 'shirina_shiny_pamyati';
                UPDATE category_filter_attributes cfa SET attribute_id = (SELECT id FROM specification_attributes WHERE key = 'okhlazhdenie_1') WHERE cfa.attribute_key = 'okhlazhdenie_1';
                UPDATE category_filter_attributes cfa SET attribute_id = (SELECT id FROM specification_attributes WHERE key = 'razyemy_pitaniya') WHERE cfa.attribute_key = 'razyemy_pitaniya';
                UPDATE category_filter_attributes cfa SET attribute_id = (SELECT id FROM specification_attributes WHERE key = 'interface') WHERE cfa.attribute_key = 'interfeys_1';
                UPDATE category_filter_attributes cfa SET attribute_id = (SELECT id FROM specification_attributes WHERE key = 'rekomenduemyy_blok_pitaniya') WHERE cfa.attribute_key = 'rekomenduemyy_blok_pitaniya';
                UPDATE category_filter_attributes cfa SET attribute_id = (SELECT id FROM specification_attributes WHERE key = 'dlina_videokarty') WHERE cfa.attribute_key = 'dlina_videokarty';
                UPDATE category_filter_attributes cfa SET attribute_id = (SELECT id FROM specification_attributes WHERE key = 'vysota_videokarty') WHERE cfa.attribute_key = 'vysota_videokarty';
                UPDATE category_filter_attributes cfa SET attribute_id = (SELECT id FROM specification_attributes WHERE key = 'vram') WHERE cfa.attribute_key = 'tip_videopamyati';
                UPDATE category_filter_attributes cfa SET attribute_id = sa.id
                FROM specification_attributes sa
                WHERE cfa.attribute_id = '00000000-0000-0000-0000-000000000000'::uuid
                  AND sa.key = cfa.attribute_key;
            

ALTER TABLE category_filter_attributes ADD CONSTRAINT "FK_category_filter_attributes_specification_attributes_attribu~" FOREIGN KEY (attribute_id) REFERENCES specification_attributes (id) ON DELETE RESTRICT;


                -- Select-атрибуты (single): точное совпадение + маппинг integrated_graphics, modular
                INSERT INTO product_specification_values (id, product_id, attribute_id, canonical_value_id, value_number)
                SELECT gen_random_uuid(), p.id, sa.id, COALESCE(
                    (SELECT id FROM specification_canonical_values WHERE attribute_id = sa.id AND value_text = trim(j.val) LIMIT 1),
                    (SELECT id FROM specification_canonical_values WHERE attribute_id = sa.id AND lower(trim(j.val)) IN ('true','1') AND value_text = 'Есть' LIMIT 1),
                    (SELECT id FROM specification_canonical_values WHERE attribute_id = sa.id AND lower(trim(j.val)) IN ('false','0') AND value_text = 'Нет' LIMIT 1),
                    (SELECT id FROM specification_canonical_values WHERE attribute_id = sa.id AND lower(trim(j.val)) = 'full' AND value_text IN ('Full','Полностью модульный') LIMIT 1),
                    (SELECT id FROM specification_canonical_values WHERE attribute_id = sa.id AND lower(trim(j.val)) = 'semi' AND value_text IN ('Semi','Полумодульный') LIMIT 1)
                ), NULL
                FROM products p
                CROSS JOIN LATERAL jsonb_each_text(p.specifications) AS j(key, val)
                JOIN specification_attributes sa ON sa.key = j.key AND sa.value_type = 0 AND sa.is_multi_value = false
                WHERE COALESCE(
                    (SELECT id FROM specification_canonical_values WHERE attribute_id = sa.id AND value_text = trim(j.val) LIMIT 1),
                    (SELECT id FROM specification_canonical_values WHERE attribute_id = sa.id AND lower(trim(j.val)) IN ('true','1') AND value_text = 'Есть' LIMIT 1),
                    (SELECT id FROM specification_canonical_values WHERE attribute_id = sa.id AND lower(trim(j.val)) IN ('false','0') AND value_text = 'Нет' LIMIT 1),
                    (SELECT id FROM specification_canonical_values WHERE attribute_id = sa.id AND lower(trim(j.val)) = 'full' AND value_text IN ('Full','Полностью модульный') LIMIT 1),
                    (SELECT id FROM specification_canonical_values WHERE attribute_id = sa.id AND lower(trim(j.val)) = 'semi' AND value_text IN ('Semi','Полумодульный') LIMIT 1)
                ) IS NOT NULL;

                -- Range-атрибуты: извлекаем число
                INSERT INTO product_specification_values (id, product_id, attribute_id, canonical_value_id, value_number)
                SELECT gen_random_uuid(), p.id, sa.id, NULL,
                    (NULLIF(trim(regexp_replace(j.val::text, '[^0-9.]', '', 'g')), ''))::numeric
                FROM products p
                CROSS JOIN LATERAL jsonb_each_text(p.specifications) AS j(key, val)
                JOIN specification_attributes sa ON sa.key = j.key AND sa.value_type = 1
                WHERE trim(regexp_replace(j.val::text, '[^0-9.]', '', 'g')) ~ '^[0-9]+\.?[0-9]*$';

                -- Multi-value select: разбиваем по запятой
                INSERT INTO product_specification_values (id, product_id, attribute_id, canonical_value_id, value_number)
                SELECT gen_random_uuid(), p.id, sa.id, scv.id, NULL
                FROM products p
                CROSS JOIN LATERAL jsonb_each_text(p.specifications) AS j(key, val)
                JOIN specification_attributes sa ON sa.key = j.key AND sa.value_type = 0 AND sa.is_multi_value = true
                CROSS JOIN LATERAL regexp_split_to_table(trim(j.val::text), ',\s*') AS part(val)
                JOIN specification_canonical_values scv ON scv.attribute_id = sa.id AND scv.value_text = trim(part.val)
                WHERE trim(part.val) != '';
            

ALTER TABLE products DROP COLUMN specifications;

INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('20260324075317_NormalizeSpecifications', '8.0.11');

COMMIT;

START TRANSACTION;

ALTER TABLE products ADD importer text;

ALTER TABLE products ADD manufacturer_address text;

ALTER TABLE products ADD production_address text;

ALTER TABLE products ADD service_support text;

UPDATE products SET importer = NULL, manufacturer_address = NULL, production_address = NULL, service_support = NULL
WHERE id = '20000000-0000-0000-0000-000000000001';

UPDATE products SET importer = NULL, manufacturer_address = NULL, production_address = NULL, service_support = NULL
WHERE id = '20000000-0000-0000-0000-000000000002';

UPDATE products SET importer = NULL, manufacturer_address = NULL, production_address = NULL, service_support = NULL
WHERE id = '20000000-0000-0000-0000-000000000003';

UPDATE products SET importer = NULL, manufacturer_address = NULL, production_address = NULL, service_support = NULL
WHERE id = '20000000-0000-0000-0000-000000000004';

UPDATE products SET importer = NULL, manufacturer_address = NULL, production_address = NULL, service_support = NULL
WHERE id = '20000000-0000-0000-0000-000000000005';

UPDATE products SET importer = NULL, manufacturer_address = NULL, production_address = NULL, service_support = NULL
WHERE id = '20000000-0000-0000-0000-000000000006';

UPDATE products SET importer = NULL, manufacturer_address = NULL, production_address = NULL, service_support = NULL
WHERE id = '20000000-0000-0000-0000-000000000007';

UPDATE products SET importer = NULL, manufacturer_address = NULL, production_address = NULL, service_support = NULL
WHERE id = '20000000-0000-0000-0000-000000000008';

UPDATE products SET importer = NULL, manufacturer_address = NULL, production_address = NULL, service_support = NULL
WHERE id = '20000000-0000-0000-0000-000000000009';

UPDATE products SET importer = NULL, manufacturer_address = NULL, production_address = NULL, service_support = NULL
WHERE id = '20000000-0000-0000-0000-000000000010';

UPDATE products SET importer = NULL, manufacturer_address = NULL, production_address = NULL, service_support = NULL
WHERE id = '20000000-0000-0000-0000-000000000011';

UPDATE products SET importer = NULL, manufacturer_address = NULL, production_address = NULL, service_support = NULL
WHERE id = '20000000-0000-0000-0000-000000000012';

CREATE INDEX "IX_products_is_active_price" ON products (is_active, price);

INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('20260325102830_AddProductLegalInfoFields', '8.0.11');

COMMIT;

START TRANSACTION;

ALTER TABLE products ADD slug character varying(220);

UPDATE products
SET slug = CASE
    WHEN NULLIF(TRIM(REGEXP_REPLACE(LOWER(sku), '[^a-z0-9]+', '_', 'g')), '') IS NULL
        THEN 'product_' || REPLACE(id::text, '-', '')
    ELSE TRIM(BOTH '_' FROM REGEXP_REPLACE(LOWER(sku), '[^a-z0-9]+', '_', 'g'))
END
WHERE slug IS NULL;

WITH ranked AS (
    SELECT
        id,
        slug,
        ROW_NUMBER() OVER (PARTITION BY slug ORDER BY id) AS rn
    FROM products
)
UPDATE products p
SET slug = CASE
    WHEN r.rn = 1 THEN p.slug
    ELSE LEFT(p.slug, 210) || '_' || r.rn::text
END
FROM ranked r
WHERE p.id = r.id;

ALTER TABLE products ALTER COLUMN slug SET NOT NULL;

WITH ordered AS (
    SELECT id, ROW_NUMBER() OVER (ORDER BY RANDOM()) AS rn
    FROM products
)
UPDATE products p
SET sku = (1000000000 + o.rn)::text
FROM ordered o
WHERE p.id = o.id;

CREATE UNIQUE INDEX "IX_products_slug" ON products (slug);

INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('20260326174608_AddProductSlugAndNumericSku', '8.0.11');

COMMIT;

