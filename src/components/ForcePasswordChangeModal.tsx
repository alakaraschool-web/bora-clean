import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, CheckCircle2, AlertCircle, ShieldAlert } from 'lucide-react';
import { Button } from './Button';
import { supabase } from '../lib/supabase';

interface ForcePasswordChangeModalProps {
  isOpen: boolean;
  profileId: string;
  onSuccess: () => void;
}

export const ForcePasswordChangeModal: React.FC<ForcePasswordChangeModalProps> = ({ isOpen, profileId, onSuccess }) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);
    try {
      console.log('Attempting to update user password...');
      // 1. Update Supabase Auth password
      const { data, error: authError } = await supabase.auth.updateUser({
        password: newPassword
      });
      console.log('updateUser result:', { data, authError });

      if (authError) throw authError;

      // 2. Update profiles table
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          password: newPassword,
          must_change_password: false 
        })
        .eq('id', profileId);

      if (updateError) throw updateError;

      // 3. Also update students table if applicable
      const { data: profile } = await supabase
        .from('profiles')
        .select('student_id')
        .eq('id', profileId)
        .single();

      if (profile?.student_id) {
        await supabase
          .from('students')
          .update({ password: newPassword })
          .eq('id', profile.student_id);
      }

      setIsSuccess(true);
      setTimeout(() => {
        onSuccess();
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to update password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white rounded-[2.5rem] w-full max-w-md p-8 shadow-2xl border border-gray-100 relative overflow-hidden"
          >
            {!isSuccess ? (
              <div className="space-y-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <ShieldAlert className="w-8 h-8 text-amber-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-kenya-black">Security Update Required</h3>
                  <p className="text-sm text-gray-500 mt-2">
                    Your administrator requires you to change your password on your first login.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
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
                    {isLoading ? 'Updating...' : 'Set New Password'}
                  </Button>
                </form>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-20 h-20 bg-kenya-green/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 className="w-10 h-10 text-kenya-green" />
                </div>
                <h3 className="text-2xl font-bold text-kenya-black mb-2">Password Updated!</h3>
                <p className="text-gray-500">Your account is now secure. Redirecting you to your dashboard...</p>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
