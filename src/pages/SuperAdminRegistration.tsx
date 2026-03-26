import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Loader2 } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '../components/Button';
import { supabase } from '../lib/supabase';

export const SuperAdminRegistration = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setError('Invalid or missing registration token.');
        setIsValidating(false);
        return;
      }
      const { data, error } = await supabase
        .from('super_admin_invites')
        .select('*')
        .eq('token', token)
        .eq('used', false)
        .gt('expires_at', new Date().toISOString())
        .maybeSingle();

      if (error || !data) {
        setError('Invalid or expired registration token.');
      }
      setIsValidating(false);
    };
    validateToken();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setIsLoading(true);
    setError('');

    try {
      // 1. Sign up user
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: { data: { role: 'super-admin', name: formData.name } }
      });
      if (signUpError) throw signUpError;

      if (data.user) {
        // 2. Update profile (trigger creates it as student)
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: data.user.id,
            email: formData.email,
            role: 'super-admin',
            name: formData.name
          });
        if (profileError) throw profileError;

        // 3. Mark token as used
        const { error: updateError } = await supabase
          .from('super_admin_invites')
          .update({ used: true })
          .eq('token', token);
        if (updateError) throw updateError;

        alert('Registration successful. You can now log in.');
        navigate('/super-admin/login');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isValidating) return <div className="min-h-screen flex items-center justify-center text-white">Validating token...</div>;
  if (error) return <div className="min-h-screen flex items-center justify-center text-red-500">{error}</div>;

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col justify-center py-12 px-6 font-mono">
      <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="sm:mx-auto sm:w-full sm:max-w-md bg-[#151619] py-10 px-6 shadow-2xl sm:rounded-2xl border border-white/10">
        <h2 className="text-2xl font-bold text-white mb-6 uppercase tracking-tight">Super Admin Registration</h2>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="text" placeholder="Full Name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full p-3 bg-black/40 border border-white/10 rounded-lg text-white" required />
          <input type="email" placeholder="Email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full p-3 bg-black/40 border border-white/10 rounded-lg text-white" required />
          <input type="password" placeholder="Password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full p-3 bg-black/40 border border-white/10 rounded-lg text-white" required />
          <input type="password" placeholder="Confirm Password" value={formData.confirmPassword} onChange={e => setFormData({...formData, confirmPassword: e.target.value})} className="w-full p-3 bg-black/40 border border-white/10 rounded-lg text-white" required />
          <Button type="submit" className="w-full" disabled={isLoading}>{isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Register'}</Button>
        </form>
      </motion.div>
    </div>
  );
};
