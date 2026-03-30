import React, { useState, useEffect } from 'react';
import { getFirestore, collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { Button } from './Button';

export const AdminSignup = () => {
  const [isAdminExists, setIsAdminExists] = useState<boolean | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const checkAdmin = async () => {
      const db = getFirestore();
      const adminsRef = collection(db, 'users');
      const q = query(adminsRef, where('role', '==', 'super_admin'));
      const querySnapshot = await getDocs(q);
      setIsAdminExists(!querySnapshot.empty);
    };
    checkAdmin();
  }, []);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      const auth = getAuth();
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const db = getFirestore();
      await addDoc(collection(db, 'users'), {
        uid: userCredential.user.uid,
        email,
        name,
        role: 'super_admin'
      });
      setIsAdminExists(true);
      alert('Super Admin created successfully');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isAdminExists === null) return <div>Loading...</div>;
  if (isAdminExists) return null;

  return (
    <form onSubmit={handleSignup} className="p-4 bg-gray-100 rounded-lg">
      <h2 className="text-xl font-bold mb-4">Create Super Admin</h2>
      {error && <p className="text-red-500 mb-2">{error}</p>}
      <input type="text" placeholder="Name" value={name} onChange={e => setName(e.target.value)} className="w-full mb-2 p-2 rounded" required />
      <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} className="w-full mb-2 p-2 rounded" required />
      <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} className="w-full mb-4 p-2 rounded" required />
      <Button type="submit" disabled={isLoading}>{isLoading ? 'Creating...' : 'Create Super Admin'}</Button>
    </form>
  );
};
