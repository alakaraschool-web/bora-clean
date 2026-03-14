import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { GraduationCap, Lock, User, ArrowLeft, BookOpen, Loader2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';
import { PasswordResetModal } from '../components/PasswordResetModal';
import { supabase } from '../lib/supabase';

export const TeacherLogin = () => {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [pendingTeacher, setPendingTeacher] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
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
        
        if (profile && profile.role === 'teacher') {
          localStorage.setItem('alakara_current_teacher', JSON.stringify(profile));
          navigate('/teacher/dashboard');
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

          if (profile && profile.role === 'teacher') {
            localStorage.setItem('alakara_current_teacher', JSON.stringify(profile));
            navigate('/teacher/dashboard');
            return;
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
        .eq('role', 'teacher')
        .maybeSingle();

      if (customProfile) {
        localStorage.setItem('alakara_current_teacher', JSON.stringify(customProfile));
        navigate('/teacher/dashboard');
        return;
      }

      setError('Invalid teacher credentials');
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      const staff = JSON.parse(localStorage.getItem('alakara_staff') || '[]');
      const updatedStaff = staff.map((s: any) => 
        s.id === pendingTeacher.id 
          ? { ...s, password: newPassword, mustChangePassword: false } 
          : s
      );
      localStorage.setItem('alakara_staff', JSON.stringify(updatedStaff));
      
      const updatedTeacher = { ...pendingTeacher, password: newPassword, mustChangePassword: false };
      localStorage.setItem('alakara_current_teacher', JSON.stringify(updatedTeacher));
      
      setIsLoading(false);
      navigate('/teacher/dashboard');
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-[#f5f5f0] flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden font-serif">
      {/* Organic Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none -z-10">
        <div className="absolute top-[10%] left-[10%] w-64 h-64 bg-kenya-green/5 rounded-full blur-3xl" />
        <div className="absolute bottom-[10%] right-[10%] w-64 h-64 bg-kenya-red/5 rounded-full blur-3xl" />
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link to="/" className="flex flex-col items-center gap-4 mb-12 group">
          <div className="bg-[#5A5A40] p-4 rounded-full group-hover:scale-110 transition-transform shadow-lg">
            <GraduationCap className="w-8 h-8 text-white" />
          </div>
          <div className="text-center">
            <span className="text-3xl font-bold text-[#1a1a1a] tracking-tight">Bora School <span className="italic text-[#5A5A40]">Educators</span></span>
          </div>
        </Link>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white py-12 px-6 shadow-xl rounded-[2rem] sm:px-12 border border-[#e5e5df]"
        >
          {!showPasswordChange ? (
            <>
              <div className="mb-10 text-center">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[#5A5A40]/10 text-[#5A5A40] mb-6">
                  <BookOpen className="w-7 h-7" />
                </div>
                <h2 className="text-3xl font-bold text-[#1a1a1a] mb-2">Welcome Back, Teacher</h2>
                <p className="text-sm text-gray-500 italic">
                  "Education is the most powerful weapon which you can use to change the world."
                </p>
              </div>

              <form className="space-y-8" onSubmit={handleLogin}>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-sm italic flex items-center gap-2"
                  >
                    {error}
                  </motion.div>
                )}

                <div className="space-y-2">
                  <label htmlFor="phone" className="block text-sm font-medium text-[#5A5A40] ml-1">
                    Teacher Phone Number
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-[#5A5A40]/40" />
                    </div>
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="block w-full pl-11 pr-4 py-4 border border-[#e5e5df] rounded-2xl text-[#1a1a1a] placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#5A5A40]/20 focus:border-[#5A5A40] transition-all bg-[#fcfcfb]"
                      placeholder="0712345678"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="password" className="block text-sm font-medium text-[#5A5A40] ml-1">
                    Security Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-[#5A5A40]/40" />
                    </div>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="block w-full pl-11 pr-4 py-4 border border-[#e5e5df] rounded-2xl text-[#1a1a1a] placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#5A5A40]/20 focus:border-[#5A5A40] transition-all bg-[#fcfcfb]"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center">
                    <input
                      id="remember-me"
                      name="remember-me"
                      type="checkbox"
                      className="h-4 w-4 text-[#5A5A40] focus:ring-[#5A5A40] border-gray-300 rounded-full"
                    />
                    <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-600">
                      Keep me signed in
                    </label>
                  </div>

                  <div className="text-sm">
                    <button 
                      type="button"
                      onClick={() => setShowResetModal(true)}
                      className="font-medium text-[#5A5A40] hover:underline underline-offset-4"
                    >
                      Forgot password?
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-[#5A5A40] hover:bg-[#4a4a34] text-white py-4 rounded-full text-lg shadow-lg shadow-[#5A5A40]/20 transition-all"
                  disabled={isLoading}
                >
                  {isLoading ? 'Connecting...' : 'Enter Faculty Portal'}
                </Button>
              </form>
            </>
          ) : (
            <>
              <div className="mb-10 text-center">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-amber-50 text-amber-600 mb-6">
                  <Lock className="w-7 h-7" />
                </div>
                <h2 className="text-3xl font-bold text-[#1a1a1a] mb-2">Security Update</h2>
                <p className="text-sm text-gray-500 italic">
                  This is your first login. Please set a new secure password to protect your account.
                </p>
              </div>

              <form className="space-y-8" onSubmit={handlePasswordChange}>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-sm italic flex items-center gap-2"
                  >
                    {error}
                  </motion.div>
                )}

                <div className="space-y-2">
                  <label htmlFor="newPassword" className="block text-sm font-medium text-[#5A5A40] ml-1">
                    New Secure Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-[#5A5A40]/40" />
                    </div>
                    <input
                      id="newPassword"
                      name="newPassword"
                      type="password"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="block w-full pl-11 pr-4 py-4 border border-[#e5e5df] rounded-2xl text-[#1a1a1a] placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#5A5A40]/20 focus:border-[#5A5A40] transition-all bg-[#fcfcfb]"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-[#5A5A40] ml-1">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-[#5A5A40]/40" />
                    </div>
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="block w-full pl-11 pr-4 py-4 border border-[#e5e5df] rounded-2xl text-[#1a1a1a] placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#5A5A40]/20 focus:border-[#5A5A40] transition-all bg-[#fcfcfb]"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-[#5A5A40] hover:bg-[#4a4a34] text-white py-4 rounded-full text-lg shadow-lg shadow-[#5A5A40]/20 transition-all"
                  disabled={isLoading}
                >
                  {isLoading ? 'Updating...' : 'Update & Continue'}
                </Button>
              </form>
            </>
          )}

          <div className="mt-12 pt-8 border-t border-[#f5f5f0]">
            <Link
              to="/"
              className="flex items-center justify-center gap-2 text-sm text-gray-400 hover:text-[#5A5A40] transition-colors italic"
            >
              <ArrowLeft className="w-4 h-4" />
              Return to Main Campus
            </Link>
          </div>
        </motion.div>
        
        <PasswordResetModal 
          isOpen={showResetModal} 
          onClose={() => setShowResetModal(false)} 
          role="teacher" 
        />

        <p className="mt-12 text-center text-xs text-gray-400 tracking-widest uppercase">
          &copy; 2026 Bora School KE Educators
        </p>
      </div>
    </div>
  );
};
