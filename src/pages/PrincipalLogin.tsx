import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { GraduationCap, Lock, User, ArrowLeft, ShieldCheck, Loader2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';
import { PasswordResetModal } from '../components/PasswordResetModal';
import { ForcePasswordChangeModal } from '../components/ForcePasswordChangeModal';
import { supabase } from '../lib/supabase';

export const PrincipalLogin = () => {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showResetModal, setShowResetModal] = useState(false);
  const [showForceChange, setShowForceChange] = useState(false);
  const [pendingProfileId, setPendingProfileId] = useState<string | null>(null);
  const [pendingSchool, setPendingSchool] = useState<any>(null);
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

        if (profile && profile.role === 'principal') {
          console.log('Principal profile found, fetching school data');
          // Fetch school data
          const { data: school, error: schoolError } = await supabase
            .from('schools')
            .select('*')
            .eq('id', profile.school_id)
            .maybeSingle();
          
          if (schoolError) {
            console.error('Error fetching school data:', schoolError);
          }

          if (school) {
            console.log('School data found, navigating to dashboard');
            localStorage.setItem('alakara_current_school', JSON.stringify(school));
            navigate('/principal/dashboard');
          } else {
            console.warn('Principal profile found but school data is missing');
          }
        } else if (profile) {
          console.log('Profile found but role is not principal:', profile.role);
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

    const dummyEmail = `${phone.replace('+', '')}@boraschool.ke`;
    const emailError = null;

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
          .eq('role', 'principal')
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
                    role: 'principal'
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
                  .eq('role', 'principal');
                
                if (updateError) {
                  console.error('Error updating profile with user_id:', updateError);
                }
              } else if (signUpError?.message?.includes('already registered')) {
                // User exists in Auth but password was wrong (since signIn failed)
                throw new Error('Invalid principal credentials. If you recently reset your password, please wait a moment and try again.');
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

        if (profile) {
          console.log('Profile found, fetching school data');
          const { data: school, error: schoolError } = await supabase
            .from('schools')
            .select('*')
            .eq('id', profile.school_id)
            .maybeSingle();

          if (schoolError) {
            console.error('Error fetching school data after auth sign-in:', schoolError);
          }

          if (school) {
            console.log('School data found');
            if (profile.must_change_password) {
              console.log('Password change required');
              setPendingProfileId(profile.id);
              setPendingSchool(school);
              setShowForceChange(true);
              return;
            }
            localStorage.setItem('alakara_current_school', JSON.stringify(school));
            console.log('Navigating to principal dashboard');
            navigate('/principal/dashboard');
            return;
          } else {
            console.warn('Profile found but school data is missing');
          }
        } else {
          console.warn('Auth sign-in successful but profile is missing');
        }
      } else {
        setError('Invalid principal credentials or school not registered');
      }
    } catch (err: any) {
        console.error('Login error:', err);
        setError(err.message || 'An unexpected error occurred during login');
      } finally {
        setIsLoading(false);
        clearTimeout(timeoutId);
      }

  };

  const handleForceChangeSuccess = () => {
    if (pendingSchool) {
      localStorage.setItem('alakara_current_school', JSON.stringify(pendingSchool));
      navigate('/principal/dashboard');
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

        {pendingProfileId && (
          <ForcePasswordChangeModal
            isOpen={showForceChange}
            profileId={pendingProfileId}
            onSuccess={handleForceChangeSuccess}
          />
        )}

        <p className="mt-8 text-center text-xs text-gray-500 tracking-widest uppercase">
          &copy; 2026 Bora School KE Leadership Portal
        </p>
      </div>
    </div>
  );
};
