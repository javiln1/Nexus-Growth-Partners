-- Add follow_ups column to vsl_funnel_reports table
ALTER TABLE vsl_funnel_reports
ADD COLUMN IF NOT EXISTS follow_ups INTEGER NOT NULL DEFAULT 0;
