-- Create parties table
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

-- Enable Row Level Security
ALTER TABLE parties ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations for authenticated users (or anon for testing)
DROP POLICY IF EXISTS "Allow all operations for anon" ON parties;
CREATE POLICY "Allow all operations for anon" ON parties FOR ALL USING (true);


-- Create working_categories table
CREATE TABLE IF NOT EXISTS working_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE working_categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all operations for anon on working_categories" ON working_categories;
CREATE POLICY "Allow all operations for anon on working_categories" ON working_categories FOR ALL USING (true);


-- Create planned_workings table
CREATE TABLE IF NOT EXISTS planned_workings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID REFERENCES working_categories(id),
  project_name TEXT,
  date DATE NOT NULL,
  party_id UUID REFERENCES parties(id),
  parts JSONB NOT NULL, -- Array of { name, qty, price, gst }
  total_amount NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE planned_workings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all operations for anon on planned_workings" ON planned_workings;
CREATE POLICY "Allow all operations for anon on planned_workings" ON planned_workings FOR ALL USING (true);
