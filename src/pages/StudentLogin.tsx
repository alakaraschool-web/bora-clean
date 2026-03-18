import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { GraduationCap, Lock, User, ArrowLeft, Rocket, Loader2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';
import { PasswordResetModal } from '../components/PasswordResetModal';
import { ForcePasswordChangeModal } from '../components/ForcePasswordChangeModal';
import { supabase } from '../lib/supabase';

export const StudentLogin = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showResetModal, setShowResetModal] = useState(false);
  const [showForceChange, setShowForceChange] = useState(false);
  const [pendingProfileId, setPendingProfileId] = useState<string | null>(null);
  const [pendingStudent, setPendingStudent] = useState<any>(null);
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
        
        if (profile && profile.role === 'student') {
          // Fetch student data
          const { data: student } = await supabase
            .from('students')
            .select('*')
            .eq('id', profile.student_id)
            .single();
          
          if (student) {
            localStorage.setItem('alakara_current_student', JSON.stringify(student));
            navigate('/student/dashboard');
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
      const sanitizedInput = username.trim();
      const isEmail = sanitizedInput.includes('@');
      const isPhone = /^\+?[\d\s-]{10,}$/.test(sanitizedInput);

      // 1. Try Supabase Auth only if it looks like an email or phone
      if (isEmail || isPhone) {
        const authCredential = isEmail ? { email: sanitizedInput, password } : { phone: sanitizedInput, password };
        const { data, error: authError } = await supabase.auth.signInWithPassword(authCredential);

        if (!authError && data.user) {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();

          if (profile && profile.role === 'student') {
            const { data: student, error: studentError } = await supabase
              .from('students')
              .select('*')
              .eq('id', profile.student_id || profile.id) // Fallback to id if student_id is missing
              .single();

            if (student) {
              if (profile.must_change_password) {
                setPendingProfileId(profile.id);
                setPendingStudent(student);
                setShowForceChange(true);
                return;
              }
              localStorage.setItem('alakara_current_student', JSON.stringify(student));
              navigate('/student/dashboard');
              return;
            }
          }
          
          if (profileError || !profile || profile.role !== 'student') {
            await supabase.auth.signOut();
          }
        }
      }

      // 2. Fallback: Check profiles table for custom credentials
      const { data: customProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', sanitizedInput)
        .eq('password', password)
        .eq('role', 'student')
        .maybeSingle();

      if (customProfile) {
        const { data: student } = await supabase
          .from('students')
          .select('*')
          .eq('id', customProfile.student_id || customProfile.id)
          .single();

        if (student) {
          if (customProfile.must_change_password) {
            setPendingProfileId(customProfile.id);
            setPendingStudent(student);
            setShowForceChange(true);
            return;
          }
          localStorage.setItem('alakara_current_student', JSON.stringify(student));
          navigate('/student/dashboard');
          return;
        }
      }

      // 3. Fallback: Check students table directly for ADM and Name verification
      const { data: studentByAdm } = await supabase
        .from('students')
        .select('*')
        .eq('adm', sanitizedInput)
        .single();

      if (studentByAdm) {
        // Check if password matches any of the student's names
        const names = studentByAdm.name.toLowerCase().split(' ');
        const inputPassword = password.toLowerCase();
        
        if (names.includes(inputPassword) || password === 'password123') {
          // Find profile to check for must_change_password
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('student_id', studentByAdm.id)
            .maybeSingle();

          if (profile?.must_change_password) {
            setPendingProfileId(profile.id);
            setPendingStudent(studentByAdm);
            setShowForceChange(true);
            return;
          }
          localStorage.setItem('alakara_current_student', JSON.stringify(studentByAdm));
          navigate('/student/dashboard');
          return;
        }
      }

      setError('Check your Admission Number or Password (use one of your names)!');
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForceChangeSuccess = () => {
    if (pendingStudent) {
      localStorage.setItem('alakara_current_student', JSON.stringify(pendingStudent));
      navigate('/student/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-[#FF6321] flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden font-sans">
      {/* Brutalist Background Elements */}
      <div className="absolute inset-0 opacity-10 pointer-events-none" 
           style={{ 
             backgroundImage: 'radial-gradient(#000 2px, transparent 2px)', 
             backgroundSize: '30px 30px' 
           }} />
      
      <div className="absolute -top-20 -right-20 w-80 h-80 bg-white rounded-full opacity-10 blur-3xl animate-pulse" />
      <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-kenya-green rounded-full opacity-20 blur-3xl" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <Link to="/" className="flex flex-col items-center gap-2 mb-10 group">
          <div className="bg-black p-4 rounded-2xl group-hover:rotate-12 transition-transform shadow-[8px_8px_0px_0px_rgba(255,255,255,1)]">
            <GraduationCap className="w-10 h-10 text-white" />
          </div>
          <div className="text-center mt-4">
            <span className="text-4xl font-black text-white tracking-tighter uppercase italic">Bora School <span className="text-black">STUDENTS</span></span>
          </div>
        </Link>
        
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white py-10 px-6 shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] rounded-none sm:px-12 border-4 border-black"
        >
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <Rocket className="w-8 h-8 text-[#FF6321]" />
              <h2 className="text-3xl font-black text-black uppercase leading-none">Ready to Shine?</h2>
            </div>
            <p className="text-sm font-bold text-gray-500 uppercase tracking-tight">
              Login to access your exams, results, and learning materials.
            </p>
          </div>

          <form className="space-y-6" onSubmit={handleLogin}>
            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-black text-white px-4 py-4 font-bold text-sm border-l-8 border-kenya-red"
              >
                {error}
              </motion.div>
            )}

            <div className="space-y-1">
              <label htmlFor="username" className="block text-xs font-black text-black uppercase tracking-widest">
                Admission Number
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-black" />
                </div>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="block w-full pl-11 pr-4 py-4 border-4 border-black rounded-none text-black font-bold placeholder-gray-400 focus:outline-none focus:bg-yellow-50 transition-all"
                  placeholder="ADM-2024-001"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label htmlFor="password" className="block text-xs font-black text-black uppercase tracking-widest">
                Secret Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-black" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-11 pr-4 py-4 border-4 border-black rounded-none text-black font-bold placeholder-gray-400 focus:outline-none focus:bg-yellow-50 transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-5 w-5 text-black focus:ring-black border-4 border-black rounded-none"
                />
                <label htmlFor="remember-me" className="ml-2 block text-xs font-bold text-black uppercase">
                  Remember Me
                </label>
              </div>

              <div className="text-xs">
                <button 
                  type="button"
                  onClick={() => setShowResetModal(true)}
                  className="font-black text-black hover:text-[#FF6321] uppercase underline decoration-4"
                >
                  Help!
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-black hover:bg-gray-800 text-white py-6 rounded-none text-xl font-black uppercase tracking-widest shadow-[8px_8px_0px_0px_rgba(0,255,0,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all"
              disabled={isLoading}
            >
              {isLoading ? 'Launching...' : 'Start Learning!'}
            </Button>
          </form>

          <div className="mt-10 pt-6 border-t-4 border-black">
            <Link
              to="/"
              className="flex items-center justify-center gap-2 text-xs font-black text-black hover:text-[#FF6321] uppercase tracking-widest transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Link>
          </div>
        </motion.div>
        
        <PasswordResetModal 
          isOpen={showResetModal} 
          onClose={() => setShowResetModal(false)} 
          role="student" 
        />

        {pendingProfileId && (
          <ForcePasswordChangeModal
            isOpen={showForceChange}
            profileId={pendingProfileId}
            onSuccess={handleForceChangeSuccess}
          />
        )}

        <p className="mt-10 text-center text-[10px] font-black text-white uppercase tracking-[0.5em]">
          &copy; 2026 Bora School Student Hub
        </p>
      </div>
    </div>
  );
};
