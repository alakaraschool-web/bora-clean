import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { authService } from './src/services/authService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  // API Route to verify student login (ADM + Name)
  app.post('/api/auth/student-login-verify', async (req, res) => {
    try {
      const result = await authService.studentLoginVerify(req.body.admissionNumber, req.body.namePart);
      res.json(result);
    } catch (error: any) {
      console.error('Student Login Verify Error:', error);
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  });

  // API Route to bulk create students
  app.post('/api/auth/bulk-create-students', async (req, res) => {
    try {
      const result = await authService.bulkCreateStudents(req.body.students, req.body.school_id);
      res.json(result);
    } catch (error: any) {
      console.error('Server Bulk Create Error:', error);
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  });

  // API Route to create a user using Service Role Key
  app.post('/api/auth/create-user', async (req, res) => {
    try {
      const result = await authService.createUser(req.body.email, req.body.password, req.body.role, req.body.name, req.body.phone, req.body.school_id, req.body.student_id);
      res.json(result);
    } catch (error: any) {
      console.error('Server Create User Error:', error);
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  });

  // API Route to reset Auth password using Service Role Key
  app.post('/api/auth/reset-password', async (req, res) => {
    try {
      const result = await authService.resetPassword(req.body.profileId, req.body.newPassword);
      res.json(result);
    } catch (error: any) {
      console.error('Server Reset Password Error:', error);
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
