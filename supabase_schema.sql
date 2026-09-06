-- ==============================================================================
-- ARGUS MANUFACTURING ERP — COMPLETE CONSOLIDATED SUPABASE SCHEMA
-- Run this entire script in your Supabase SQL Editor.
-- Safe to re-run: uses CREATE TABLE IF NOT EXISTS and DROP POLICY IF EXISTS.
-- ==============================================================================

-- 1. PARTIES MASTER
CREATE TABLE IF NOT EXISTS parties (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  company_name TEXT NOT NULL,
  address TEXT,
  gst TEXT,
  contact_1 TEXT,
  contact_2 TEXT,
  email_id TEXT,
  contact_person TEXT,
  allocation TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. WORKING CATEGORIES & PLANNED WORKINGS
CREATE TABLE IF NOT EXISTS working_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS planned_workings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID REFERENCES working_categories(id),
  project_name TEXT,
  date DATE NOT NULL,
  party_id UUID REFERENCES parties(id),
  parts JSONB NOT NULL,
  total_amount NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. SALES ORDERS
CREATE TABLE IF NOT EXISTS sales_orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  party_name TEXT NOT NULL,
  date DATE NOT NULL,
  project_name_so TEXT,
  quantity INTEGER DEFAULT 0,
  rejection_qty INTEGER DEFAULT 0,
  status TEXT DEFAULT 'Open',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. INWARD ENTRIES
CREATE TABLE IF NOT EXISTS inward_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category TEXT NOT NULL,
  project_name TEXT,
  reference_no TEXT,
  date DATE NOT NULL,
  party_name TEXT NOT NULL,
  image_url TEXT,
  parts JSONB NOT NULL,
  total_amount NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. PROCESS ENTRIES & OPERATORS
CREATE TABLE IF NOT EXISTS operators (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS process_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  process_name TEXT NOT NULL,
  description TEXT,
  cost_per_hour NUMERIC DEFAULT 0,
  cost_per_component NUMERIC DEFAULT 0,
  total_cost NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. LOG ENTRIES
CREATE TABLE IF NOT EXISTS log_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  part_name TEXT NOT NULL,
  project_name TEXT NOT NULL,
  process_name TEXT NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  hours NUMERIC DEFAULT 0,
  quantity INTEGER DEFAULT 0,
  operator_name TEXT NOT NULL,
  remarks TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. FINISHED GOODS & INVENTORY
CREATE TABLE IF NOT EXISTS finished_goods (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category TEXT NOT NULL,
  date DATE NOT NULL,
  project_name TEXT NOT NULL,
  quantity INTEGER DEFAULT 0,
  parts JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS price_list (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_name TEXT NOT NULL,
  mrp NUMERIC,
  sale_price NUMERIC,
  min_selling_price NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS stock_details (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_name TEXT NOT NULL,
  finished_quantity INTEGER DEFAULT 0,
  send_quantity INTEGER DEFAULT 0,
  balance_stock INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS pending_parts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_name TEXT NOT NULL,
  part_name TEXT NOT NULL,
  pending_quantity INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS pending_projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_name TEXT NOT NULL,
  pending_quantity INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. QUOTATIONS
CREATE TABLE IF NOT EXISTS quotes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  party_name TEXT NOT NULL,
  date DATE NOT NULL,
  projects JSONB NOT NULL,
  total_amount NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 9. DELIVERY CHALLANS (DC ENTRY)
CREATE TABLE IF NOT EXISTS dc_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  dc_no TEXT NOT NULL,
  date DATE NOT NULL,
  party_name TEXT NOT NULL,
  party_address TEXT,
  party_gstin TEXT,
  party_code TEXT,
  eway_bill_no TEXT,
  po_number TEXT,
  place_of_supply TEXT,
  packaging_details TEXT,
  enquiry_no TEXT,
  vehicle_no TEXT,
  phone_no TEXT,
  category TEXT,
  process TEXT,
  parts JSONB NOT NULL,
  receiver_name TEXT,
  sender_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS dc_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS dc_processes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS dc_enquiry_numbers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  number TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS dc_parts_list (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  part_name TEXT NOT NULL,
  sum_quantity INTEGER DEFAULT 0,
  sent_by_dc INTEGER DEFAULT 0,
  balance_quantity INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 10. COSTING MODULES
CREATE TABLE IF NOT EXISTS process_costing (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_name TEXT NOT NULL,
  party_name TEXT NOT NULL,
  part_name TEXT NOT NULL,
  process_name TEXT NOT NULL,
  process_cost NUMERIC DEFAULT 0,
  duration NUMERIC DEFAULT 0,
  quantity INTEGER DEFAULT 0,
  total_cost NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS product_costing (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category TEXT NOT NULL,
  project_name TEXT NOT NULL,
  party_name TEXT NOT NULL,
  part_name TEXT NOT NULL,
  quantity INTEGER DEFAULT 0,
  total_cost NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 11. INVOICES & BILLING SYSTEM
CREATE TABLE IF NOT EXISTS invoices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  document_type TEXT NOT NULL,
  document_no TEXT NOT NULL,
  customer TEXT NOT NULL,
  dc_no TEXT,
  po_no TEXT,
  date DATE NOT NULL,
  cgst NUMERIC DEFAULT 0,
  sgst NUMERIC DEFAULT 0,
  igst NUMERIC DEFAULT 0,
  items JSONB NOT NULL,
  basic_value NUMERIC DEFAULT 0,
  total_amount NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS document_numbers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL,
  prefix TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

INSERT INTO document_numbers (type, value, prefix) VALUES 
('Sales Invoice', '35/26/27', 'S'),
('Proforma Invoice', '100', 'P'),
('Quotation', '36/25/26', 'Q'),
('Credit Note', '1/25/26', 'C'),
('Estimation', '2/25/26', 'E')
ON CONFLICT (type) DO NOTHING;

CREATE TABLE IF NOT EXISTS hsn_master (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  hsn_code TEXT NOT NULL UNIQUE,
  detail TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS dc_details_billing (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL,
  dc_number TEXT NOT NULL,
  date DATE NOT NULL,
  party_name TEXT NOT NULL,
  category TEXT NOT NULL,
  part_name TEXT NOT NULL,
  quantity INTEGER DEFAULT 0,
  invoice_no TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS sales_price_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_name TEXT NOT NULL,
  description TEXT NOT NULL,
  price NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 12. BANK ENTRY MODULE
CREATE TABLE IF NOT EXISTS bank_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  txn_date DATE,
  value_date DATE,
  cheque_no TEXT,
  description TEXT,
  branch_code TEXT,
  debit NUMERIC DEFAULT 0,
  credit NUMERIC DEFAULT 0,
  balance NUMERIC DEFAULT 0,
  bank_name TEXT,
  ledger_name TEXT,
  ledger_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS banks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS bank_types (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS bank_others (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  party_name TEXT NOT NULL,
  type TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS ledger_details (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 13. PETTY CASH MODULE
CREATE TABLE IF NOT EXISTS petty_cash (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  value_date DATE NOT NULL,
  description TEXT NOT NULL,
  debit NUMERIC DEFAULT 0,
  credit NUMERIC DEFAULT 0,
  bank_name TEXT NOT NULL,
  ledger_name TEXT NOT NULL,
  ledger_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 14. LEDGER DASHBOARD MODULE
CREATE TABLE IF NOT EXISTS ledger_dashboard (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  reference_no TEXT,
  particulars TEXT NOT NULL,
  narration TEXT,
  debit NUMERIC DEFAULT 0,
  credit NUMERIC DEFAULT 0,
  party_name TEXT NOT NULL,
  ledger_type TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- ENABLE ROW LEVEL SECURITY (RLS) & SET PERMISSIVE POLICIES FOR ALL TABLES
-- ==============================================================================

DO $$
DECLARE
  tbl text;
  tables text[] := ARRAY[
    'parties',
    'working_categories',
    'planned_workings',
    'sales_orders',
    'inward_entries',
    'operators',
    'process_entries',
    'log_entries',
    'finished_goods',
    'price_list',
    'stock_details',
    'pending_parts',
    'pending_projects',
    'quotes',
    'dc_entries',
    'dc_categories',
    'dc_processes',
    'dc_enquiry_numbers',
    'dc_parts_list',
    'process_costing',
    'product_costing',
    'invoices',
    'document_numbers',
    'hsn_master',
    'dc_details_billing',
    'sales_price_history',
    'bank_entries',
    'banks',
    'bank_types',
    'bank_others',
    'ledger_details',
    'petty_cash',
    'ledger_dashboard'
  ];
BEGIN
  FOREACH tbl IN ARRAY tables LOOP
    EXECUTE format('ALTER TABLE IF EXISTS %I ENABLE ROW LEVEL SECURITY;', tbl);
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I;', 'allow_all_ops_' || tbl, tbl);
    EXECUTE format('CREATE POLICY %I ON %I FOR ALL USING (true);', 'allow_all_ops_' || tbl, tbl);
  END LOOP;
END $$;
