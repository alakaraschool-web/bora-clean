import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { GraduationCap, Lock, User, ArrowLeft, ShieldAlert, Loader2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';
import { PasswordResetModal } from '../components/PasswordResetModal';
import { ForcePasswordChangeModal } from '../components/ForcePasswordChangeModal';
import { supabase } from '../lib/supabase';

export const SuperAdminLogin = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showResetModal, setShowResetModal] = useState(false);
  const [showForceChange, setShowForceChange] = useState(false);
  const [pendingProfileId, setPendingProfileId] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== passwordConfirm) {
      setError('Passwords do not match');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: username,
        password: password,
        options: { data: { role: 'super-admin', name } }
      });
      if (signUpError) throw signUpError;
      if (data.user) {
        await supabase.from('profiles').insert({
          id: data.user.id,
          user_id: data.user.id,
          email: username,
          role: 'super-admin',
          name: name
        });
        setError('Registration successful. Please log in.');
        setIsRegistering(false);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Check if already logged in as super-admin
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        console.log('Session found, checking profile for super-admin:', session.user.id);
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .or(`id.eq.${session.user.id},user_id.eq.${session.user.id}`)
          .maybeSingle();
        
        if (profileError) {
          console.error('Error fetching profile in checkSession:', profileError);
        }

        if (profile && profile.role === 'super-admin') {
          console.log('Super-admin profile found, navigating to dashboard');
          navigate('/super-admin/dashboard');
        } else if (
          session.user.email?.toLowerCase() === 'bahatisolomon70@gmail.com' || 
          session.user.email?.toLowerCase() === 'admin@boraschool.ke'
        ) {
          console.log('Auto-creating super-admin profile for:', session.user.email);
          // Auto-create profile if missing for super-admin
          await supabase.from('profiles').upsert({
            id: session.user.id,
            user_id: session.user.id,
            name: 'Solomon Isiya',
            email: session.user.email,
            role: 'super-admin'
          });
          navigate('/super-admin/dashboard');
        } else if (profile) {
          console.log('Profile found but role is not super-admin:', profile.role);
        } else {
          console.log('No profile found for session user');
        }
      }
    };
    checkSession();
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Safety timeout to prevent infinite loading state
    const timeoutId = setTimeout(() => {
      if (isLoading) {
        console.warn('Login attempt timed out');
        setIsLoading(false);
        setError('Login attempt timed out. Please try again.');
      }
    }, 15000);

    try {
      const sanitizedInput = username.trim();
      const isEmail = sanitizedInput.includes('@');
      const cleanPhone = sanitizedInput.replace(/\s+/g, '');
      const formattedPhone = cleanPhone.startsWith('+') ? cleanPhone : `+254${cleanPhone.replace(/^0/, '')}`;
      const dummyEmail = isEmail ? sanitizedInput.toLowerCase() : `admin_${cleanPhone}@superadmin.boraschool.ke`;

      // 1. Try Supabase Auth
      console.log('Attempting sign-in for:', isEmail ? sanitizedInput : dummyEmail);
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: isEmail ? sanitizedInput : dummyEmail,
        password: password
      });

      console.log('Auth sign-in result:', { authData, authError });

      if (!authError && authData?.user) {
        const { data: { session } } = await supabase.auth.getSession();
        console.log('Session after sign-in:', session);
        console.log('Auth sign-in successful, fetching profile for:', authData.user.id);
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .or(`id.eq.${authData.user.id},user_id.eq.${authData.user.id}`)
          .maybeSingle();

        if (profileError) {
          console.error('Error fetching profile after auth sign-in:', profileError);
        }

        if (profile && profile.role === 'super-admin') {
          console.log('Super-admin profile found');
          if (profile.must_change_password) {
            console.log('Password change required');
            setPendingProfileId(profile.id);
            setShowForceChange(true);
            return;
          }
          console.log('Navigating to super-admin dashboard');
          navigate('/super-admin/dashboard');
          return;
        }
        
        console.warn('Unauthorized access attempt or missing profile for role super-admin');
        await supabase.auth.signOut();
        throw new Error('Unauthorized access. Only super admins can log in here.');
      }

      // 2. Fallback: Check profiles table directly
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .or(`email.eq.${sanitizedInput.toLowerCase()},phone.eq.${cleanPhone}`)
        .eq('password', password)
        .eq('role', 'super-admin')
        .maybeSingle();

      if (profile) {
        // User exists in profiles but Auth failed, try to sign them up
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: profile.email || dummyEmail,
          password: password,
          options: { data: { role: 'super-admin', phone: profile.phone } }
        });

        if (!signUpError && signUpData.user) {
          await supabase.from('profiles').update({ user_id: signUpData.user.id }).eq('id', profile.id);
          
          if (profile.must_change_password) {
            setPendingProfileId(profile.id);
            setShowForceChange(true);
            return;
          }
          navigate('/super-admin/dashboard');
          return;
        }
      }

      // 3. Hardcoded Bootstrap Login (for initial setup)
      if (
        (sanitizedInput.toLowerCase() === 'admin' || sanitizedInput.toLowerCase() === 'bahatisolomon70@gmail.com') && 
        (password === 'admin123' || (sanitizedInput.toLowerCase() === 'bahatisolomon70@gmail.com' && password === 'Godalways@95'))
      ) {
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('email', sanitizedInput.toLowerCase())
          .maybeSingle();

        if (existingProfile) {
          // Try to sign up if no Auth
          const { data: signUpData } = await supabase.auth.signUp({
            email: sanitizedInput.toLowerCase(),
            password: password,
            options: { data: { role: 'super-admin' } }
          });
          if (signUpData.user) {
            await supabase.from('profiles').update({ user_id: signUpData.user.id }).eq('id', existingProfile.id);
          }
          navigate('/super-admin/dashboard');
        } else {
          // Create profile
          const profileId = crypto.randomUUID();
          await supabase.from('profiles').insert({
            id: profileId,
            email: sanitizedInput.toLowerCase(),
            role: 'super-admin',
            name: 'System Admin',
            password: password,
            must_change_password: true
          });
          setPendingProfileId(profileId);
          setShowForceChange(true);
        }
        return;
      }

      setError('Invalid credentials');
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      clearTimeout(timeoutId);
      setIsLoading(false);
    }
  };

  const handleForceChangeSuccess = () => {
    navigate('/super-admin/dashboard');
  };

  const handleCreatePrototypeAdmin = async () => {
    setIsLoading(true);
    setError('');
    try {
      const email = 'bahatisolomon70@gmail.com';
      const password = 'Godalways@95';
      
      // Check if profile exists
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', email)
        .maybeSingle();

      if (existingProfile) {
        setError('Prototype admin already exists.');
      } else {
        // Sign up
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: email,
          password: password,
          options: { data: { role: 'super-admin' } }
        });
        
        if (signUpError) throw signUpError;
        
        if (signUpData.user) {
          await supabase.from('profiles').insert({
            id: signUpData.user.id,
            user_id: signUpData.user.id,
            email: email,
            role: 'super-admin',
            name: 'Prototype Admin',
            must_change_password: false
          });
          setError('Prototype admin created successfully. Please log in.');
        }
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden font-mono">
      {/* Technical Grid Background */}
      <div className="absolute inset-0 opacity-[0.05] pointer-events-none" 
           style={{ 
             backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', 
             backgroundSize: '40px 40px' 
           }} />
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-kenya-red via-kenya-green to-kenya-red opacity-50" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <Link to="/" className="flex items-center justify-center gap-3 mb-12 group">
          <div className="bg-white/10 p-2 rounded-lg border border-white/20 group-hover:border-kenya-green/50 transition-all">
            <GraduationCap className="w-8 h-8 text-kenya-green" />
          </div>
          <div className="text-left">
            <span className="block text-2xl font-bold text-white tracking-tighter uppercase">Bora School <span className="text-kenya-red">HQ</span></span>
            <span className="block text-[10px] text-kenya-green font-bold tracking-[0.3em] uppercase opacity-70">Central Command</span>
          </div>
        </Link>
        
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-[#151619] py-10 px-6 shadow-2xl sm:rounded-2xl sm:px-10 border border-white/10 relative overflow-hidden"
        >
          {/* Decorative corner accents */}
          <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-kenya-green/30" />
          <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-kenya-green/30" />
          <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-kenya-green/30" />
          <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-kenya-green/30" />

          <div className="mb-10">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-2 h-2 rounded-full bg-kenya-red animate-pulse" />
              <h2 className="text-sm font-bold text-white uppercase tracking-widest">System Authentication</h2>
            </div>
            <p className="text-xs text-gray-500 uppercase tracking-wider">Secure node access required for administrative privileges.</p>
          </div>

          <form className="space-y-6" onSubmit={isRegistering ? handleRegister : handleLogin}>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-kenya-red/10 border border-kenya-red/30 text-kenya-red px-4 py-3 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-3"
              >
                <ShieldAlert className="w-4 h-4" />
                {error}
              </motion.div>
            )}

            {isRegistering && (
              <div>
                <label htmlFor="name" className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <User className="h-4 w-4 text-kenya-green" />
                  </div>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="block w-full pl-11 pr-4 py-3 bg-black/40 border border-white/10 rounded-lg text-white placeholder-gray-700 focus:outline-none focus:ring-1 focus:ring-kenya-green focus:border-kenya-green transition-all text-sm"
                    placeholder="John Doe"
                  />
                </div>
              </div>
            )}

            <div>
              <label htmlFor="username" className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                {isRegistering ? 'Email Address' : 'Operator ID'}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User className="h-4 w-4 text-kenya-green" />
                </div>
                <input
                  id="username"
                  name="username"
                  type={isRegistering ? 'email' : 'text'}
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="block w-full pl-11 pr-4 py-3 bg-black/40 border border-white/10 rounded-lg text-white placeholder-gray-700 focus:outline-none focus:ring-1 focus:ring-kenya-green focus:border-kenya-green transition-all text-sm"
                  placeholder={isRegistering ? 'admin@boraschool.ke' : 'ADMIN_01'}
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                Access Key
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-kenya-green" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-11 pr-4 py-3 bg-black/40 border border-white/10 rounded-lg text-white placeholder-gray-700 focus:outline-none focus:ring-1 focus:ring-kenya-green focus:border-kenya-green transition-all text-sm"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {isRegistering && (
              <div>
                <label htmlFor="passwordConfirm" className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                  Confirm Access Key
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-kenya-green" />
                  </div>
                  <input
                    id="passwordConfirm"
                    name="passwordConfirm"
                    type="password"
                    required
                    value={passwordConfirm}
                    onChange={(e) => setPasswordConfirm(e.target.value)}
                    className="block w-full pl-11 pr-4 py-3 bg-black/40 border border-white/10 rounded-lg text-white placeholder-gray-700 focus:outline-none focus:ring-1 focus:ring-kenya-green focus:border-kenya-green transition-all text-sm"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : (isRegistering ? 'Register' : 'Authenticate')}
            </Button>
            
            <button 
              type="button"
              onClick={() => setIsRegistering(!isRegistering)}
              className="w-full text-center text-[10px] text-gray-500 hover:text-white uppercase tracking-widest transition-colors"
            >
              {isRegistering ? 'Back to Login' : 'Register New Super Admin'}
            </button>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <button 
                  type="button"
                  onClick={() => setShowResetModal(true)}
                  className="font-bold text-kenya-red hover:text-red-400 uppercase tracking-wider"
                >
                  Reset Key
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-kenya-green hover:bg-green-600 text-black font-bold uppercase tracking-[0.2em] text-xs py-4 rounded-lg shadow-[0_0_20px_rgba(0,255,0,0.1)]"
              disabled={isLoading}
            >
              {isLoading ? 'Decrypting...' : 'Initialize Session'}
            </Button>

            <Button
              type="button"
              onClick={handleCreatePrototypeAdmin}
              className="w-full bg-white/10 hover:bg-white/20 text-white font-bold uppercase tracking-[0.2em] text-xs py-4 rounded-lg"
              disabled={isLoading}
            >
              Create Prototype Admin
            </Button>
          </form>

          <div className="mt-10 pt-6 border-t border-white/5">
            <Link
              to="/"
              className="flex items-center justify-center gap-2 text-[10px] font-bold text-gray-600 hover:text-kenya-green uppercase tracking-widest transition-colors"
            >
              <ArrowLeft className="w-3 h-3" />
              Return to Surface
            </Link>
          </div>
        </motion.div>
        
        <PasswordResetModal 
          isOpen={showResetModal} 
          onClose={() => setShowResetModal(false)} 
          role="super-admin" 
        />

        {pendingProfileId && (
          <ForcePasswordChangeModal
            isOpen={showForceChange}
            profileId={pendingProfileId}
            onSuccess={handleForceChangeSuccess}
          />
        )}

        <div className="mt-8 flex justify-between items-center px-2">
          <p className="text-[9px] text-gray-600 uppercase tracking-[0.3em]">
            &copy; 2026 Bora School KE HQ
          </p>
          <div className="flex gap-4">
            <div className="w-1 h-1 rounded-full bg-kenya-green opacity-50" />
            <div className="w-1 h-1 rounded-full bg-kenya-red opacity-50" />
            <div className="w-1 h-1 rounded-full bg-white opacity-50" />
          </div>
        </div>
      </div>
    </div>
  );
};
