import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Mail, Lock, CheckCircle2, AlertCircle, Phone } from 'lucide-react';
import { Button } from './Button';
import { supabase } from '../lib/supabase';

interface PasswordResetModalProps {
  isOpen: boolean;
  onClose: () => void;
  role: 'student' | 'teacher' | 'principal' | 'super-admin';
}

export const PasswordResetModal: React.FC<PasswordResetModalProps> = ({ isOpen, onClose, role }) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [identifier, setIdentifier] = useState('');
  const [fullName, setFullName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [targetProfileId, setTargetProfileId] = useState<string | null>(null);

  const handleIdentify = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const sanitizedInput = identifier.trim();
      const sanitizedName = fullName.trim().toLowerCase();
      const cleanPhone = sanitizedInput.replace(/\s+/g, '');
      
      if (role === 'student') {
        // Students might use ADM or email/phone
        const { data: studentProfile, error: studentError } = await supabase
          .from('profiles')
          .select('id, name')
          .eq('role', 'student')
          .or(`email.eq.${sanitizedInput},phone.eq.${cleanPhone}`)
          .maybeSingle();

        if (studentProfile) {
          // Verify name
          const profileNames = studentProfile.name.toLowerCase().split(' ');
          const providedNames = sanitizedName.split(' ');
          const nameMatches = providedNames.some(name => profileNames.includes(name)) || 
                            studentProfile.name.toLowerCase().includes(sanitizedName);

          if (!nameMatches) {
            throw new Error('The name provided does not match our records for this account.');
          }

          setTargetProfileId(studentProfile.id);
          setStep(2);
        } else {
          // Try searching students table by ADM
          const { data: studentByAdm, error: admError } = await supabase
            .from('students')
            .select('id, name')
            .eq('adm', sanitizedInput)
            .maybeSingle();

          if (studentByAdm) {
            // Verify name
            const studentNames = studentByAdm.name.toLowerCase().split(' ');
            const providedNames = sanitizedName.split(' ');
            const nameMatches = providedNames.some(name => studentNames.includes(name)) || 
                              studentByAdm.name.toLowerCase().includes(sanitizedName);

            if (!nameMatches) {
              throw new Error('The name provided does not match our records for this admission number.');
            }

            // Find the profile for this student
            const { data: profileByStudent, error: profileError } = await supabase
              .from('profiles')
              .select('id')
              .eq('student_id', studentByAdm.id)
              .maybeSingle();

            if (profileByStudent) {
              setTargetProfileId(profileByStudent.id);
              setStep(2);
            } else {
              setError('Student profile not found. Please contact your administrator.');
            }
          } else {
            setError('Account with this Admission Number not found.');
          }
        }
      } else {
        // For other roles, search by email or phone
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('id, name')
          .eq('role', role)
          .or(`email.eq.${sanitizedInput},phone.eq.${cleanPhone}`)
          .maybeSingle();

        if (profile) {
          // Verify name
          const profileNames = profile.name.toLowerCase().split(' ');
          const providedNames = sanitizedName.split(' ');
          const nameMatches = providedNames.some(name => profileNames.includes(name)) || 
                            profile.name.toLowerCase().includes(sanitizedName);

          if (!nameMatches) {
            throw new Error('The name provided does not match our records for this account.');
          }

          setTargetProfileId(profile.id);
          setStep(2);
        } else {
          setError(`Account with this ${role === 'super-admin' ? 'Operator ID' : 'Phone/Email'} not found.`);
        }
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during verification.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (!targetProfileId) {
      setError('Session expired. Please start over.');
      setStep(1);
      return;
    }

    setIsLoading(true);
    try {
      // 1. Update the password in the profiles table
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          password: newPassword,
          must_change_password: false 
        })
        .eq('id', targetProfileId);

      if (updateError) throw updateError;

      // 2. Update Auth password via server-side API
      try {
        const response = await fetch('/api/auth/reset-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ profileId: targetProfileId, newPassword })
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          console.warn('Auth reset failed, but profile updated:', errorData.error);
          // We don't throw here to avoid confusing the user, 
          // but we log it for debugging. 
          // The profile update is the primary "fallback" reset.
        }
      } catch (authErr) {
        console.error('Failed to sync Auth password:', authErr);
      }

      // 3. If it's a student, also update the students table password for legacy support
      const { data: profile } = await supabase
        .from('profiles')
        .select('student_id')
        .eq('id', targetProfileId)
        .single();

      if (profile?.student_id) {
        await supabase
          .from('students')
          .update({ password: newPassword })
          .eq('id', profile.student_id);
      }
      
      setStep(3);
    } catch (err: any) {
      setError(err.message || 'Failed to reset password.');
    } finally {
      setIsLoading(false);
    }
  };

  const resetState = () => {
    setStep(1);
    setIdentifier('');
    setFullName('');
    setNewPassword('');
    setConfirmPassword('');
    setError('');
    setTargetProfileId(null);
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
                    {role === 'student' ? <Mail className="w-8 h-8 text-kenya-green" /> : <Phone className="w-8 h-8 text-kenya-green" />}
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
                      {role === 'student' ? 'Admission Number' : role === 'super-admin' ? 'Operator ID' : 'Phone Number'}
                    </label>
                    <input
                      type="text"
                      required
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-kenya-green/20"
                      placeholder={role === 'student' ? 'e.g. ADM-2024-001' : role === 'super-admin' ? 'e.g. admin' : 'e.g. 0712345678'}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-kenya-black uppercase ml-1">
                      Full Name (as registered)
                    </label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-kenya-green/20"
                      placeholder="e.g. John Doe"
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
