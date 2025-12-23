-- VSL Funnel Reports Table (for both Paid and Organic)
CREATE TABLE IF NOT EXISTS vsl_funnel_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  report_date DATE NOT NULL,
  funnel_type TEXT NOT NULL CHECK (funnel_type IN ('paid', 'organic')),

  -- Funnel Stages
  page_views INTEGER NOT NULL DEFAULT 0,
  applications INTEGER NOT NULL DEFAULT 0,
  qualified INTEGER NOT NULL DEFAULT 0,
  bookings INTEGER NOT NULL DEFAULT 0,
  shows INTEGER NOT NULL DEFAULT 0,
  no_shows INTEGER NOT NULL DEFAULT 0,
  closes INTEGER NOT NULL DEFAULT 0,
  deals_lost INTEGER NOT NULL DEFAULT 0,

  -- Financial
  cash_collected DECIMAL(12, 2) NOT NULL DEFAULT 0,
  revenue DECIMAL(12, 2) NOT NULL DEFAULT 0,
  ad_spend DECIMAL(12, 2), -- NULL for organic

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Unique constraint: one report per client per date per funnel type
  UNIQUE(client_id, report_date, funnel_type)
);

-- DM Setter Funnel Reports Table
CREATE TABLE IF NOT EXISTS dm_setter_funnel_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  team_member_id UUID REFERENCES team_members(id) ON DELETE SET NULL,
  member_name TEXT NOT NULL,
  report_date DATE NOT NULL,

  -- Funnel Stages
  dms_sent INTEGER NOT NULL DEFAULT 0,
  responses INTEGER NOT NULL DEFAULT 0,
  conversations INTEGER NOT NULL DEFAULT 0,
  bookings INTEGER NOT NULL DEFAULT 0,
  shows INTEGER NOT NULL DEFAULT 0,
  no_shows INTEGER NOT NULL DEFAULT 0,
  closes INTEGER NOT NULL DEFAULT 0,
  deals_lost INTEGER NOT NULL DEFAULT 0,

  -- Financial
  cash_collected DECIMAL(12, 2) NOT NULL DEFAULT 0,
  revenue DECIMAL(12, 2) NOT NULL DEFAULT 0,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_vsl_funnel_reports_client_date
  ON vsl_funnel_reports(client_id, report_date);
CREATE INDEX IF NOT EXISTS idx_vsl_funnel_reports_funnel_type
  ON vsl_funnel_reports(funnel_type);

CREATE INDEX IF NOT EXISTS idx_dm_setter_funnel_reports_client_date
  ON dm_setter_funnel_reports(client_id, report_date);
CREATE INDEX IF NOT EXISTS idx_dm_setter_funnel_reports_member
  ON dm_setter_funnel_reports(team_member_id);

-- Enable RLS
ALTER TABLE vsl_funnel_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE dm_setter_funnel_reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies for vsl_funnel_reports
CREATE POLICY "Users can view their client's VSL funnel reports" ON vsl_funnel_reports
  FOR SELECT
  USING (
    client_id IN (
      SELECT client_id FROM user_profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their client's VSL funnel reports" ON vsl_funnel_reports
  FOR INSERT
  WITH CHECK (
    client_id IN (
      SELECT client_id FROM user_profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update their client's VSL funnel reports" ON vsl_funnel_reports
  FOR UPDATE
  USING (
    client_id IN (
      SELECT client_id FROM user_profiles WHERE id = auth.uid()
    )
  );

-- RLS Policies for dm_setter_funnel_reports
CREATE POLICY "Users can view their client's DM funnel reports" ON dm_setter_funnel_reports
  FOR SELECT
  USING (
    client_id IN (
      SELECT client_id FROM user_profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their client's DM funnel reports" ON dm_setter_funnel_reports
  FOR INSERT
  WITH CHECK (
    client_id IN (
      SELECT client_id FROM user_profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update their client's DM funnel reports" ON dm_setter_funnel_reports
  FOR UPDATE
  USING (
    client_id IN (
      SELECT client_id FROM user_profiles WHERE id = auth.uid()
    )
  );

-- Sample data for testing (replace client_id with actual value)
-- INSERT INTO vsl_funnel_reports (client_id, report_date, funnel_type, page_views, applications, qualified, bookings, shows, no_shows, closes, deals_lost, cash_collected, revenue, ad_spend)
-- VALUES
--   ('your-client-id', '2024-12-20', 'paid', 1000, 50, 30, 20, 15, 5, 8, 7, 40000, 80000, 5000),
--   ('your-client-id', '2024-12-19', 'paid', 950, 45, 28, 18, 14, 4, 7, 7, 35000, 70000, 4800);
