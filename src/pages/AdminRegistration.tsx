import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '../components/Button';

export const AdminRegistration = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [invite, setInvite] = useState<{ id: string; valid: boolean } | null>(null);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', phone: '' });
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (token) {
      fetch('/api/auth/validate-admin-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      })
        .then(res => res.json())
        .then(data => {
          if (data.valid) setInvite({ id: data.id, valid: true });
          else alert('Invalid or expired token');
        });
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invite) return;
    setIsLoading(true);
    try {
      const url = `${window.location.origin}/api/auth/create-user`;
      console.log('Attempting to fetch:', url);
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, role: 'super_admin', school_id: '00000000-0000-0000-0000-000000000000' }) // Dummy school_id
      });
      
      const responseText = await res.text();
      console.log('Response status:', res.status, 'Body:', responseText);
      
      if (!res.ok) throw new Error(`Failed to create account: ${res.status} ${responseText}`);
      
      const resData = JSON.parse(responseText);
      
      // 2. Consume Invite
      await fetch('/api/auth/consume-admin-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: invite.id })
      });
      
      alert('Super Admin created!');
      navigate('/super-admin');
    } catch (error: any) {
      alert(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!invite) return <div>Loading...</div>;

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-xl shadow-md w-96 space-y-4">
        <h2 className="text-xl font-bold">Register Super Admin</h2>
        <input type="text" placeholder="Name" className="w-full p-2 border rounded" onChange={e => setFormData({...formData, name: e.target.value})} />
        <input type="email" placeholder="Email" className="w-full p-2 border rounded" onChange={e => setFormData({...formData, email: e.target.value})} />
        <input type="password" placeholder="Password" className="w-full p-2 border rounded" onChange={e => setFormData({...formData, password: e.target.value})} />
        <input type="text" placeholder="Phone" className="w-full p-2 border rounded" onChange={e => setFormData({...formData, phone: e.target.value})} />
        <Button disabled={isLoading} className="w-full">Register</Button>
      </form>
    </div>
  );
};
