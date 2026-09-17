-- ========================================================
-- SISTECH HITECH - CREACIÓN DE TABLAS DE OUTSOURCING EN SUPABASE
-- Ejecutar en: Supabase Dashboard -> SQL Editor -> New Query -> Run
-- Proyecto: https://supabase.com/dashboard/project/qoucwxpgkgafhsgzligt/editor
-- ========================================================

-- 1. TABLA DE SUCURSALES Y AGENCIAS (OUTSOURCING_AGENCIES)
CREATE TABLE IF NOT EXISTS public.outsourcing_agencies (
    id VARCHAR(50) PRIMARY KEY,
    clientid TEXT NOT NULL,
    clientname TEXT NOT NULL,
    clientcode TEXT NOT NULL,
    agencyname TEXT NOT NULL,
    city TEXT NOT NULL,
    address TEXT NOT NULL,
    lat NUMERIC(10, 6) NOT NULL DEFAULT -21.5332,
    lng NUMERIC(10, 6) NOT NULL DEFAULT -64.7339,
    contactperson TEXT DEFAULT '',
    contactphone TEXT DEFAULT '',
    contactemail TEXT DEFAULT '',
    status TEXT DEFAULT 'optimo',
    lastreplenished TEXT DEFAULT '',
    printers JSONB DEFAULT '[]'::jsonb,
    toners JSONB DEFAULT '[]'::jsonb,
    deliveryhistory JSONB DEFAULT '[]'::jsonb,
    changehistory JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TABLA DE CLIENTES CORPORATIVOS (OUTSOURCING_CLIENTS)
CREATE TABLE IF NOT EXISTS public.outsourcing_clients (
    id VARCHAR(50) PRIMARY KEY,
    name TEXT NOT NULL,
    code TEXT NOT NULL,
    contactperson TEXT DEFAULT '',
    contactphone TEXT DEFAULT '',
    contactemail TEXT DEFAULT '',
    contractsla TEXT DEFAULT 'SLA Estándar 24/7',
    city TEXT DEFAULT 'Tarija',
    address TEXT DEFAULT '',
    notes TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. HABILITAR ROW LEVEL SECURITY (RLS)
ALTER TABLE public.outsourcing_agencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outsourcing_clients ENABLE ROW LEVEL SECURITY;

-- 4. POLÍTICAS DE ACCESO COMPLETO (ANON KEY / READ, WRITE, UPDATE, DELETE)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'outsourcing_agencies' AND policyname = 'Public full access outsourcing_agencies'
    ) THEN
        CREATE POLICY "Public full access outsourcing_agencies" 
        ON public.outsourcing_agencies FOR ALL 
        USING (true) WITH CHECK (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'outsourcing_clients' AND policyname = 'Public full access outsourcing_clients'
    ) THEN
        CREATE POLICY "Public full access outsourcing_clients" 
        ON public.outsourcing_clients FOR ALL 
        USING (true) WITH CHECK (true);
    END IF;
END $$;

-- 5. HABILITAR REALTIME PARA SINCRONIZACIÓN EN VIVO
DO $$
BEGIN
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.outsourcing_agencies;
    EXCEPTION WHEN duplicate_object THEN
        NULL;
    END;

    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.outsourcing_clients;
    EXCEPTION WHEN duplicate_object THEN
        NULL;
    END;
END $$;
