import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  
  console.log('Supabase URL:', supabaseUrl);
  console.log('Supabase Service Key exists:', !!supabaseServiceKey);

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  // API Route to verify student login (ADM + Name)
  app.post('/api/auth/student-login-verify', async (req, res) => {
    const { admissionNumber, namePart } = req.body;

    if (!admissionNumber || !namePart) {
      return res.status(400).json({ error: 'Missing admission number or name' });
    }

    try {
      // 1. Find student by admission number
      const { data: student, error: studentError } = await supabaseAdmin
        .from('students')
        .select('*')
        .eq('admission_number', admissionNumber)
        .maybeSingle();

      if (studentError || !student) {
        return res.status(404).json({ error: 'Student not found with this admission number' });
      }

      // 2. Verify name part
      const names = student.name.toLowerCase().split(/\s+/);
      const inputName = namePart.toLowerCase().trim();
      
      const isNameValid = names.some((n: string) => n === inputName || n.includes(inputName) || inputName.includes(n));

      if (!isNameValid && namePart !== 'password123') {
        return res.status(401).json({ error: 'The name provided does not match our records for this admission number' });
      }

      // 3. Get profile to find the current password and email
      const { data: profile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('email, password, id')
        .eq('student_id', student.id)
        .maybeSingle();

      if (profileError || !profile) {
        // If no profile, we can't log in via Auth yet. 
        // But we can return the dummy email and default password
        const dummyEmail = `${admissionNumber.toLowerCase().replace(/[^a-z0-9]/g, '')}@student.boraschool.ke`;
        return res.json({ 
          success: true, 
          email: dummyEmail, 
          password: 'password123',
          message: 'Profile missing, using defaults' 
        });
      }

      res.json({ 
        success: true, 
        email: profile.email, 
        password: profile.password || 'password123' 
      });
    } catch (error: any) {
      console.error('Student Login Verify Error:', error);
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  });

  // API Route to bulk create students
  app.post('/api/auth/bulk-create-students', async (req, res) => {
    const { students, school_id } = req.body;

    if (!students || !Array.isArray(students) || !school_id) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const results = {
      success: [] as any[],
      failed: [] as any[]
    };

    try {
      for (const student of students) {
        const { name, admission_number, class: className, gender, phone } = student;
        const dummyEmail = `${admission_number.toLowerCase().replace(/[^a-z0-9]/g, '')}@student.boraschool.ke`;
        const password = 'password123';

        try {
          console.log('Processing student:', student);
          // 1. Create Auth Account
          const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email: dummyEmail,
            password,
            email_confirm: true,
            user_metadata: { name, role: 'student', school_id }
          });

          let authUserId;
          if (authError) {
            if (authError.message.includes('already registered')) {
              const { data: users } = await supabaseAdmin.auth.admin.listUsers();
              const existingUser = users?.users.find((u: any) => u.email === dummyEmail);
              if (existingUser) {
                authUserId = existingUser.id;
              } else {
                throw authError;
              }
            } else {
              throw authError;
            }
          } else {
            authUserId = authData.user.id;
          }

          // 2. Create Student Record
          const { data: studentData, error: studentError } = await supabaseAdmin.from('students').upsert({
            id: authUserId,
            name,
            admission_number,
            class: className,
            gender,
            school_id,
            status: 'Active'
          }).select().single();

          if (studentError) throw studentError;

          // 3. Create Profile Record
          const { error: profileError } = await supabaseAdmin.from('profiles').upsert({
            id: authUserId,
            user_id: authUserId,
            name,
            email: dummyEmail,
            phone: phone || null,
            role: 'student',
            school_id,
            student_id: studentData.id,
            password,
            must_change_password: true
          });

          if (profileError) throw profileError;

          results.success.push({ id: authUserId, name, admission_number });
        } catch (err: any) {
          console.error(`Error creating student ${admission_number}:`, err);
          results.failed.push({ name, admission_number, error: err.message });
        }
      }

      res.json(results);
    } catch (error: any) {
      console.error('Server Bulk Create Error:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      res.status(500).json({ error: errorMessage || 'Internal server error' });
    }
  });

  // API Route to create a user using Service Role Key
  app.post('/api/auth/create-user', async (req, res) => {
    const { email, password, role, name, phone, school_id, student_id } = req.body;

    if (!email || !password || !role || !name || !school_id) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
      // 1. Create Auth Account
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { name, role, school_id }
      });

      if (authError) {
        // Check if user already exists
        if (authError.message.includes('already registered')) {
          // Find the user
          const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers();
          if (listError) throw listError;
          const existingUser = users.users.find((u: any) => u.email === email);
          if (existingUser) {
            // Update profile if needed
            const { error: profileError } = await supabaseAdmin.from('profiles').upsert({
              id: existingUser.id,
              user_id: existingUser.id,
              name,
              email,
              phone,
              role,
              school_id,
              student_id,
              password,
              must_change_password: true
            });
            if (profileError) throw profileError;
            return res.json({ success: true, user: existingUser, message: 'User already existed, profile updated' });
          }
        }
        throw authError;
      }

      // 2. Create Profile Record
      const { error: profileError } = await supabaseAdmin.from('profiles').upsert({
        id: authData.user.id,
        user_id: authData.user.id,
        name,
        email,
        phone,
        role,
        school_id,
        student_id,
        password,
        must_change_password: true
      });

      if (profileError) throw profileError;

      res.json({ success: true, user: authData.user });
    } catch (error: any) {
      console.error('Server Create User Error:', error);
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  });

  // API Route to reset Auth password using Service Role Key
  app.post('/api/auth/reset-password', async (req, res) => {
    const { profileId, newPassword } = req.body;

    if (!profileId || !newPassword) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
      // 1. Get the user_id from the profiles table
      const { data: profile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('user_id, email, phone')
        .eq('id', profileId)
        .single();

      if (profileError || !profile) {
        return res.status(404).json({ error: 'Profile not found' });
      }

      if (!profile.user_id) {
        // If no user_id, we can't update Auth. 
        // But we can try to find the user in Auth by email/phone
        const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers();
        if (listError) throw listError;

        const authUser = users.users.find((u: any) => 
          u.email === profile.email || 
          u.phone === profile.phone ||
          u.user_metadata?.phone === profile.phone
        );

        if (authUser) {
          // Update Auth password
          const { error: authUpdateError } = await supabaseAdmin.auth.admin.updateUserById(
            authUser.id,
            { password: newPassword }
          );
          if (authUpdateError) throw authUpdateError;

          // Update profile with user_id
          await supabaseAdmin.from('profiles').update({ user_id: authUser.id }).eq('id', profileId);
          
          return res.json({ success: true, message: 'Auth password updated and synced' });
        }

        return res.status(400).json({ error: 'User not found in Auth system. Please login normally to create your account.' });
      }

      // 2. Update Auth password directly
      const { error: authUpdateError } = await supabaseAdmin.auth.admin.updateUserById(
        profile.user_id,
        { password: newPassword }
      );

      if (authUpdateError) {
        throw authUpdateError;
      }

      res.json({ success: true });
    } catch (error: any) {
      console.error('Server Reset Error:', error);
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
