import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { GraduationCap, Lock, User, ArrowLeft, BookOpen, Loader2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';
import { PasswordResetModal } from '../components/PasswordResetModal';
import { ForcePasswordChangeModal } from '../components/ForcePasswordChangeModal';
import { supabase } from '../lib/supabase';

export const TeacherLogin = () => {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showResetModal, setShowResetModal] = useState(false);
  const [showForceChange, setShowForceChange] = useState(false);
  const [pendingProfileId, setPendingProfileId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // Check if already logged in
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        console.log('Session found, checking profile for user:', session.user.id);
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .or(`id.eq.${session.user.id},user_id.eq.${session.user.id}`)
          .maybeSingle();
        
        if (profileError) {
          console.error('Error fetching profile in checkSession:', profileError);
        }

        if (profile && profile.role === 'teacher') {
          console.log('Teacher profile found, navigating to dashboard');
          localStorage.setItem('alakara_current_teacher', JSON.stringify(profile));
          navigate('/teacher/dashboard');
        } else if (profile) {
          console.log('Profile found but role is not teacher:', profile.role);
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
      const sanitizedInput = phone.trim();
      const cleanPhone = sanitizedInput.replace(/\s+/g, '');
      
      // Try Supabase Auth directly with phone
      const formattedPhone = cleanPhone.startsWith('+') ? cleanPhone : `+254${cleanPhone.replace(/^0/, '')}`;
      let { data, error: authError } = await supabase.auth.signInWithPassword({
        phone: formattedPhone,
        password
      });

      if (authError) {
        // If Auth fails, check if the user exists in profiles
        // but don't log them in without a session.
        const { data: profileExists } = await supabase
          .from('profiles')
          .select('id, password, role')
          .eq('phone', cleanPhone)
          .eq('role', 'teacher')
          .maybeSingle();

          if (profileExists && profileExists.password === password) {
            // User exists in profiles but Auth failed (likely password mismatch after reset)
            // Try to sync Auth password via server-side API
            try {
              const syncResponse = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ profileId: profileExists.id, newPassword: password })
              });

              const text = await syncResponse.text();
              let syncData;
              try {
                syncData = text ? JSON.parse(text) : {};
              } catch (e) {
                console.error('Invalid JSON response:', text);
                throw new Error('Server returned invalid JSON');
              }

              if (!syncResponse.ok) {
                throw new Error(syncData.error || 'Request failed');
              }
                // Sync successful, try to sign in again
                const { data: retryAuth, error: retryError } = await supabase.auth.signInWithPassword({
                  email: dummyEmail,
                  password: password
                });
                
                if (!retryError && retryAuth.user) {
                  data = { user: retryAuth.user, session: retryAuth.session };
                  authError = null;
                }
            } catch (syncErr) {
              console.error('Auth sync failed:', syncErr);
            }

            if (authError) {
              // If sync failed or still can't login, try signUp as fallback (if not already registered)
              const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
                email: dummyEmail,
                password: password,
                options: {
                  data: {
                    role: 'teacher'
                  }
                }
              });

              if (!signUpError && signUpData.user) {
                data = { user: signUpData.user, session: signUpData.session };
                authError = null;
                
                // Update the profile with the new user_id if it's different
                console.log('Updating profile with new user_id:', signUpData.user.id);
                const { error: updateError } = await supabase
                  .from('profiles')
                  .update({ user_id: signUpData.user.id })
                  .eq('phone', cleanPhone)
                  .eq('role', 'teacher');
                
                if (updateError) {
                  console.error('Error updating profile with user_id:', updateError);
                }
              } else if (signUpError?.message?.includes('already registered')) {
                // User exists in Auth but password was wrong (since signIn failed)
                throw new Error('Invalid teacher credentials. If you recently reset your password, please wait a moment and try again.');
              } else {
                throw authError || emailError;
              }
            }
          } else {
            throw authError || emailError;
          }
        }

      if (!authError && data.user) {
        console.log('Auth sign-in successful, fetching profile for:', data.user.id);
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .or(`id.eq.${data.user.id},user_id.eq.${data.user.id}`)
          .maybeSingle();

        if (profileError) {
          console.error('Error fetching profile after auth sign-in:', profileError);
        }

        if (profile && profile.role === 'teacher') {
          console.log('Teacher profile found');
          if (profile.must_change_password) {
            console.log('Password change required');
            setPendingProfileId(profile.id);
            setShowForceChange(true);
            return;
          }
          localStorage.setItem('alakara_current_teacher', JSON.stringify(profile));
          console.log('Navigating to teacher dashboard');
          navigate('/teacher/dashboard');
          return;
        }
        
        console.warn('Unauthorized access attempt or missing profile for role teacher');
        await supabase.auth.signOut();
        throw new Error('Unauthorized access. Only teachers can log in here.');
      }

      setError('Invalid teacher credentials');
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'An unexpected error occurred during login');
    } finally {
      clearTimeout(timeoutId);
      setIsLoading(false);
    }
  };

  const handleForceChangeSuccess = () => {
    navigate('/teacher/dashboard');
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

        {pendingProfileId && (
          <ForcePasswordChangeModal
            isOpen={showForceChange}
            profileId={pendingProfileId}
            onSuccess={handleForceChangeSuccess}
          />
        )}

        <p className="mt-12 text-center text-xs text-gray-400 tracking-widest uppercase">
          &copy; 2026 Bora School KE Educators
        </p>
      </div>
    </div>
  );
};
