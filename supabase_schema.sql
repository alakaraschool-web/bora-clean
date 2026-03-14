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
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    phone TEXT UNIQUE, -- For phone-based login
    password TEXT, -- For fallback login
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('super-admin', 'principal', 'teacher', 'student')),
    avatar_url TEXT,
    assignments JSONB DEFAULT '[]',
    student_id UUID, -- Link to students table if role is student
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Students Table
CREATE TABLE IF NOT EXISTS students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
    admission_number TEXT UNIQUE,
    name TEXT NOT NULL,
    email TEXT,
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

-- RLS Policies (Basic)
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

-- Simple policies for development (can be refined for production)
CREATE POLICY "Public schools access" ON schools FOR SELECT USING (true);
CREATE POLICY "Profiles access" ON profiles FOR ALL USING (true);
CREATE POLICY "Students access" ON students FOR ALL USING (true);
CREATE POLICY "Exams access" ON exams FOR ALL USING (true);
CREATE POLICY "Marks access" ON marks FOR ALL USING (true);
CREATE POLICY "Materials access" ON exam_materials FOR ALL USING (true);
CREATE POLICY "Settings access" ON school_settings FOR ALL USING (true);
CREATE POLICY "Logs access" ON audit_logs FOR ALL USING (true);
CREATE POLICY "Classes access" ON classes FOR ALL USING (true);
CREATE POLICY "Streams access" ON streams FOR ALL USING (true);
CREATE POLICY "Stories access" ON success_stories FOR ALL USING (true);
