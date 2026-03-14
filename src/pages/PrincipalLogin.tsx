import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { GraduationCap, Lock, User, ArrowLeft, ShieldCheck, Loader2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';
import { PasswordResetModal } from '../components/PasswordResetModal';
import { supabase } from '../lib/supabase';

export const PrincipalLogin = () => {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showResetModal, setShowResetModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if already logged in
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        
        if (profile && profile.role === 'principal') {
          // Fetch school data
          const { data: school } = await supabase
            .from('schools')
            .select('*')
            .eq('id', profile.school_id)
            .single();
          
          if (school) {
            localStorage.setItem('alakara_current_school', JSON.stringify(school));
            navigate('/principal/dashboard');
          }
        }
      }
    };
    checkSession();
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const sanitizedInput = phone.trim();
      const isEmail = sanitizedInput.includes('@');
      
      // Ensure E.164 format for Supabase Auth if it's a phone number
      const cleanPhone = sanitizedInput.replace(/\s+/g, '');
      const authPhone = cleanPhone.startsWith('+') ? cleanPhone : 
                        cleanPhone.startsWith('0') ? `+254${cleanPhone.substring(1)}` : 
                        `+${cleanPhone}`;
      const isPhone = /^\+?[\d\s-]{10,}$/.test(authPhone);

      // Try Supabase Auth only if it looks like an email or phone
      if (isEmail || isPhone) {
        const { data, error: authError } = await supabase.auth.signInWithPassword(
          isEmail 
            ? { email: sanitizedInput, password } 
            : { phone: authPhone, password }
        );

        if (!authError && data.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();

          if (profile) {
            const { data: school } = await supabase
              .from('schools')
              .select('*')
              .eq('id', profile.school_id)
              .single();

            if (school) {
              localStorage.setItem('alakara_current_school', JSON.stringify(school));
              navigate('/principal/dashboard');
              return;
            }
          }
        }
      }

      // 2. Fallback: Check profiles table for custom credentials
      const { data: customProfile } = await supabase
        .from('profiles')
        .select('*')
        .or(isEmail 
          ? `email.eq.${sanitizedInput}` 
          : `phone.eq.${cleanPhone},phone.eq.${sanitizedInput},email.eq.${sanitizedInput}`
        )
        .eq('password', password)
        .eq('role', 'principal')
        .maybeSingle();

      if (customProfile) {
        const { data: school } = await supabase
          .from('schools')
          .select('*')
          .eq('id', customProfile.school_id)
          .single();

        if (school) {
          localStorage.setItem('alakara_current_school', JSON.stringify(school));
          navigate('/principal/dashboard');
          return;
        }
      }

      setError('Invalid principal credentials or school not registered');
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-kenya-black flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'var(--background-kenya-pattern)', backgroundSize: '60px 60px' }} />
      
      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <Link to="/" className="flex flex-col items-center gap-4 mb-12 group">
          <div className="bg-kenya-green p-4 rounded-2xl group-hover:scale-110 transition-transform shadow-xl shadow-kenya-green/20">
            <GraduationCap className="w-8 h-8 text-white" />
          </div>
          <div className="text-center">
            <span className="text-3xl font-bold text-white tracking-tight">Bora School <span className="text-kenya-red">Principal</span></span>
          </div>
        </Link>
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white py-12 px-6 shadow-2xl rounded-[2.5rem] sm:px-12 border border-white/10"
        >
          <div className="mb-10 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-kenya-black text-white mb-6 shadow-lg">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h2 className="text-3xl font-bold text-kenya-black mb-2">Institution Leadership</h2>
            <p className="text-sm text-gray-500">
              Secure access for school principals and directors.
            </p>
          </div>

          <form className="space-y-6" onSubmit={handleLogin}>
            {error && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-kenya-red/10 border border-kenya-red/20 text-kenya-red px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2"
              >
                {error}
              </motion.div>
            )}

            <div className="space-y-2">
              <label htmlFor="phone" className="block text-sm font-bold text-kenya-black ml-1">
                Principal Phone Number
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="block w-full pl-11 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-kenya-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-kenya-green/20 focus:border-kenya-green transition-all"
                  placeholder="0712345678"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between ml-1">
                <label htmlFor="password" className="block text-sm font-bold text-kenya-black">
                  Access Key
                </label>
                <button 
                  type="button"
                  onClick={() => setShowResetModal(true)}
                  className="text-xs font-medium text-kenya-green hover:underline"
                >
                  Forgot Key?
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-11 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-kenya-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-kenya-green/20 focus:border-kenya-green transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-kenya-black hover:bg-gray-800 text-white py-4 rounded-2xl text-lg font-bold shadow-xl shadow-kenya-black/20 transition-all"
              disabled={isLoading}
            >
              {isLoading ? 'Verifying...' : 'Authorize Access'}
            </Button>
          </form>

          <div className="mt-10 pt-8 border-t border-gray-100">
            <Link
              to="/login"
              className="flex items-center justify-center gap-2 text-sm text-gray-400 hover:text-kenya-black transition-colors font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              Switch Portal
            </Link>
          </div>
        </motion.div>
        
        <PasswordResetModal 
          isOpen={showResetModal} 
          onClose={() => setShowResetModal(false)} 
          role="principal" 
        />

        <p className="mt-8 text-center text-xs text-gray-500 tracking-widest uppercase">
          &copy; 2026 Bora School KE Leadership Portal
        </p>
        <div className="mt-8 text-center text-gray-400 text-sm">
          New to Bora School? <Link to="/register-school" className="text-kenya-green font-bold hover:underline">Register your school here</Link>
        </div>
      </div>
    </div>
  );
};
