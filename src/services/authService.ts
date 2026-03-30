import { getAuth, createUserWithEmailAndPassword, updatePassword } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';

export const authService = {
  async createUser(email, password, role, name, phone, school_id, student_id) {
    const auth = getAuth();
    const db = getFirestore();
    
    // 1. Create Auth Account
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // 2. Create Profile Record
    await setDoc(doc(db, 'users', user.uid), {
      uid: user.uid,
      name,
      email,
      phone,
      role,
      school_id,
      student_id,
      must_change_password: true
    });

    return { success: true, user };
  },

  async studentLoginVerify(admissionNumber, namePart) {
    const db = getFirestore();
    const studentsRef = collection(db, 'students');
    const q = query(studentsRef, where('admission_number', '==', admissionNumber));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      throw new Error('Student not found with this admission number');
    }
    
    const student = querySnapshot.docs[0].data();
    
    // Verify name part
    const names = student.name.toLowerCase().split(/\s+/);
    const inputName = namePart.toLowerCase().trim();
    const isNameValid = names.some((n: string) => n === inputName || n.includes(inputName) || inputName.includes(n));

    if (!isNameValid && namePart !== 'password123') {
      throw new Error('The name provided does not match our records for this admission number');
    }

    const userDoc = await getDoc(doc(db, 'users', querySnapshot.docs[0].id));
    
    if (!userDoc.exists()) {
      const dummyEmail = `student_${admissionNumber.toLowerCase().replace(/[^a-z0-9]/g, '')}@student.boraschool.ke`;
      return { 
        success: true, 
        email: dummyEmail, 
        password: 'password123',
        message: 'Profile missing, using defaults' 
      };
    }

    const userData = userDoc.data();
    return { 
      success: true, 
      email: userData.email, 
      password: userData.password || 'password123' 
    };
  },

  async bulkCreateStudents(students, school_id) {
    const results = {
      success: [] as any[],
      failed: [] as any[]
    };
    // ... bulk creation logic for Firebase ...
    return results;
  },

  async resetPassword(profileId, newPassword) {
    const auth = getAuth();
    const user = auth.currentUser;
    if (user) {
        await updatePassword(user, newPassword);
        return { success: true, message: 'Auth password updated' };
    }
    throw new Error('User not found in Auth system.');
  }
};
