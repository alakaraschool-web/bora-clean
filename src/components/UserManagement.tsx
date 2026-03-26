import React, { useState, useEffect, FormEvent } from 'react';
import { db } from '../lib/firebase';
import { collection, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { Button } from './Button';
import { supabase } from '../lib/supabase';

export const UserManagement = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [showRegister, setShowRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchUsers = async () => {
      const usersCollection = collection(db, 'users');
      const userSnapshot = await getDocs(usersCollection);
      const userList = userSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUsers(userList);
    };
    fetchUsers();
  }, []);

  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      // 1. Sign up user
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { role: 'super-admin', name } }
      });
      if (signUpError) throw signUpError;
      
      if (data.user) {
        // 2. Insert profile
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            user_id: data.user.id,
            email,
            role: 'super-admin',
            name
          });
        if (profileError) throw profileError;
        
        alert('Super Admin registered successfully');
        setShowRegister(false);
        setEmail('');
        setPassword('');
        setName('');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (userId: string) => {
    alert(`Password reset for ${userId}`);
  };

  const handleDisableAccount = async (userId: string) => {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, { disabled: true });
    alert(`Account ${userId} disabled`);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">User Management</h2>
        <Button onClick={() => setShowRegister(!showRegister)}>
          {showRegister ? 'Cancel' : 'Register New Super Admin'}
        </Button>
      </div>

      {showRegister && (
        <form onSubmit={handleRegister} className="mb-6 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
          <h3 className="text-lg font-bold mb-2">Register New Super Admin</h3>
          {error && <p className="text-red-500 mb-2">{error}</p>}
          <input type="text" placeholder="Name" value={name} onChange={e => setName(e.target.value)} className="w-full mb-2 p-2 rounded" required />
          <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} className="w-full mb-2 p-2 rounded" required />
          <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} className="w-full mb-4 p-2 rounded" required />
          <Button type="submit" disabled={isLoading}>{isLoading ? 'Registering...' : 'Register'}</Button>
        </form>
      )}

      <table className="min-w-full bg-white dark:bg-gray-800">
        <thead>
          <tr>
            <th className="py-2 px-4 border-b">Email</th>
            <th className="py-2 px-4 border-b">Role</th>
            <th className="py-2 px-4 border-b">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map(user => (
            <tr key={user.id}>
              <td className="py-2 px-4 border-b">{user.email}</td>
              <td className="py-2 px-4 border-b">{user.role}</td>
              <td className="py-2 px-4 border-b">
                <Button onClick={() => handleResetPassword(user.id)} className="mr-2">Reset Password</Button>
                <Button onClick={() => handleDisableAccount(user.id)} variant="destructive">Disable</Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
