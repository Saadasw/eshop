-- ============================================================================
-- E-SHOP — SEED DATA FOR DEVELOPMENT
-- ============================================================================
-- Run AFTER schema.sql
-- Creates: 2 users, 1 shop, categories, products with variants, test orders
-- ============================================================================

-- ============================================================================
-- 1. USERS
-- ============================================================================

-- Admin user
INSERT INTO "user" (user_id, full_name, email, phone, password_hash, primary_role, is_verified, is_active, email_verified_at, phone_verified_at)
VALUES (
    'a0000000-0000-0000-0000-000000000001',
    'Platform Admin',
    'admin@eshop.com',
    '01700000001',
    '$2b$12$LJ3m4ys6Zz0rVxQpYvHFqOQZQZQZQZQZQZQZQZQZQZQZQZQZQZQZQ',  -- bcrypt hash of "admin123"
    'admin',
    TRUE, TRUE, NOW(), NOW()
);

-- Shop owner: Rahim
INSERT INTO "user" (user_id, full_name, email, phone, password_hash, primary_role, is_verified, is_active, email_verified_at, phone_verified_at)
VALUES (
    'a0000000-0000-0000-0000-000000000002',
    'Rahim Khan',
    'rahim@example.com',
    '01711111111',
    '$2b$12$LJ3m4ys6Zz0rVxQpYvHFqOQZQZQZQZQZQZQZQZQZQZQZQZQZQZQZQ',
    'owner',
    TRUE, TRUE, NOW(), NOW()
);

-- Customer: Fatima
INSERT INTO "user" (user_id, full_name, email, phone, password_hash, primary_role, is_verified, is_active, email_verified_at, phone_verified_at)
VALUES (
    'a0000000-0000-0000-0000-000000000003',
    'Fatima Begum',
    'fatima@example.com',
    '01722222222',
    '$2b$12$LJ3m4ys6Zz0rVxQpYvHFqOQZQZQZQZQZQZQZQZQZQZQZQZQZQZQZQ',
    'customer',
    TRUE, TRUE, NOW(), NOW()
);

-- Delivery boy: Karim
INSERT INTO "user" (user_id, full_name, email, phone, password_hash, primary_role, is_verified, is_active)
VALUES (
    'a0000000-0000-0000-0000-000000000004',
    'Karim Mia',
    'karim@example.com',
    '01733333333',
    '$2b$12$LJ3m4ys6Zz0rVxQpYvHFqOQZQZQZQZQZQZQZQZQZQZQZQZQZQZQZQ',
    'staff',
    TRUE, TRUE
);


-- ============================================================================
-- 2. SHOP + CONFIG
-- ============================================================================

INSERT INTO shop (shop_id, owner_id, slug, shop_name, description, contact_phone, status, reviewed_by, reviewed_at)
VALUES (
    'b0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000002',
    'rahim-grocery',
    'Rahim Grocery & General Store',
    'Fresh groceries, daily essentials, and household items. Serving Khilgaon since 2015.',
    '01711111111',
    'active',
    'a0000000-0000-0000-0000-000000000001',
    NOW()
);

INSERT INTO shop_config (shop_id, theme_color, currency, order_prefix, tax_percentage, tax_inclusive, return_policy_days, accepting_orders, delivery_enabled, delivery_charge_type, min_order_amount, auto_accept_orders, business_hours)
VALUES (
    'b0000000-0000-0000-0000-000000000001',
    '#2563eb',
    'BDT',
    'RAH',
    0,
    FALSE,
    3,
    TRUE,
    TRUE,
    'zone',
    100.00,
    FALSE,
    '{"sat":{"open":"08:00","close":"22:00"},"sun":{"open":"08:00","close":"22:00"},"mon":{"open":"08:00","close":"22:00"},"tue":{"open":"08:00","close":"22:00"},"wed":{"open":"08:00","close":"22:00"},"thu":{"open":"08:00","close":"23:00"},"fri":null}'
);

-- Shop address
INSERT INTO shop_address (shop_id, address_type, street_address, area, city, postal_code, latitude, longitude, contact_phone, is_primary)
VALUES (
    'b0000000-0000-0000-0000-000000000001',
    'main',
    '123 Taltola Road, Near Khilgaon Flyover',
    'Khilgaon',
    'Dhaka',
    '1219',
    23.7461,
    90.4305,
    '01711111111',
    TRUE
);


-- ============================================================================
-- 3. DELIVERY ZONES
-- ============================================================================

INSERT INTO delivery_zone (shop_id, zone_name, areas, delivery_fee, estimated_time_minutes, sort_order, is_active) VALUES
('b0000000-0000-0000-0000-000000000001', 'Khilgaon Local', '["Khilgaon", "Taltola", "Tilpapara", "Nandipara"]', 30.00, 20, 1, TRUE),
('b0000000-0000-0000-0000-000000000001', 'Nearby Areas', '["Bashabo", "Mugdha", "Kamalapur", "Malibagh"]', 50.00, 40, 2, TRUE),
('b0000000-0000-0000-0000-000000000001', 'Extended Dhaka', '["Motijheel", "Paltan", "Gulshan", "Banani", "Dhanmondi"]', 100.00, 90, 3, TRUE);


-- ============================================================================
-- 4. PAYMENT METHODS
-- ============================================================================

INSERT INTO shop_payment_method (shop_id, method, is_enabled, display_account, sort_order) VALUES
('b0000000-0000-0000-0000-000000000001', 'bkash', TRUE, '017XXXX1111', 1),
('b0000000-0000-0000-0000-000000000001', 'nagad', TRUE, '017XXXX1111', 2),
('b0000000-0000-0000-0000-000000000001', 'cod', TRUE, NULL, 3);


-- ============================================================================
-- 5. STAFF
-- ============================================================================

INSERT INTO shop_staff (shop_id, user_id, role, permissions, is_active)
VALUES (
    'b0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000004',
    'delivery_boy',
    '{"can_manage_products":false,"can_process_orders":false,"can_view_analytics":false,"can_manage_coupons":false,"can_handle_refunds":false,"can_manage_staff":false}',
    TRUE
);


-- ============================================================================
-- 6. CATEGORIES
-- ============================================================================

INSERT INTO category (category_id, shop_id, name, slug, sort_order, is_active) VALUES
('c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'Rice & Dal', 'rice-dal', 1, TRUE),
('c0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001', 'Cooking Oil', 'cooking-oil', 2, TRUE),
('c0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000001', 'Spices', 'spices', 3, TRUE),
('c0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000001', 'Dairy & Eggs', 'dairy-eggs', 4, TRUE),
('c0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000001', 'Snacks & Drinks', 'snacks-drinks', 5, TRUE);

-- Subcategories under Rice & Dal
INSERT INTO category (category_id, shop_id, parent_id, name, slug, sort_order, is_active) VALUES
('c0000000-0000-0000-0000-000000000011', 'b0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'Basmati Rice', 'basmati-rice', 1, TRUE),
('c0000000-0000-0000-0000-000000000012', 'b0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'Local Rice', 'local-rice', 2, TRUE),
('c0000000-0000-0000-0000-000000000013', 'b0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'Dal', 'dal', 3, TRUE);


-- ============================================================================
-- 7. PRODUCT ATTRIBUTES
-- ============================================================================

INSERT INTO product_attribute (attribute_id, shop_id, name, sort_order) VALUES
('d0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'Weight', 1),
('d0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001', 'Size', 2);

INSERT INTO attribute_option (option_id, attribute_id, value, sort_order) VALUES
('e0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', '1 kg', 1),
('e0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000001', '5 kg', 2),
('e0000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000001', '25 kg', 3),
('e0000000-0000-0000-0000-000000000004', 'd0000000-0000-0000-0000-000000000002', '250 ml', 1),
('e0000000-0000-0000-0000-000000000005', 'd0000000-0000-0000-0000-000000000002', '1 L', 2),
('e0000000-0000-0000-0000-000000000006', 'd0000000-0000-0000-0000-000000000002', '5 L', 3);


-- ============================================================================
-- 8. PRODUCTS + VARIANTS (triggers will auto-set min_price/max_price)
-- ============================================================================

-- Product 1: Chinigura Rice (with weight variants)
INSERT INTO product (product_id, shop_id, category_id, sku, name, description, base_price, product_type, brand, is_active, is_featured)
VALUES (
    'f0000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000001',
    'c0000000-0000-0000-0000-000000000012',
    'RICE-CHINIGURA',
    'Chinigura Premium Aromatic Rice',
    'Premium quality Chinigura rice from Dinajpur. Known for its unique aroma and taste. Perfect for polao and special occasions.',
    250.00,
    'physical',
    'Pran',
    TRUE, TRUE
);

INSERT INTO product_variant (variant_id, product_id, sku, variant_name, price, stock_quantity, is_default, weight_grams) VALUES
('f1000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000001', 'RICE-CHINIGURA-1KG', '1 kg Pack', 250.00, 200, TRUE, 1000),
('f1000000-0000-0000-0000-000000000002', 'f0000000-0000-0000-0000-000000000001', 'RICE-CHINIGURA-5KG', '5 kg Pack', 1100.00, 80, FALSE, 5000),
('f1000000-0000-0000-0000-000000000003', 'f0000000-0000-0000-0000-000000000001', 'RICE-CHINIGURA-25KG', '25 kg Sack', 5000.00, 30, FALSE, 25000);

-- Link variants to attribute options
INSERT INTO variant_attribute_option (variant_id, option_id, attribute_id) VALUES
('f1000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001'),
('f1000000-0000-0000-0000-000000000002', 'e0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000001'),
('f1000000-0000-0000-0000-000000000003', 'e0000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000001');


-- Product 2: Soybean Oil (simple product — 1 default variant)
INSERT INTO product (product_id, shop_id, category_id, sku, name, description, base_price, product_type, brand, is_active)
VALUES (
    'f0000000-0000-0000-0000-000000000002',
    'b0000000-0000-0000-0000-000000000001',
    'c0000000-0000-0000-0000-000000000002',
    'OIL-SOYBEAN-1L',
    'Teer Soybean Oil 1L',
    'Pure soybean oil for everyday cooking.',
    185.00,
    'physical',
    'Teer',
    TRUE
);

INSERT INTO product_variant (variant_id, product_id, sku, variant_name, price, stock_quantity, is_default)
VALUES (
    'f1000000-0000-0000-0000-000000000004',
    'f0000000-0000-0000-0000-000000000002',
    'OIL-SOYBEAN-1L',
    NULL,
    185.00,
    150,
    TRUE
);


-- Product 3: Radhuni Turmeric Powder
INSERT INTO product (product_id, shop_id, category_id, sku, name, description, base_price, product_type, brand, is_active)
VALUES (
    'f0000000-0000-0000-0000-000000000003',
    'b0000000-0000-0000-0000-000000000001',
    'c0000000-0000-0000-0000-000000000003',
    'SPICE-TURMERIC',
    'Radhuni Turmeric Powder 200g',
    'Pure turmeric powder, no additives.',
    55.00,
    'physical',
    'Radhuni',
    TRUE
);

INSERT INTO product_variant (variant_id, product_id, sku, variant_name, price, stock_quantity, is_default)
VALUES (
    'f1000000-0000-0000-0000-000000000005',
    'f0000000-0000-0000-0000-000000000003',
    'SPICE-TURMERIC-200G',
    NULL,
    55.00,
    300,
    TRUE
);


-- Product 4: Fresh Eggs
INSERT INTO product (product_id, shop_id, category_id, sku, name, description, base_price, product_type, is_active)
VALUES (
    'f0000000-0000-0000-0000-000000000004',
    'b0000000-0000-0000-0000-000000000001',
    'c0000000-0000-0000-0000-000000000004',
    'EGGS-DESI-12',
    'Desi Eggs (12 pcs)',
    'Farm fresh desi eggs, collected daily.',
    180.00,
    'physical',
    TRUE
);

INSERT INTO product_variant (variant_id, product_id, sku, variant_name, price, stock_quantity, is_default)
VALUES (
    'f1000000-0000-0000-0000-000000000006',
    'f0000000-0000-0000-0000-000000000004',
    'EGGS-DESI-12',
    NULL,
    180.00,
    50,
    TRUE
);


-- ============================================================================
-- 9. PRODUCT TAGS
-- ============================================================================

INSERT INTO product_tag (product_id, tag_name) VALUES
('f0000000-0000-0000-0000-000000000001', 'premium'),
('f0000000-0000-0000-0000-000000000001', 'aromatic'),
('f0000000-0000-0000-0000-000000000001', 'chinigura'),
('f0000000-0000-0000-0000-000000000002', 'cooking'),
('f0000000-0000-0000-0000-000000000002', 'oil'),
('f0000000-0000-0000-0000-000000000003', 'spice'),
('f0000000-0000-0000-0000-000000000004', 'fresh'),
('f0000000-0000-0000-0000-000000000004', 'protein');


-- ============================================================================
-- 10. CUSTOMER ADDRESS
-- ============================================================================

INSERT INTO customer_address (user_id, label, recipient_name, phone, street_address, area, city, postal_code, is_default)
VALUES (
    'a0000000-0000-0000-0000-000000000003',
    'Home',
    'Fatima Begum',
    '01722222222',
    '456 Bashabo Lane, Near Bashabo Mosque',
    'Bashabo',
    'Dhaka',
    '1214',
    TRUE
);


-- ============================================================================
-- 11. COUPON
-- ============================================================================

INSERT INTO coupon (shop_id, created_by, code, discount_type, discount_value, min_order_amount, max_discount_amount, max_usage, max_usage_per_user, applies_to, is_active, valid_from, valid_until)
VALUES (
    'b0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000002',
    'WELCOME10',
    'percentage',
    10.00,
    200.00,
    100.00,
    100,
    1,
    'all',
    TRUE,
    NOW(),
    NOW() + INTERVAL '90 days'
);


-- ============================================================================
-- 12. SHOP FOLLOWER
-- ============================================================================

INSERT INTO shop_follower (shop_id, user_id) VALUES
('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000003');


-- ============================================================================
-- SEED COMPLETE ✅
-- ============================================================================
-- 
-- Users: 4 (admin, owner, customer, delivery boy)
-- Shop: 1 (Rahim Grocery)
-- Categories: 8 (5 root + 3 sub)
-- Products: 4 (1 with 3 variants, 3 simple)
-- Delivery Zones: 3
-- Payment Methods: 3 (bKash, Nagad, COD)
-- Coupon: 1 (WELCOME10)
-- Staff: 1 (delivery boy)
--
-- Login credentials for all users: password = "admin123" (bcrypt hash)
-- ============================================================================
