
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ERPFlow Database Schema


-- =========================
-- USERS
-- =========================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role VARCHAR(20) NOT NULL
        CHECK (role IN ('ADMIN', 'SALES_USER')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- =========================
-- CUSTOMERS
-- =========================
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name VARCHAR(150) NOT NULL,
    contact_person VARCHAR(100) NOT NULL,
    mobile VARCHAR(20) NOT NULL,
    email VARCHAR(150),
    city VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- =========================
-- PRODUCTS
-- =========================
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_code VARCHAR(50) NOT NULL UNIQUE,
    product_name VARCHAR(150) NOT NULL,
    category VARCHAR(100) NOT NULL,
    unit VARCHAR(30) NOT NULL,
    base_price NUMERIC(12,2) NOT NULL
        CHECK (base_price >= 0),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- =========================
-- INVENTORY
-- =========================
CREATE TABLE inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL UNIQUE,
    physical_quantity INTEGER NOT NULL DEFAULT 0
        CHECK (physical_quantity >= 0),
    reserved_quantity INTEGER NOT NULL DEFAULT 0
        CHECK (reserved_quantity >= 0),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_inventory_product
        FOREIGN KEY (product_id)
        REFERENCES products(id)
        ON DELETE CASCADE,

    CONSTRAINT inventory_reservation_valid
        CHECK (reserved_quantity <= physical_quantity)
);


-- =========================
-- ENQUIRIES
-- =========================
CREATE TABLE enquiries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    enquiry_number VARCHAR(50) NOT NULL UNIQUE,
    customer_id UUID NOT NULL,
    enquiry_date DATE NOT NULL DEFAULT CURRENT_DATE,
    required_date DATE,
    notes TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'NEW'
        CHECK (status IN ('NEW', 'QUOTED', 'WON', 'LOST')),
    created_by UUID NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_enquiry_customer
        FOREIGN KEY (customer_id)
        REFERENCES customers(id),

    CONSTRAINT fk_enquiry_created_by
        FOREIGN KEY (created_by)
        REFERENCES users(id),

    CONSTRAINT enquiry_dates_valid
        CHECK (required_date IS NULL OR required_date >= enquiry_date)
);


-- =========================
-- ENQUIRY ITEMS
-- =========================
CREATE TABLE enquiry_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    enquiry_id UUID NOT NULL,
    product_id UUID NOT NULL,
    quantity INTEGER NOT NULL
        CHECK (quantity > 0),

    CONSTRAINT fk_enquiry_item_enquiry
        FOREIGN KEY (enquiry_id)
        REFERENCES enquiries(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_enquiry_item_product
        FOREIGN KEY (product_id)
        REFERENCES products(id),

    CONSTRAINT unique_enquiry_product
        UNIQUE (enquiry_id, product_id)
);


-- =========================
-- QUOTATIONS
-- =========================
CREATE TABLE quotations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quotation_number VARCHAR(50) NOT NULL UNIQUE,
    enquiry_id UUID NOT NULL UNIQUE,
    customer_id UUID NOT NULL,
    valid_until DATE NOT NULL,
    grand_total NUMERIC(14,2) NOT NULL DEFAULT 0
        CHECK (grand_total >= 0),
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT'
        CHECK (status IN ('DRAFT', 'SENT', 'ACCEPTED', 'REJECTED')),
    created_by UUID NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_quotation_enquiry
        FOREIGN KEY (enquiry_id)
        REFERENCES enquiries(id),

    CONSTRAINT fk_quotation_customer
        FOREIGN KEY (customer_id)
        REFERENCES customers(id),

    CONSTRAINT fk_quotation_created_by
        FOREIGN KEY (created_by)
        REFERENCES users(id)
);


-- =========================
-- QUOTATION ITEMS
-- =========================
CREATE TABLE quotation_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quotation_id UUID NOT NULL,
    product_id UUID NOT NULL,
    quantity INTEGER NOT NULL
        CHECK (quantity > 0),
    unit_price NUMERIC(12,2) NOT NULL
        CHECK (unit_price >= 0),
    discount_percent NUMERIC(5,2) NOT NULL DEFAULT 0
        CHECK (discount_percent >= 0 AND discount_percent <= 100),
    gst_percent NUMERIC(5,2) NOT NULL DEFAULT 0
        CHECK (gst_percent >= 0 AND gst_percent <= 100),
    line_amount NUMERIC(14,2) NOT NULL DEFAULT 0
        CHECK (line_amount >= 0),

    CONSTRAINT fk_quotation_item_quotation
        FOREIGN KEY (quotation_id)
        REFERENCES quotations(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_quotation_item_product
        FOREIGN KEY (product_id)
        REFERENCES products(id),

    CONSTRAINT unique_quotation_product
        UNIQUE (quotation_id, product_id)
);


-- =========================
-- SALES ORDERS
-- =========================
CREATE TABLE sales_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number VARCHAR(50) NOT NULL UNIQUE,
    quotation_id UUID NOT NULL UNIQUE,
    customer_id UUID NOT NULL,
    order_date DATE NOT NULL DEFAULT CURRENT_DATE,
    total_amount NUMERIC(14,2) NOT NULL
        CHECK (total_amount >= 0),
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING'
        CHECK (status IN (
            'PENDING',
            'CONFIRMED',
            'DISPATCHED',
            'CANCELLED'
        )),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_sales_order_quotation
        FOREIGN KEY (quotation_id)
        REFERENCES quotations(id),

    CONSTRAINT fk_sales_order_customer
        FOREIGN KEY (customer_id)
        REFERENCES customers(id)
);


-- =========================
-- SALES ORDER ITEMS
-- =========================
CREATE TABLE sales_order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sales_order_id UUID NOT NULL,
    product_id UUID NOT NULL,
    quantity INTEGER NOT NULL
        CHECK (quantity > 0),
    unit_price NUMERIC(12,2) NOT NULL
        CHECK (unit_price >= 0),

    CONSTRAINT fk_sales_order_item_order
        FOREIGN KEY (sales_order_id)
        REFERENCES sales_orders(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_sales_order_item_product
        FOREIGN KEY (product_id)
        REFERENCES products(id),

    CONSTRAINT unique_sales_order_product
        UNIQUE (sales_order_id, product_id)
);


-- =========================
-- DISPATCHES
-- =========================
CREATE TABLE dispatches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dispatch_number VARCHAR(50) NOT NULL UNIQUE,
    sales_order_id UUID NOT NULL UNIQUE,
    dispatch_date DATE NOT NULL DEFAULT CURRENT_DATE,
    vehicle_number VARCHAR(50) NOT NULL,
    driver_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_dispatch_sales_order
        FOREIGN KEY (sales_order_id)
        REFERENCES sales_orders(id)
);


-- =========================
-- DISPATCH ITEMS
-- =========================
CREATE TABLE dispatch_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dispatch_id UUID NOT NULL,
    product_id UUID NOT NULL,
    quantity INTEGER NOT NULL
        CHECK (quantity > 0),

    CONSTRAINT fk_dispatch_item_dispatch
        FOREIGN KEY (dispatch_id)
        REFERENCES dispatches(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_dispatch_item_product
        FOREIGN KEY (product_id)
        REFERENCES products(id),

    CONSTRAINT unique_dispatch_product
        UNIQUE (dispatch_id, product_id)
);


-- =========================
-- INDEXES
-- =========================

CREATE INDEX idx_enquiries_customer
    ON enquiries(customer_id);

CREATE INDEX idx_enquiry_items_enquiry
    ON enquiry_items(enquiry_id);

CREATE INDEX idx_quotations_customer
    ON quotations(customer_id);

CREATE INDEX idx_quotation_items_quotation
    ON quotation_items(quotation_id);

CREATE INDEX idx_sales_orders_customer
    ON sales_orders(customer_id);

CREATE INDEX idx_sales_order_items_order
    ON sales_order_items(sales_order_id);

CREATE INDEX idx_dispatch_items_dispatch
    ON dispatch_items(dispatch_id);