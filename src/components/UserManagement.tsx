import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { Button } from './Button';

export const UserManagement = () => {
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    const fetchUsers = async () => {
      const usersCollection = collection(db, 'users');
      const userSnapshot = await getDocs(usersCollection);
      const userList = userSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUsers(userList);
    };
    fetchUsers();
  }, []);

  const handleResetPassword = async (userId: string) => {
    // In a real app, you'd use Firebase Auth to send a password reset email
    alert(`Password reset for ${userId}`);
  };

  const handleDisableAccount = async (userId: string) => {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, { disabled: true });
    alert(`Account ${userId} disabled`);
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">User Management</h2>
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
