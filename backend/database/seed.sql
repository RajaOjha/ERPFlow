-- =========================================
-- ERPFlow Seed Data
-- Products & Inventory
-- =========================================

-- =========================
-- PRODUCTS
-- =========================

INSERT INTO products
    (product_code, product_name, category, unit, base_price)
VALUES
    ('P001', 'Industrial Water Pump', 'Pumps', 'Piece', 25000.00),
    ('P002', 'Steel Control Valve', 'Valves', 'Piece', 8500.00),
    ('P003', 'Electric Motor', 'Motors', 'Piece', 18000.00),
    ('P004', 'Air Compressor', 'Compressors', 'Piece', 45000.00),
    ('P005', 'Industrial Bearing', 'Bearings', 'Piece', 3200.00),
    ('P006', 'Diesel Generator', 'Generators', 'Piece', 75000.00);


-- =========================
-- INVENTORY
-- =========================

INSERT INTO inventory
    (product_id, physical_quantity, reserved_quantity)
SELECT
    id,
    CASE product_code
        WHEN 'P001' THEN 100
        WHEN 'P002' THEN 150
        WHEN 'P003' THEN 80
        WHEN 'P004' THEN 50
        WHEN 'P005' THEN 300
        WHEN 'P006' THEN 30
    END,
    0
FROM products
WHERE product_code IN (
    'P001',
    'P002',
    'P003',
    'P004',
    'P005',
    'P006'
);