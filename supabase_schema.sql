-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Schools Table
CREATE TABLE IF NOT EXISTS schools (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    location TEXT,
    county TEXT,
    sub_county TEXT,
    type TEXT DEFAULT 'Secondary',
    principal_name TEXT,
    status TEXT DEFAULT 'Active',
    subscription_expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Profiles Table (Extends Auth Users)
-- NOTE: If you get an error about "user_id" column not found or null value, 
-- ensure your database has this column. Some versions of Supabase templates use user_id.
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
    email TEXT UNIQUE,
    phone TEXT UNIQUE NOT NULL, -- For phone-based login
    password TEXT, -- For fallback login
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('super-admin', 'principal', 'teacher', 'student')),
    avatar_url TEXT,
    assignments JSONB DEFAULT '[]',
    student_id UUID, -- Link to students table if role is student
    must_change_password BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Students Table
CREATE TABLE IF NOT EXISTS students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
    admission_number TEXT UNIQUE,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT, -- Added phone for students
    gender TEXT DEFAULT 'Male',
    profile_image TEXT,
    class TEXT,
    stream TEXT,
    parent_name TEXT,
    parent_phone TEXT,
    password TEXT, -- For student login fallback
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Exams Table
CREATE TABLE IF NOT EXISTS exams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    term TEXT,
    year TEXT,
    classes JSONB DEFAULT '[]',
    streams JSONB DEFAULT '[]',
    subjects JSONB DEFAULT '[]',
    status TEXT DEFAULT 'Active',
    published BOOLEAN DEFAULT false,
    weighting NUMERIC DEFAULT 100,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Marks Table
CREATE TABLE IF NOT EXISTS marks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    exam_id UUID REFERENCES exams(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    subject TEXT NOT NULL,
    score NUMERIC,
    max_score NUMERIC DEFAULT 100,
    grade TEXT,
    teacher_id UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(exam_id, student_id, subject)
);

-- 6. Exam Materials Table
CREATE TABLE IF NOT EXISTS exam_materials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    subject TEXT NOT NULL,
    file_url TEXT,
    file_type TEXT,
    category TEXT DEFAULT 'Exam',
    description TEXT,
    status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected')),
    visibility TEXT DEFAULT 'Public' CHECK (visibility IN ('Public', 'Hidden')),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. School Settings Table
CREATE TABLE IF NOT EXISTS school_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE UNIQUE,
    logo_url TEXT,
    motto TEXT,
    letterhead_template TEXT,
    theme_color TEXT DEFAULT '#5A5A40',
    grading_system JSONB DEFAULT '[]',
    address TEXT,
    website TEXT,
    phone TEXT,
    email TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 8. Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id),
    action TEXT NOT NULL,
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 9. Classes Table
CREATE TABLE IF NOT EXISTS classes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    teacher_id UUID REFERENCES profiles(id),
    capacity INTEGER DEFAULT 40,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 10. Streams Table
CREATE TABLE IF NOT EXISTS streams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 11. Success Stories Table
CREATE TABLE IF NOT EXISTS success_stories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    author_name TEXT,
    school_name TEXT,
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 12. Messages Table
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    receiver_id UUID REFERENCES profiles(id) ON DELETE CASCADE, -- Can be null for broadcast
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    type TEXT DEFAULT 'direct' CHECK (type IN ('direct', 'broadcast')),
    target_role TEXT CHECK (target_role IN ('teacher', 'principal', 'super-admin')),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Trigger to prevent teacher role changes
CREATE OR REPLACE FUNCTION prevent_teacher_role_change()
RETURNS TRIGGER AS $$
BEGIN
  -- If the old role was 'teacher', prevent changing it to anything else
  IF OLD.role = 'teacher' AND NEW.role != 'teacher' THEN
    RAISE EXCEPTION 'Teacher role cannot be changed.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_teacher_role_change ON profiles;
CREATE TRIGGER trg_prevent_teacher_role_change
BEFORE UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION prevent_teacher_role_change();

-- RLS Policies (Restricted)
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE marks ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE school_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE streams ENABLE ROW LEVEL SECURITY;
ALTER TABLE success_stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Helper function to get current user's role
CREATE OR REPLACE FUNCTION get_my_role() RETURNS TEXT AS $$
DECLARE
  _role TEXT;
BEGIN
  -- Try to get role from profiles
  SELECT role INTO _role FROM profiles WHERE user_id = auth.uid() LIMIT 1;
  
  -- Bootstrap super-admin by email or phone if no profile exists yet
  IF _role IS NULL AND (
    auth.jwt() ->> 'email' = 'alakaraschool@gmail.com' OR
    auth.jwt() ->> 'phone' = '+254712345678' -- Example placeholder, should ideally be dynamic or matched
  ) THEN
    RETURN 'super-admin';
  END IF;
  
  RETURN _role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to get current user's school_id
CREATE OR REPLACE FUNCTION get_my_school_id() RETURNS UUID AS $$
  SELECT school_id FROM profiles WHERE user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;

-- Helper function for email discovery (Publicly accessible via RPC but secure)
CREATE OR REPLACE FUNCTION get_email_by_phone(p_phone TEXT, p_role TEXT) 
RETURNS TABLE (email TEXT) AS $$
BEGIN
  RETURN QUERY SELECT p.email FROM profiles p WHERE p.phone = p_phone AND p.role = p_role LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 1. Schools Policies
CREATE POLICY "Super-admin schools access" ON schools FOR ALL 
USING (get_my_role() = 'super-admin')
WITH CHECK (get_my_role() = 'super-admin');

CREATE POLICY "School members select school" ON schools FOR SELECT 
USING (id = get_my_school_id());

CREATE POLICY "Enable insert for authenticated users" ON schools FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

-- 2. Profiles Policies
CREATE POLICY "Super-admin profiles access" ON profiles FOR ALL 
USING (get_my_role() = 'super-admin')
WITH CHECK (get_my_role() = 'super-admin');

CREATE POLICY "Enable insert for authenticated users" ON profiles FOR INSERT 
WITH CHECK (auth.uid() = user_id OR auth.uid() = id);

CREATE POLICY "Enable select for authenticated users" ON profiles FOR SELECT 
USING (auth.uid() = user_id OR auth.uid() = id);

CREATE POLICY "Enable update for authenticated users" ON profiles FOR UPDATE
USING (auth.uid() = user_id OR auth.uid() = id)
WITH CHECK (auth.uid() = user_id OR auth.uid() = id);

CREATE POLICY "Principal profiles select" ON profiles FOR SELECT USING (
    get_my_role() = 'principal' 
    AND school_id = get_my_school_id()
    AND (role != 'principal' OR user_id = auth.uid())
);

CREATE POLICY "Principal profiles insert" ON profiles FOR INSERT WITH CHECK (
    get_my_role() = 'principal' 
    AND school_id = get_my_school_id()
    AND role NOT IN ('super-admin', 'principal')
);

CREATE POLICY "Principal profiles update" ON profiles FOR UPDATE USING (
    get_my_role() = 'principal' 
    AND school_id = get_my_school_id()
    AND (role != 'principal' OR user_id = auth.uid())
) WITH CHECK (
    -- Principals cannot change roles to super-admin or principal for others
    (user_id = auth.uid()) OR (role NOT IN ('super-admin', 'principal'))
);

CREATE POLICY "Principal profiles delete" ON profiles FOR DELETE USING (
    get_my_role() = 'principal' 
    AND school_id = get_my_school_id()
    AND role NOT IN ('super-admin', 'principal')
);

CREATE POLICY "Teacher profiles select" ON profiles FOR SELECT USING (
    get_my_role() = 'teacher'
    AND school_id = get_my_school_id()
);

CREATE POLICY "Student profiles select" ON profiles FOR SELECT USING (
    get_my_role() = 'student'
    AND school_id = get_my_school_id()
    AND (role = 'teacher' OR user_id = auth.uid())
);

-- 3. Students Policies
CREATE POLICY "Super-admin students access" ON students FOR ALL 
USING (get_my_role() = 'super-admin')
WITH CHECK (get_my_role() = 'super-admin');

CREATE POLICY "School members students access" ON students FOR ALL 
USING (school_id = get_my_school_id())
WITH CHECK (school_id = get_my_school_id());

-- 4. Exams Policies
CREATE POLICY "Super-admin exams access" ON exams FOR ALL 
USING (get_my_role() = 'super-admin')
WITH CHECK (get_my_role() = 'super-admin');

CREATE POLICY "School members exams access" ON exams FOR ALL 
USING (school_id = get_my_school_id())
WITH CHECK (school_id = get_my_school_id());

-- 5. Marks Policies
CREATE POLICY "Super-admin marks access" ON marks FOR ALL 
USING (get_my_role() = 'super-admin')
WITH CHECK (get_my_role() = 'super-admin');

CREATE POLICY "School members marks access" ON marks FOR ALL 
USING (EXISTS (SELECT 1 FROM exams WHERE exams.id = marks.exam_id AND exams.school_id = get_my_school_id()))
WITH CHECK (EXISTS (SELECT 1 FROM exams WHERE exams.id = marks.exam_id AND exams.school_id = get_my_school_id()));

-- 6. Exam Materials Policies
CREATE POLICY "Super-admin materials access" ON exam_materials FOR ALL 
USING (get_my_role() = 'super-admin')
WITH CHECK (get_my_role() = 'super-admin');

CREATE POLICY "Public materials select" ON exam_materials FOR SELECT 
USING (visibility = 'Public');

CREATE POLICY "School members materials access" ON exam_materials FOR ALL 
USING (school_id = get_my_school_id())
WITH CHECK (school_id = get_my_school_id());

-- 7. School Settings Policies
CREATE POLICY "Super-admin settings access" ON school_settings FOR ALL 
USING (get_my_role() = 'super-admin')
WITH CHECK (get_my_role() = 'super-admin');

CREATE POLICY "School members settings access" ON school_settings FOR ALL 
USING (school_id = get_my_school_id())
WITH CHECK (school_id = get_my_school_id());

-- 8. Audit Logs Policies
CREATE POLICY "Super-admin logs access" ON audit_logs FOR ALL 
USING (get_my_role() = 'super-admin')
WITH CHECK (get_my_role() = 'super-admin');

CREATE POLICY "School members logs access" ON audit_logs FOR ALL 
USING (school_id = get_my_school_id())
WITH CHECK (school_id = get_my_school_id());

-- 9. Classes Policies
CREATE POLICY "Super-admin classes access" ON classes FOR ALL 
USING (get_my_role() = 'super-admin')
WITH CHECK (get_my_role() = 'super-admin');

CREATE POLICY "School members classes access" ON classes FOR ALL 
USING (school_id = get_my_school_id())
WITH CHECK (school_id = get_my_school_id());

-- 10. Streams Policies
CREATE POLICY "Super-admin streams access" ON streams FOR ALL 
USING (get_my_role() = 'super-admin')
WITH CHECK (get_my_role() = 'super-admin');

CREATE POLICY "School members streams access" ON streams FOR ALL 
USING (EXISTS (SELECT 1 FROM classes WHERE classes.id = streams.class_id AND classes.school_id = get_my_school_id()))
WITH CHECK (EXISTS (SELECT 1 FROM classes WHERE classes.id = streams.class_id AND classes.school_id = get_my_school_id()));

-- 11. Success Stories Policies
CREATE POLICY "Public stories select" ON success_stories FOR SELECT 
USING (true);

CREATE POLICY "Super-admin stories access" ON success_stories FOR ALL 
USING (get_my_role() = 'super-admin')
WITH CHECK (get_my_role() = 'super-admin');

-- 12. Messages Policies
CREATE POLICY "Messages access" ON messages FOR ALL 
USING (
    sender_id = auth.uid() OR 
    receiver_id = auth.uid() OR 
    (type = 'broadcast' AND target_role = get_my_role() AND school_id = get_my_school_id()) OR
    get_my_role() = 'super-admin'
)
WITH CHECK (
    sender_id = auth.uid() OR 
    get_my_role() = 'super-admin'
);
