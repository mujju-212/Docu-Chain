-- Sample Data for DocuChain Database
-- Run this after setup_database.sql

-- Insert sample institutions
INSERT INTO institutions (id, name, type, unique_id, address, website, email, phone) VALUES
(uuid_generate_v4(), 'Mumbai University', 'university', 'MU001', 'Kalina, Santacruz East, Mumbai, Maharashtra 400098', 'https://mu.ac.in', 'info@mu.ac.in', '+91-22-2652-6543'),
(uuid_generate_v4(), 'VIT College', 'college', 'VIT001', 'Eastern Express Highway, Wadala, Mumbai, Maharashtra 400037', 'https://vit.edu', 'admission@vit.edu', '+91-22-2461-1111'),
(uuid_generate_v4(), 'Delhi Public School', 'school', 'DPS001', 'Sector 45, Gurgaon, Haryana 122003', 'https://dps.edu', 'principal@dps.edu', '+91-124-456-7890');

-- Insert sample departments (after institutions)
DO $$
DECLARE
    mu_id UUID;
    vit_id UUID;
    dps_id UUID;
    cs_dept_id UUID;
    it_dept_id UUID;
    mech_dept_id UUID;
    high_school_id UUID;
BEGIN
    -- Get institution IDs
    SELECT id INTO mu_id FROM institutions WHERE unique_id = 'MU001';
    SELECT id INTO vit_id FROM institutions WHERE unique_id = 'VIT001';
    SELECT id INTO dps_id FROM institutions WHERE unique_id = 'DPS001';
    
    -- Insert departments
    INSERT INTO departments (id, institution_id, name) VALUES
    (uuid_generate_v4(), mu_id, 'Computer Science'),
    (uuid_generate_v4(), mu_id, 'Information Technology'),
    (uuid_generate_v4(), vit_id, 'Computer Engineering'),
    (uuid_generate_v4(), vit_id, 'Mechanical Engineering'),
    (uuid_generate_v4(), dps_id, 'High School');
    
    -- Get department IDs for sections
    SELECT id INTO cs_dept_id FROM departments WHERE name = 'Computer Science' AND institution_id = mu_id;
    SELECT id INTO it_dept_id FROM departments WHERE name = 'Information Technology' AND institution_id = mu_id;
    SELECT id INTO high_school_id FROM departments WHERE name = 'High School' AND institution_id = dps_id;
    
    -- Insert sections
    INSERT INTO sections (department_id, name) VALUES
    (cs_dept_id, 'CS-A'),
    (cs_dept_id, 'CS-B'),
    (it_dept_id, 'IT-A'),
    (high_school_id, 'Class 12-A'),
    (high_school_id, 'Class 11-B');
END $$;

-- Insert sample users with hashed passwords (password: 'admin123', 'faculty123', 'student123')
-- Note: In production, use proper password hashing. These are bcrypt hashes.
DO $$
DECLARE
    mu_id UUID;
    vit_id UUID;
    dps_id UUID;
    cs_dept_id UUID;
    it_dept_id UUID;
    ce_dept_id UUID;
    mech_dept_id UUID;
    hs_dept_id UUID;
    cs_a_section_id UUID;
    cs_b_section_id UUID;
    it_a_section_id UUID;
    class12a_section_id UUID;
    class11b_section_id UUID;
BEGIN
    -- Get institution IDs
    SELECT id INTO mu_id FROM institutions WHERE unique_id = 'MU001';
    SELECT id INTO vit_id FROM institutions WHERE unique_id = 'VIT001';
    SELECT id INTO dps_id FROM institutions WHERE unique_id = 'DPS001';
    
    -- Get department IDs
    SELECT id INTO cs_dept_id FROM departments WHERE name = 'Computer Science' AND institution_id = mu_id;
    SELECT id INTO it_dept_id FROM departments WHERE name = 'Information Technology' AND institution_id = mu_id;
    SELECT id INTO ce_dept_id FROM departments WHERE name = 'Computer Engineering' AND institution_id = vit_id;
    SELECT id INTO mech_dept_id FROM departments WHERE name = 'Mechanical Engineering' AND institution_id = vit_id;
    SELECT id INTO hs_dept_id FROM departments WHERE name = 'High School' AND institution_id = dps_id;
    
    -- Get section IDs
    SELECT id INTO cs_a_section_id FROM sections WHERE name = 'CS-A';
    SELECT id INTO cs_b_section_id FROM sections WHERE name = 'CS-B';
    SELECT id INTO it_a_section_id FROM sections WHERE name = 'IT-A';
    SELECT id INTO class12a_section_id FROM sections WHERE name = 'Class 12-A';
    SELECT id INTO class11b_section_id FROM sections WHERE name = 'Class 11-B';
    
    -- Insert Admin Users
    INSERT INTO users (institution_id, first_name, last_name, unique_id, email, password_hash, role, status) VALUES
    (mu_id, 'Rajesh', 'Kumar', 'MU_ADMIN_001', 'admin@mu.ac.in', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewLBFfYs1VC3GDcG', 'admin', 'active'),
    (vit_id, 'Priya', 'Sharma', 'VIT_ADMIN_001', 'admin@vit.edu', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewLBFfYs1VC3GDcG', 'admin', 'active'),
    (dps_id, 'Amit', 'Singh', 'DPS_ADMIN_001', 'admin@dps.edu', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewLBFfYs1VC3GDcG', 'admin', 'active');
    
    -- Insert Faculty Users
    INSERT INTO users (institution_id, department_id, first_name, last_name, unique_id, email, password_hash, role, status) VALUES
    (mu_id, cs_dept_id, 'Dr. Meera', 'Patel', 'MU_FAC_001', 'meera.patel@mu.ac.in', '$2b$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'faculty', 'active'),
    (mu_id, it_dept_id, 'Prof. Suresh', 'Gupta', 'MU_FAC_002', 'suresh.gupta@mu.ac.in', '$2b$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'faculty', 'active'),
    (vit_id, ce_dept_id, 'Dr. Kavita', 'Joshi', 'VIT_FAC_001', 'kavita.joshi@vit.edu', '$2b$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'faculty', 'active'),
    (vit_id, mech_dept_id, 'Prof. Ravi', 'Mehta', 'VIT_FAC_002', 'ravi.mehta@vit.edu', '$2b$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'faculty', 'active'),
    (dps_id, hs_dept_id, 'Mrs. Sunita', 'Verma', 'DPS_FAC_001', 'sunita.verma@dps.edu', '$2b$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'faculty', 'active');
    
    -- Insert Student Users
    INSERT INTO users (institution_id, department_id, section_id, first_name, last_name, unique_id, email, password_hash, role, status) VALUES
    (mu_id, cs_dept_id, cs_a_section_id, 'Aarav', 'Sharma', 'MU_STU_001', 'aarav.sharma@student.mu.ac.in', '$2b$12$TwQoKrh.YMchBNw3CHkpsuqE.KWEMJMWTiNe3Y4.sYXI1fJHZ7EYu', 'student', 'active'),
    (mu_id, cs_dept_id, cs_a_section_id, 'Diya', 'Patel', 'MU_STU_002', 'diya.patel@student.mu.ac.in', '$2b$12$TwQoKrh.YMchBNw3CHkpsuqE.KWEMJMWTiNe3Y4.sYXI1fJHZ7EYu', 'student', 'active'),
    (mu_id, cs_dept_id, cs_b_section_id, 'Arjun', 'Kumar', 'MU_STU_003', 'arjun.kumar@student.mu.ac.in', '$2b$12$TwQoKrh.YMchBNw3CHkpsuqE.KWEMJMWTiNe3Y4.sYXI1fJHZ7EYu', 'student', 'active'),
    (mu_id, it_dept_id, it_a_section_id, 'Sneha', 'Singh', 'MU_STU_004', 'sneha.singh@student.mu.ac.in', '$2b$12$TwQoKrh.YMchBNw3CHkpsuqE.KWEMJMWTiNe3Y4.sYXI1fJHZ7EYu', 'student', 'active'),
    (vit_id, ce_dept_id, NULL, 'Rohan', 'Desai', 'VIT_STU_001', 'rohan.desai@student.vit.edu', '$2b$12$TwQoKrh.YMchBNw3CHkpsuqE.KWEMJMWTiNe3Y4.sYXI1fJHZ7EYu', 'student', 'active'),
    (vit_id, mech_dept_id, NULL, 'Anisha', 'Rao', 'VIT_STU_002', 'anisha.rao@student.vit.edu', '$2b$12$TwQoKrh.YMchBNw3CHkpsuqE.KWEMJMWTiNe3Y4.sYXI1fJHZ7EYu', 'student', 'active'),
    (dps_id, hs_dept_id, class12a_section_id, 'Karan', 'Agarwal', 'DPS_STU_001', 'karan.agarwal@student.dps.edu', '$2b$12$TwQoKrh.YMchBNw3CHkpsuqE.KWEMJMWTiNe3Y4.sYXI1fJHZ7EYu', 'student', 'active'),
    (dps_id, hs_dept_id, class11b_section_id, 'Riya', 'Gupta', 'DPS_STU_002', 'riya.gupta@student.dps.edu', '$2b$12$TwQoKrh.YMchBNw3CHkpsuqE.KWEMJMWTiNe3Y4.sYXI1fJHZ7EYu', 'student', 'active');
END $$;

-- Insert user preferences for all users
INSERT INTO user_preferences (user_id, theme, notification_settings, language, timezone)
SELECT 
    id,
    'green',
    '{"email": true, "push": true, "sms": false}'::jsonb,
    'en',
    'Asia/Kolkata'
FROM users;

-- Insert some sample folders for each user
DO $$
DECLARE
    user_record RECORD;
BEGIN
    FOR user_record IN SELECT id, institution_id FROM users LOOP
        INSERT INTO folders (owner_id, institution_id, name, is_system_folder) VALUES
        (user_record.id, user_record.institution_id, 'My Documents', true),
        (user_record.id, user_record.institution_id, 'Shared', true),
        (user_record.id, user_record.institution_id, 'Projects', false);
    END LOOP;
END $$;

-- Insert sample chat groups
DO $$
DECLARE
    mu_id UUID;
    vit_id UUID;
    dps_id UUID;
    cs_dept_id UUID;
    it_dept_id UUID;
    admin_user_id UUID;
BEGIN
    SELECT id INTO mu_id FROM institutions WHERE unique_id = 'MU001';
    SELECT id INTO vit_id FROM institutions WHERE unique_id = 'VIT001';
    SELECT id INTO dps_id FROM institutions WHERE unique_id = 'DPS001';
    
    SELECT id INTO cs_dept_id FROM departments WHERE name = 'Computer Science' AND institution_id = mu_id;
    SELECT id INTO it_dept_id FROM departments WHERE name = 'Information Technology' AND institution_id = mu_id;
    
    SELECT id INTO admin_user_id FROM users WHERE unique_id = 'MU_ADMIN_001';
    
    -- Institution-wide groups
    INSERT INTO chat_groups (institution_id, name, description, group_type, created_by, is_auto_join) VALUES
    (mu_id, 'Mumbai University General', 'General discussion for all Mumbai University members', 'institution', admin_user_id, true),
    (vit_id, 'VIT College Announcements', 'Official announcements for VIT College', 'institution', (SELECT id FROM users WHERE unique_id = 'VIT_ADMIN_001'), true),
    (dps_id, 'DPS School Updates', 'Important updates for DPS School', 'institution', (SELECT id FROM users WHERE unique_id = 'DPS_ADMIN_001'), true);
    
    -- Department groups
    INSERT INTO chat_groups (institution_id, department_id, name, description, group_type, created_by, is_auto_join) VALUES
    (mu_id, cs_dept_id, 'Computer Science Department', 'CS Department discussions', 'department', admin_user_id, true),
    (mu_id, it_dept_id, 'Information Technology Department', 'IT Department discussions', 'department', admin_user_id, true);
END $$;

-- Add users to chat groups
DO $$
DECLARE
    user_record RECORD;
    group_record RECORD;
BEGIN
    -- Add all users to their respective institution groups
    FOR user_record IN SELECT id, institution_id FROM users LOOP
        FOR group_record IN SELECT id FROM chat_groups WHERE institution_id = user_record.institution_id AND group_type = 'institution' LOOP
            INSERT INTO chat_group_members (group_id, user_id, role) VALUES
            (group_record.id, user_record.id, 'member');
        END LOOP;
    END LOOP;
    
    -- Add users to department groups
    FOR user_record IN SELECT id, institution_id, department_id FROM users WHERE department_id IS NOT NULL LOOP
        FOR group_record IN SELECT id FROM chat_groups WHERE institution_id = user_record.institution_id AND department_id = user_record.department_id LOOP
            INSERT INTO chat_group_members (group_id, user_id, role) VALUES
            (group_record.id, user_record.id, 'member');
        END LOOP;
    END LOOP;
END $$;

-- Insert sample document templates
DO $$
DECLARE
    mu_id UUID;
    admin_id UUID;
BEGIN
    SELECT id INTO mu_id FROM institutions WHERE unique_id = 'MU001';
    SELECT id INTO admin_id FROM users WHERE unique_id = 'MU_ADMIN_001';
    
    INSERT INTO document_templates (institution_id, name, description, template_type, template_content, is_system_template, created_by) VALUES
    (mu_id, 'Leave Application', 'Standard leave application template', 'application', '<!DOCTYPE html><html><head><title>Leave Application</title></head><body><h2>Leave Application</h2><p>Date: [DATE]</p><p>To: [TO]</p><p>Subject: Application for Leave</p><p>Dear Sir/Madam,</p><p>I am writing to request leave from [START_DATE] to [END_DATE] due to [REASON].</p><p>Thank you for your consideration.</p><p>Yours sincerely,<br>[NAME]<br>[ID]</p></body></html>', true, admin_id),
    (mu_id, 'Certificate Request', 'Template for requesting certificates', 'request', '<!DOCTYPE html><html><head><title>Certificate Request</title></head><body><h2>Certificate Request</h2><p>Date: [DATE]</p><p>To: The Registrar</p><p>Subject: Request for [CERTIFICATE_TYPE]</p><p>Dear Sir/Madam,</p><p>I request you to issue me a [CERTIFICATE_TYPE] for [PURPOSE].</p><p>My details:<br>Name: [NAME]<br>ID: [ID]<br>Course: [COURSE]<br>Year: [YEAR]</p><p>Thank you.</p><p>Yours faithfully,<br>[NAME]</p></body></html>', true, admin_id);
END $$;

-- Success message
SELECT 'Sample data inserted successfully!' as message;

-- Display login credentials
SELECT 
    'Login Credentials for Testing' as info,
    'Email: ' || email as email,
    'Password: ' || CASE 
        WHEN role = 'admin' THEN 'admin123'
        WHEN role = 'faculty' THEN 'faculty123'
        WHEN role = 'student' THEN 'student123'
    END as password,
    role,
    first_name || ' ' || last_name as full_name,
    (SELECT name FROM institutions WHERE id = users.institution_id) as institution
FROM users 
ORDER BY institution_id, role, first_name;