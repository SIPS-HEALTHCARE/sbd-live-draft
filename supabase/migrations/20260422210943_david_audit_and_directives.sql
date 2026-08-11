-- 1. Create the Audit Logging table for Master Admin actions
CREATE TABLE IF NOT EXISTS david_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    facility_id VARCHAR,
    actor_id UUID,
    action VARCHAR NOT NULL,
    target_id VARCHAR,
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on audit logs
ALTER TABLE david_audit_logs ENABLE ROW LEVEL SECURITY;

-- Master Admin full access policy
CREATE POLICY "Master Admins can view audit logs" 
ON david_audit_logs 
FOR SELECT 
USING (auth.jwt() ->> 'role' = 'master_admin');

-- Edge Functions bypass RLS for inserts, but here is a standard safeguard
CREATE POLICY "Admins can insert audit logs" 
ON david_audit_logs 
FOR INSERT 
WITH CHECK (true);

-- 2. Add custom directive column to david_facility_access for prompt injection
ALTER TABLE david_facility_access 
ADD COLUMN IF NOT EXISTS custom_directive TEXT;
