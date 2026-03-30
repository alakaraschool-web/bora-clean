import { getFirestore, collection, getDocs, query, where, doc, updateDoc, setDoc, deleteDoc, addDoc, serverTimestamp } from 'firebase/firestore';

const db = getFirestore();

export const firebaseService = {
  async getAllSchools() {
    const schoolsRef = collection(db, 'schools');
    const snapshot = await getDocs(schoolsRef);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  async getStudentCountsBySchool() {
    // This might be complex in Firestore. 
    // For now, let's return a placeholder or implement a simple count.
    return {};
  },

  async getTotalStudentsCount() {
    const studentsRef = collection(db, 'students');
    const snapshot = await getDocs(studentsRef);
    return snapshot.size;
  },

  async getActiveExamsCount() {
    const examsRef = collection(db, 'exams');
    const q = query(examsRef, where('status', '==', 'Active'));
    const snapshot = await getDocs(q);
    return snapshot.size;
  },

  async getExamMaterials() {
    const materialsRef = collection(db, 'exam_materials');
    const snapshot = await getDocs(materialsRef);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  async getSuccessStories() {
    const storiesRef = collection(db, 'success_stories');
    const snapshot = await getDocs(storiesRef);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  async updateSchoolStatus(id: string, status: string) {
    await updateDoc(doc(db, 'schools', id), { status });
  },

  async updateMaterialStatus(id: string, status: string) {
    await updateDoc(doc(db, 'exam_materials', id), { status });
  },

  async createExamMaterial(material: any) {
    await addDoc(collection(db, 'exam_materials'), { ...material, created_at: serverTimestamp() });
  },

  async updateMaterialVisibility(id: string, visibility: string) {
    await updateDoc(doc(db, 'exam_materials', id), { visibility });
  },

  async deleteMaterial(id: string) {
    await deleteDoc(doc(db, 'exam_materials', id));
  },

  async updateSchoolSubscription(id: string, date: string) {
    await updateDoc(doc(db, 'schools', id), { subscription_expires_at: date });
  },

  async createSuccessStory(story: any) {
    const docRef = await addDoc(collection(db, 'success_stories'), { ...story, created_at: serverTimestamp() });
    return { id: docRef.id, ...story };
  },

  async deleteSuccessStory(id: string) {
    await deleteDoc(doc(db, 'success_stories', id));
  },

  async getProfiles() {
    const profilesRef = collection(db, 'users');
    const snapshot = await getDocs(profilesRef);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  async getStudents() {
    const studentsRef = collection(db, 'students');
    const snapshot = await getDocs(studentsRef);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }
};
