import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Supabase Admin client
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());
  
  app.use((req, res, next) => {
    console.log(`[Request] ${req.method} ${req.url}`);
    next();
  });

  console.log(`[API] NODE_ENV is: ${process.env.NODE_ENV}`);
  
  // API Routes
  app.all('/api/*', (req, res, next) => {
    console.log(`[API] Path hit: ${req.method} ${req.url}`);
    next();
  });

  app.post('/api/auth/create-user', async (req, res) => {
    console.log('[API] /api/auth/create-user called');
    const { email, password, role, name, phone, school_id } = req.body;
    
    try {
      console.log('[API] Processing user creation for:', email);
      
      if (!supabaseAdmin) {
        throw new Error('Supabase admin not initialized');
      }

      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { role, name, phone, school_id }
      });

      console.log('[API] Create user response data:', data ? 'Success' : 'No data');
      if (error) {
        console.error('[API] Supabase Admin create user error:', error);
        throw error;
      }
      
      res.json({ user: data.user });
    } catch (e: any) {
      console.error('[API] Error in /api/auth/create-user:', e.message);
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/auth/bulk-create-students', async (req, res) => {
    const { students, school_id } = req.body;
    
    try {
      const { data: school, error: schoolError } = await supabaseAdmin
        .from('schools')
        .select('name')
        .eq('id', school_id)
        .single();

      if (schoolError || !school) throw new Error('School not found');

      const schoolNameHandle = school.name.toLowerCase().replace(/[^a-z0-9]/g, '');

      const results = { success: [] as any[], failed: [] as any[] };
      
      for (const student of students) {
         try {
           const studentPhone = `+254${student.admission_number.toLowerCase().replace(/[^0-9]/g, '').padStart(9, '0').slice(-9)}`;
           const studentNameHandle = student.name.toLowerCase().replace(/[^a-z0-9]/g, '');
           const dummyEmail = `${studentNameHandle}_${student.admission_number.toLowerCase()}@${schoolNameHandle}.ac.ke`;
           const password = 'password123';
           
           const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
             email: dummyEmail,
             password: password,
             email_confirm: true,
             user_metadata: { role: 'student', name: student.name, phone: studentPhone, school_id }
           });
           
           if(authError) throw authError;

           const { data: studentRecord, error: studentError } = await supabaseAdmin.from('students').upsert({
             id: authData.user.id,
             name: student.name,
             admission_number: student.admission_number,
             class: student.class,
             gender: student.gender,
             upi_no: student.upi_no,
             kpsea_no: student.kpsea_no,
             dob: student.dob || null,
             admission_date: student.admission_date || null,
             parent_name: student.parent_name,
             parent_phone: student.parent_phone,
             house: student.house,
             status: 'Active',
             school_id: school_id
           }).select().single();
           
           if(studentError) throw studentError;
           
           await supabaseAdmin.from('profiles').upsert({
             id: authData.user.id,
             student_id: studentRecord.id,
             role: 'student',
             name: student.name,
             school_id: school_id,
             phone: studentPhone
           });
           
           results.success.push(studentRecord);
         } catch (e: any) {
           results.failed.push({ student: student.name, error: e.message });
         }
      }
      res.json(results);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
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
