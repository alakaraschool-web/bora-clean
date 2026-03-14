import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Mail, Lock, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import { Button } from './Button';

interface PasswordResetModalProps {
  isOpen: boolean;
  onClose: () => void;
  role: 'student' | 'teacher' | 'principal' | 'super-admin';
}

export const PasswordResetModal: React.FC<PasswordResetModalProps> = ({ isOpen, onClose, role }) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [identifier, setIdentifier] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleIdentify = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    setTimeout(() => {
      let found = false;
      if (role === 'student') {
        const students = JSON.parse(localStorage.getItem('alakara_students') || '[]');
        found = students.some((s: any) => s.adm === identifier);
        if (identifier === 'student') found = true;
      } else if (role === 'teacher') {
        const staff = JSON.parse(localStorage.getItem('alakara_staff') || '[]');
        found = staff.some((s: any) => s.username === identifier || s.email === identifier);
        if (identifier === 'teacher' || identifier === 'teacher@bora.ke') found = true;
      } else if (role === 'principal') {
        const schools = JSON.parse(localStorage.getItem('alakara_schools') || '[]');
        found = schools.some((s: any) => s.principalEmail === identifier);
      } else if (role === 'super-admin') {
        found = identifier === 'admin';
      }

      if (found) {
        setStep(2);
      } else {
        setError(`Account with this ${role === 'student' ? 'Admission Number' : 'Email/ID'} not found.`);
      }
      setIsLoading(false);
    }, 1000);
  };

  const handleReset = (e: React.FormEvent) => {
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
      if (role === 'student') {
        const students = JSON.parse(localStorage.getItem('alakara_students') || '[]');
        const updated = students.map((s: any) => s.adm === identifier ? { ...s, password: newPassword } : s);
        localStorage.setItem('alakara_students', JSON.stringify(updated));
      } else if (role === 'teacher') {
        const staff = JSON.parse(localStorage.getItem('alakara_staff') || '[]');
        const updated = staff.map((s: any) => (s.username === identifier || s.email === identifier) ? { ...s, password: newPassword } : s);
        localStorage.setItem('alakara_staff', JSON.stringify(updated));
      } else if (role === 'principal') {
        const schools = JSON.parse(localStorage.getItem('alakara_schools') || '[]');
        const updated = schools.map((s: any) => s.principalEmail === identifier ? { ...s, principalPass: newPassword } : s);
        localStorage.setItem('alakara_schools', JSON.stringify(updated));
      }
      // Super admin is hardcoded in this demo, so we don't persist it to localStorage in a real way here
      
      setStep(3);
      setIsLoading(false);
    }, 1000);
  };

  const resetState = () => {
    setStep(1);
    setIdentifier('');
    setNewPassword('');
    setConfirmPassword('');
    setError('');
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white rounded-[2.5rem] w-full max-w-md p-8 shadow-2xl border border-gray-100 relative overflow-hidden"
          >
            <button 
              onClick={handleClose}
              className="absolute top-6 right-6 p-2 hover:bg-gray-100 rounded-full transition-colors z-10"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>

            {step === 1 && (
              <div className="space-y-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-kenya-green/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Mail className="w-8 h-8 text-kenya-green" />
                  </div>
                  <h3 className="text-2xl font-bold text-kenya-black">Reset Password</h3>
                  <p className="text-sm text-gray-500 mt-2">Enter your account identifier to continue.</p>
                </div>

                <form onSubmit={handleIdentify} className="space-y-4">
                  {error && (
                    <div className="p-3 bg-red-50 border border-red-100 text-red-600 rounded-xl text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      {error}
                    </div>
                  )}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-kenya-black uppercase ml-1">
                      {role === 'student' ? 'Admission Number' : 'Email or Username'}
                    </label>
                    <input
                      type="text"
                      required
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-kenya-green/20"
                      placeholder={role === 'student' ? 'e.g. ADM-2024-001' : 'e.g. user@school.ac.ke'}
                    />
                  </div>
                  <Button type="submit" className="w-full py-4 rounded-xl font-bold" disabled={isLoading}>
                    {isLoading ? 'Verifying...' : 'Verify Account'}
                  </Button>
                </form>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Lock className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-kenya-black">New Password</h3>
                  <p className="text-sm text-gray-500 mt-2">Set a secure password for your account.</p>
                </div>

                <form onSubmit={handleReset} className="space-y-4">
                  {error && (
                    <div className="p-3 bg-red-50 border border-red-100 text-red-600 rounded-xl text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      {error}
                    </div>
                  )}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-kenya-black uppercase ml-1">New Password</label>
                    <input
                      type="password"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-kenya-green/20"
                      placeholder="••••••••"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-kenya-black uppercase ml-1">Confirm Password</label>
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-kenya-green/20"
                      placeholder="••••••••"
                    />
                  </div>
                  <Button type="submit" className="w-full py-4 rounded-xl font-bold" disabled={isLoading}>
                    {isLoading ? 'Updating...' : 'Reset Password'}
                  </Button>
                </form>
              </div>
            )}

            {step === 3 && (
              <div className="text-center py-8">
                <div className="w-20 h-20 bg-kenya-green/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 className="w-10 h-10 text-kenya-green" />
                </div>
                <h3 className="text-2xl font-bold text-kenya-black mb-2">Password Reset!</h3>
                <p className="text-gray-500 mb-8">Your security credentials have been successfully updated.</p>
                <Button onClick={handleClose} className="w-full py-4 rounded-xl font-bold">
                  Back to Login
                </Button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
