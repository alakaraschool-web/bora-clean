import React, { useState } from 'react';
import { motion } from 'motion/react';
import { GraduationCap, Lock, User, ArrowLeft, BookOpen } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';
import { PasswordResetModal } from '../components/PasswordResetModal';
import { ForcePasswordChangeModal } from '../components/ForcePasswordChangeModal';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';

export const TeacherLogin = () => {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showResetModal, setShowResetModal] = useState(false);
  const [showForceChange, setShowForceChange] = useState(false);
  const [pendingProfileId, setPendingProfileId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const auth = getAuth();
      const db = getFirestore();
      
      // Find user by phone
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('phone', '==', phone), where('role', '==', 'teacher'));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        throw new Error('Teacher not found');
      }
      
      const userDoc = querySnapshot.docs[0];
      const userData = userDoc.data();
      
      // Sign in with email
      await signInWithEmailAndPassword(auth, userData.email, password);
      
      if (userData.must_change_password) {
        setPendingProfileId(userDoc.id);
        setShowForceChange(true);
      } else {
        localStorage.setItem('alakara_current_teacher', JSON.stringify(userData));
        navigate('/teacher/dashboard');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
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
