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

  app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
  });

  const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });




  // API Route to create a user using Service Role Key
  app.post('/api/auth/create-user', async (req, res) => {
    try {
      const { email, password, role, name, phone, school_id, student_id } = req.body;

      if (!email || !password || !role || !name || !school_id) {
        return res.status(400).json({ success: false, error: 'Missing required fields' });
      }

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

      return res.json({ success: true, user: authData.user });
    } catch (error: any) {
      console.error('Server Create User Error:', error);
      return res.status(500).json({ success: false, error: error.message || 'Internal server error' });
    }
  });

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
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
