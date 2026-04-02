-- Seed Data for SBD Virtual-Deployment
-- Target Project: acfukldkynjudodiuang

-- 1. Create a Hospital System
INSERT INTO sbd_hospital_systems (id, name)
VALUES (gen_random_uuid(), 'SIPS Healthcare')
ON CONFLICT DO NOTHING;

-- 2. Create a Facility
INSERT INTO sbd_facilities (id, system_id, name, location, department, contact_name, contact_email)
SELECT 'SIPS-MAIN', id, 'SIPS Main Center', 'Vercel Virtual Node', 'Sterile Processing', 'Izambrano', 'izambrano@sipsconsults.com'
FROM sbd_hospital_systems WHERE name = 'SIPS Healthcare'
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

-- 3. Create the Portal User Profile (izambrano@sipsconsults.com)
-- Note: auth_uid will be NULL initially until user is created in auth.users
INSERT INTO sbd_portal_users (email, name, role, facility_id, system_id, active)
SELECT 'izambrano@sipsconsults.com', 'Izambrano', 'master_admin', 'SIPS-MAIN', id, true
FROM sbd_hospital_systems WHERE name = 'SIPS Healthcare'
ON CONFLICT (email) DO UPDATE SET role = 'master_admin';

-- 4. Seed some Staff
INSERT INTO sbd_staff (facility_id, first_name, last_name, role, belt, stars)
VALUES 
('SIPS-MAIN', 'SBD', 'Agent', 'System Admin', 'Black', 5),
('SIPS-MAIN', 'Deployment', 'Bot', 'Technician', 'Green', 3),
('SIPS-MAIN', 'Virtual', 'User', 'Lead', 'Yellow', 1)
ON CONFLICT DO NOTHING;
