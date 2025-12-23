-- Ad Performance Breakdown Table
CREATE TABLE IF NOT EXISTS vsl_ad_performance (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  report_date DATE NOT NULL,

  -- UTM Tracking
  campaign_name TEXT NOT NULL,
  adset_name TEXT,
  ad_name TEXT,

  -- Metrics
  ad_spend DECIMAL(12, 2) NOT NULL DEFAULT 0,
  page_views INTEGER NOT NULL DEFAULT 0,
  applications INTEGER NOT NULL DEFAULT 0,
  qualified INTEGER NOT NULL DEFAULT 0,
  bookings INTEGER NOT NULL DEFAULT 0,
  shows INTEGER NOT NULL DEFAULT 0,
  closes INTEGER NOT NULL DEFAULT 0,
  cash_collected DECIMAL(12, 2) NOT NULL DEFAULT 0,
  revenue DECIMAL(12, 2) NOT NULL DEFAULT 0,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Unique constraint per client/date/campaign/adset/ad
  UNIQUE(client_id, report_date, campaign_name, adset_name, ad_name)
);

-- Index for common queries
CREATE INDEX IF NOT EXISTS idx_vsl_ad_performance_client_date
  ON vsl_ad_performance(client_id, report_date);
CREATE INDEX IF NOT EXISTS idx_vsl_ad_performance_campaign
  ON vsl_ad_performance(campaign_name);

-- Enable RLS
ALTER TABLE vsl_ad_performance ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their client's ad performance" ON vsl_ad_performance
  FOR SELECT
  USING (
    client_id IN (
      SELECT client_id FROM user_profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their client's ad performance" ON vsl_ad_performance
  FOR INSERT
  WITH CHECK (
    client_id IN (
      SELECT client_id FROM user_profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update their client's ad performance" ON vsl_ad_performance
  FOR UPDATE
  USING (
    client_id IN (
      SELECT client_id FROM user_profiles WHERE id = auth.uid()
    )
  );
