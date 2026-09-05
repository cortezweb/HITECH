-- ==========================================================
-- SISTECH HITECH POS - SUPABASE DATABASE INITIALIZATION SCHEMA
-- ==========================================================

-- 1. PRODUCTOS (Inventario)
CREATE TABLE IF NOT EXISTS products (
    id VARCHAR(50) PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    subCategory TEXT,
    stock INTEGER DEFAULT 0,
    price NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    cost NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    status TEXT DEFAULT 'In Stock',
    "desc" TEXT,
    image TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TICKETS (Órdenes de Servicio Técnico)
CREATE TABLE IF NOT EXISTS tickets (
    id VARCHAR(50) PRIMARY KEY,
    address TEXT NOT NULL,
    city TEXT,
    systemType TEXT,
    status TEXT DEFAULT 'Pending',
    price NUMERIC(10,2) DEFAULT 0.00,
    advancePayment NUMERIC(10,2) DEFAULT 0.00,
    advancePaid BOOLEAN DEFAULT FALSE,
    balancePaid BOOLEAN DEFAULT FALSE,
    fullyPaid BOOLEAN DEFAULT FALSE,
    date TEXT,
    techs INTEGER DEFAULT 1,
    "desc" TEXT,
    commonFaults JSONB DEFAULT '[]'::jsonb,
    image TEXT,
    timeline JSONB DEFAULT '[]'::jsonb,
    paymentHistory JSONB DEFAULT '[]'::jsonb,
    assignedTech JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. SALES (Ventas POS)
CREATE TABLE IF NOT EXISTS sales (
    id VARCHAR(50) PRIMARY KEY,
    date TEXT NOT NULL,
    timestamp BIGINT,
    items JSONB DEFAULT '[]'::jsonb,
    subtotal NUMERIC(10,2) DEFAULT 0.00,
    discount NUMERIC(10,2) DEFAULT 0.00,
    tax NUMERIC(10,2) DEFAULT 0.00,
    total NUMERIC(10,2) DEFAULT 0.00,
    paymentMethod TEXT DEFAULT 'cash',
    cashierName TEXT,
    cashierId TEXT,
    cashierRole TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. USERS (Personal y Roles)
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(50) PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'cajero',
    status TEXT DEFAULT 'active',
    avatar TEXT,
    date TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. CONFIG (Datos Comerciales y Permisos)
CREATE TABLE IF NOT EXISTS config (
    id VARCHAR(50) PRIMARY KEY,
    data JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. ATTENDANCE (Reloj Checador)
CREATE TABLE IF NOT EXISTS attendance (
    id VARCHAR(50) PRIMARY KEY,
    userId TEXT,
    userName TEXT,
    userRole TEXT,
    type TEXT,
    date TEXT,
    time TEXT,
    timestamp BIGINT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. CIERRES_CAJA (Arqueos y Cierres Z)
CREATE TABLE IF NOT EXISTS cierres_caja (
    id VARCHAR(50) PRIMARY KEY,
    cajero TEXT,
    efectivoReal NUMERIC(10,2) DEFAULT 0.00,
    efectivoEsperado NUMERIC(10,2) DEFAULT 0.00,
    tarjetaEsperado NUMERIC(10,2) DEFAULT 0.00,
    qrEsperado NUMERIC(10,2) DEFAULT 0.00,
    diferencia NUMERIC(10,2) DEFAULT 0.00,
    conteoEfectivo JSONB DEFAULT '{}'::jsonb,
    fecha TEXT,
    timestamp BIGINT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. ACTIVITY_LOGS (Bitácora de Auditoría)
CREATE TABLE IF NOT EXISTS activity_logs (
    id VARCHAR(50) PRIMARY KEY,
    "user" TEXT,
    role TEXT,
    action TEXT,
    details TEXT,
    date TEXT,
    timestamp BIGINT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar Row Level Security (RLS)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE config ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE cierres_caja ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Políticas de acceso para clave pública anónima (anon key)
CREATE POLICY "Public full access products" ON products FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access tickets" ON tickets FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access sales" ON sales FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access users" ON users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access config" ON config FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access attendance" ON attendance FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access cierres_caja" ON cierres_caja FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access activity_logs" ON activity_logs FOR ALL USING (true) WITH CHECK (true);

-- Habilitar Realtime para suscripciones en vivo
ALTER PUBLICATION supabase_realtime ADD TABLE products;
ALTER PUBLICATION supabase_realtime ADD TABLE tickets;
ALTER PUBLICATION supabase_realtime ADD TABLE sales;
ALTER PUBLICATION supabase_realtime ADD TABLE users;
ALTER PUBLICATION supabase_realtime ADD TABLE config;
ALTER PUBLICATION supabase_realtime ADD TABLE attendance;
ALTER PUBLICATION supabase_realtime ADD TABLE cierres_caja;
ALTER PUBLICATION supabase_realtime ADD TABLE activity_logs;

-- Datos Semilla Iniciales: Usuarios
INSERT INTO users (id, email, password, name, role, status, avatar, date)
VALUES
    ('usr-1', 'admin@sistech.com', 'admin123', 'Alex Sterling', 'admin', 'active', 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&q=80', '24/06/2026'),
    ('usr-2', 'cajero@sistech.com', 'cajero123', 'Hamilton Cortez', 'cajero', 'active', 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=80&q=80', '24/06/2026'),
    ('usr-3', 'tecnico@sistech.com', 'tecnico123', 'Deanna Annis', 'tecnico', 'active', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=80&q=80', '24/06/2026')
ON CONFLICT (id) DO NOTHING;

-- Datos Semilla Iniciales: Configuración
INSERT INTO config (id, data)
VALUES
    ('shopInfo', '{"name": "HITECH POS", "ruc": "20748392018", "address": "Av. Aviación 1482, San Borja", "phone": "(01) 224-8594 / 942-597-869", "warranty": "Garantía de servicio: 30 días en mano de obra. No cubre daños físicos ni líquidos.", "weatherLocation": "Lima, PE"}'::jsonb),
    ('rolePermissions', '{"admin": ["dashboard", "service_registry", "pos", "inventory", "reports", "settings"], "cajero": ["dashboard", "pos"], "tecnico": ["dashboard", "service_registry"]}'::jsonb)
ON CONFLICT (id) DO NOTHING;
