-- =============================================
-- NEXUS EOD REPORT TRACKER - SUPABASE SCHEMA
-- =============================================
-- Run this entire script in Supabase SQL Editor
-- (Dashboard → SQL Editor → New Query → Paste → Run)
-- =============================================

-- 1. CLIENTS TABLE
-- Stores client organizations (multi-tenant)
CREATE TABLE IF NOT EXISTS clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. USER PROFILES TABLE
-- Links Supabase Auth users to clients
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    full_name TEXT,
    role TEXT DEFAULT 'viewer', -- 'admin' or 'viewer'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TEAM MEMBERS TABLE
-- Sales team members (setters & closers)
CREATE TABLE IF NOT EXISTS team_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('Setter', 'Closer')),
    email TEXT,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. SETTER REPORTS TABLE
-- Daily EOD reports from setters
CREATE TABLE IF NOT EXISTS setter_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    team_member_id UUID REFERENCES team_members(id) ON DELETE SET NULL,
    member_name TEXT NOT NULL, -- Denormalized for easy display
    report_date DATE NOT NULL,

    -- Activity Metrics
    dials INTEGER DEFAULT 0,
    leads_texted INTEGER DEFAULT 0,
    outbound_dms_sent INTEGER DEFAULT 0,
    pickups INTEGER DEFAULT 0,
    text_responses INTEGER DEFAULT 0,
    outbound_dm_responses INTEGER DEFAULT 0,
    inbound_dms INTEGER DEFAULT 0,
    conversations INTEGER DEFAULT 0,
    followups_sent INTEGER DEFAULT 0,

    -- Booking Metrics
    calls_booked_dials INTEGER DEFAULT 0,
    calls_booked_dms INTEGER DEFAULT 0,
    live_transfers INTEGER DEFAULT 0,

    -- Recovery Metrics
    noshows_reached INTEGER DEFAULT 0,
    noshows_rebooked INTEGER DEFAULT 0,
    old_applicants_called INTEGER DEFAULT 0,
    old_applicants_rebooked INTEGER DEFAULT 0,
    cancellations_called INTEGER DEFAULT 0,
    cancellations_rebooked INTEGER DEFAULT 0,

    -- Revenue
    cash_collected DECIMAL(12,2) DEFAULT 0,
    revenue_generated DECIMAL(12,2) DEFAULT 0,

    -- Qualitative
    key_wins TEXT,
    main_challenges TEXT,
    improvements TEXT,

    -- Metadata
    typeform_response_id TEXT UNIQUE, -- Prevents duplicate submissions
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. CLOSER REPORTS TABLE
-- Daily EOD reports from closers
CREATE TABLE IF NOT EXISTS closer_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    team_member_id UUID REFERENCES team_members(id) ON DELETE SET NULL,
    member_name TEXT NOT NULL, -- Denormalized for easy display
    report_date DATE NOT NULL,

    -- Call Metrics
    calls_on_calendar INTEGER DEFAULT 0,
    shows INTEGER DEFAULT 0,
    no_shows INTEGER DEFAULT 0,
    reschedules INTEGER DEFAULT 0,
    followups_booked INTEGER DEFAULT 0,

    -- Pipeline Metrics
    deals_dqd INTEGER DEFAULT 0,
    hot_prospects INTEGER DEFAULT 0, -- Ready in 7 days or less
    warm_prospects INTEGER DEFAULT 0, -- 8-30 days

    -- Qualitative Call Data
    primary_objections TEXT,
    call_types TEXT, -- "Most calls were..."

    -- Revenue
    deals_closed INTEGER DEFAULT 0,
    cash_collected DECIMAL(12,2) DEFAULT 0,
    revenue_generated DECIMAL(12,2) DEFAULT 0,

    -- Qualitative
    key_wins TEXT,
    main_challenges TEXT,
    improvements TEXT,

    -- Metadata
    typeform_response_id TEXT UNIQUE, -- Prevents duplicate submissions
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Ensures clients can only see their own data
-- =============================================

-- Enable RLS on all tables
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE setter_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE closer_reports ENABLE ROW LEVEL SECURITY;

-- User Profiles: Users can only see their own profile
CREATE POLICY "Users can view own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = id);

-- Clients: Users can only see their linked client
CREATE POLICY "Users can view their client" ON clients
    FOR SELECT USING (
        id IN (SELECT client_id FROM user_profiles WHERE id = auth.uid())
    );

-- Team Members: Users can only see team members from their client
CREATE POLICY "Users can view their team members" ON team_members
    FOR SELECT USING (
        client_id IN (SELECT client_id FROM user_profiles WHERE id = auth.uid())
    );

-- Setter Reports: Users can only see reports from their client
CREATE POLICY "Users can view their setter reports" ON setter_reports
    FOR SELECT USING (
        client_id IN (SELECT client_id FROM user_profiles WHERE id = auth.uid())
    );

-- Closer Reports: Users can only see reports from their client
CREATE POLICY "Users can view their closer reports" ON closer_reports
    FOR SELECT USING (
        client_id IN (SELECT client_id FROM user_profiles WHERE id = auth.uid())
    );

-- =============================================
-- SERVICE ROLE POLICIES (for Make.com webhooks)
-- These allow the service role to insert data
-- =============================================

-- Allow service role to insert into all tables
CREATE POLICY "Service role can insert clients" ON clients
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Service role can insert team members" ON team_members
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Service role can insert setter reports" ON setter_reports
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Service role can insert closer reports" ON closer_reports
    FOR INSERT WITH CHECK (true);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

CREATE INDEX IF NOT EXISTS idx_setter_reports_client_date
    ON setter_reports(client_id, report_date DESC);

CREATE INDEX IF NOT EXISTS idx_closer_reports_client_date
    ON closer_reports(client_id, report_date DESC);

CREATE INDEX IF NOT EXISTS idx_team_members_client
    ON team_members(client_id);

CREATE INDEX IF NOT EXISTS idx_user_profiles_client
    ON user_profiles(client_id);

-- =============================================
-- HELPER FUNCTION: Auto-create user profile
-- =============================================

-- This function runs when a new user signs up
-- You'll need to manually set the client_id after
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (id, full_name)
    VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- SAMPLE DATA (Optional - for testing)
-- Uncomment and run separately if you want test data
-- =============================================

/*
-- Create a test client
INSERT INTO clients (id, name) VALUES
    ('11111111-1111-1111-1111-111111111111', 'Test Client');

-- Create test team members
INSERT INTO team_members (client_id, name, role) VALUES
    ('11111111-1111-1111-1111-111111111111', 'John Setter', 'Setter'),
    ('11111111-1111-1111-1111-111111111111', 'Jane Closer', 'Closer');

-- Create a test setter report
INSERT INTO setter_reports (client_id, member_name, report_date, dials, pickups, calls_booked_dials, cash_collected) VALUES
    ('11111111-1111-1111-1111-111111111111', 'John Setter', CURRENT_DATE, 50, 15, 5, 1000.00);

-- Create a test closer report
INSERT INTO closer_reports (client_id, member_name, report_date, calls_on_calendar, shows, deals_closed, cash_collected) VALUES
    ('11111111-1111-1111-1111-111111111111', 'Jane Closer', CURRENT_DATE, 8, 6, 2, 5000.00);
*/

-- =============================================
-- DONE! Your database is ready.
-- =============================================
