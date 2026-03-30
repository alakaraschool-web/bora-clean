import React, { useState } from 'react';
import { motion } from 'motion/react';
import { GraduationCap, Lock, User, ArrowLeft, Rocket } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';
import { PasswordResetModal } from '../components/PasswordResetModal';
import { ForcePasswordChangeModal } from '../components/ForcePasswordChangeModal';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';

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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const auth = getAuth();
      const db = getFirestore();
      
      const sanitizedInput = username.trim();
      let studentData: any = null;
      let userEmail = '';

      // 1. Try student-login-verify first if it looks like an ADM number
      const isAdm = sanitizedInput.includes('-') || sanitizedInput.length > 5;
      if (isAdm) {
        try {
          const verifyResponse = await fetch('/api/auth/student-login-verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              admissionNumber: sanitizedInput,
              namePart: password
            })
          });

          const verifyData = await verifyResponse.json();

          if (verifyResponse.ok && verifyData.success) {
            userEmail = verifyData.email;
            // Sign in with email and password from verifyData
            await signInWithEmailAndPassword(auth, verifyData.email, verifyData.password);
            
            // Fetch student data
            const usersRef = collection(db, 'users');
            const q = query(usersRef, where('email', '==', verifyData.email));
            const querySnapshot = await getDocs(q);
            if (!querySnapshot.empty) {
              const userDoc = querySnapshot.docs[0];
              const userData = userDoc.data();
              const studentDoc = await getDoc(doc(db, 'students', userData.student_id || userDoc.id));
              if (studentDoc.exists()) {
                studentData = studentDoc.data();
              }
            }
          }
        } catch (err) {
          console.warn('Student verify failed, falling back to standard login:', err);
        }
      }

      // 2. Standard Auth sign-in if not already logged in
      if (!studentData) {
        // Find user by username/email
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('username', '==', sanitizedInput), where('role', '==', 'student'));
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
          throw new Error('Student not found');
        }
        
        const userDoc = querySnapshot.docs[0];
        const userData = userDoc.data();
        userEmail = userData.email;
        
        // Sign in with email
        await signInWithEmailAndPassword(auth, userEmail, password);
        
        // Fetch student data
        const studentDoc = await getDoc(doc(db, 'students', userData.student_id || userDoc.id));
        if (studentDoc.exists()) {
          studentData = studentDoc.data();
        }
      }

      if (studentData) {
        // Check for password change
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('email', '==', userEmail));
        const querySnapshot = await getDocs(q);
        const userDoc = querySnapshot.docs[0];
        const userData = userDoc.data();

        if (userData.must_change_password) {
          setPendingProfileId(userDoc.id);
          setPendingStudent(studentData);
          setShowForceChange(true);
          return;
        }
        localStorage.setItem('alakara_current_student', JSON.stringify(studentData));
        navigate('/student/dashboard');
      } else {
        throw new Error('Invalid student credentials');
      }
    } catch (err: any) {
      setError(err.message);
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
                  placeholder="e.g. ADM-2024-001"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label htmlFor="password" className="block text-xs font-black text-black uppercase tracking-widest">
                Your Name (First or Last)
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
                  placeholder="Enter either of your names"
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
