-- Scheduled Calls table for daily call tracking
CREATE TABLE IF NOT EXISTS scheduled_calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  call_date DATE NOT NULL,
  call_time TIME NOT NULL,
  lead_name TEXT NOT NULL,
  lead_email TEXT,
  lead_phone TEXT,
  closer_name TEXT NOT NULL,
  investment_min INTEGER, -- in dollars
  investment_max INTEGER, -- in dollars
  investment_notes TEXT, -- e.g. "Has $50K liquid, willing to invest $10-15K"
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'no_show', 'rescheduled', 'cancelled')),
  outcome TEXT, -- notes after the call
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast lookups by date
CREATE INDEX IF NOT EXISTS idx_scheduled_calls_date ON scheduled_calls(client_id, call_date);

-- Enable RLS
ALTER TABLE scheduled_calls ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see calls for their client
CREATE POLICY "Users can view their client calls"
  ON scheduled_calls FOR SELECT
  USING (
    client_id IN (
      SELECT client_id FROM user_profiles WHERE id = auth.uid()
    )
  );

-- Policy: Users can insert calls for their client
CREATE POLICY "Users can insert their client calls"
  ON scheduled_calls FOR INSERT
  WITH CHECK (
    client_id IN (
      SELECT client_id FROM user_profiles WHERE id = auth.uid()
    )
  );

-- Policy: Users can update their client calls
CREATE POLICY "Users can update their client calls"
  ON scheduled_calls FOR UPDATE
  USING (
    client_id IN (
      SELECT client_id FROM user_profiles WHERE id = auth.uid()
    )
  );
