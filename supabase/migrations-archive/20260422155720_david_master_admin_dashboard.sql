-- Create the Master Admin DAVID Intelligence access control table
CREATE TABLE IF NOT EXISTS david_facility_access (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    facility_id VARCHAR NOT NULL UNIQUE,
    is_active BOOLEAN DEFAULT false,
    tier VARCHAR DEFAULT 'base' CHECK (tier IN ('base', 'premium', 'supreme')),
    max_monthly_tokens INTEGER DEFAULT 500000,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create the usage logging table for cost tracking
CREATE TABLE IF NOT EXISTS david_usage_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    facility_id VARCHAR NOT NULL,
    user_id UUID NOT NULL,
    prompt_tokens INTEGER DEFAULT 0,
    completion_tokens INTEGER DEFAULT 0,
    cost DECIMAL(10, 6) DEFAULT 0.0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE david_facility_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE david_usage_logs ENABLE ROW LEVEL SECURITY;

-- Master Admin full access policy (Assuming master_admin role in JWT or specific lookup)
CREATE POLICY "Master Admins can manage facility access" 
ON david_facility_access 
FOR ALL 
USING (auth.jwt() ->> 'role' = 'master_admin');

-- Facility Admins can only view their own facility access status
CREATE POLICY "Facility Admins can view own access" 
ON david_facility_access 
FOR SELECT 
USING (
    -- Simplistic check; assumes the edge function validates facility assignment
    true 
);

-- Usage logs: Master Admins can see all
CREATE POLICY "Master Admins can view all usage logs" 
ON david_usage_logs 
FOR SELECT 
USING (auth.jwt() ->> 'role' = 'master_admin');

-- Usage logs: Insert policy (Edge Functions bypass RLS, so this is just a safeguard)
CREATE POLICY "Users can insert own usage logs" 
ON david_usage_logs 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create aggregated view for the Master Dashboard Analytics
CREATE OR REPLACE VIEW david_analytics_summary AS
SELECT 
    facility_id,
    COUNT(*) as total_requests,
    SUM(prompt_tokens + completion_tokens) as total_tokens,
    SUM(cost) as total_cost,
    MAX(created_at) as last_request_date
FROM david_usage_logs
GROUP BY facility_id;
