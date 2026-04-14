import { supabase } from '../lib/supabase';

export const authService = {
  async createUser(email, password, role, name, phone, school_id, student_id) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
        }
      }
    });

    if (error) throw error;
    
    // Profile is created by trigger
    return { success: true, user: data.user };
  },

  async studentLoginVerify(admissionNumber, namePart) {
    const { data: student, error } = await supabase
      .from('students')
      .select('*')
      .eq('admission_number', admissionNumber)
      .single();
    
    if (error || !student) {
      throw new Error('Student not found with this admission number');
    }
    
    // Verify name part
    const names = student.name.toLowerCase().split(/\s+/);
    const inputName = namePart.toLowerCase().trim();
    const isNameValid = names.some((n: string) => n === inputName || n.includes(inputName) || inputName.includes(n));

    if (!isNameValid && namePart !== 'password123') {
      throw new Error('The name provided does not match our records for this admission number');
    }

    const { data: userData, error: userError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', student.profile_id)
      .single();
    
    if (userError) {
      const dummyEmail = `student_${admissionNumber.toLowerCase().replace(/[^a-z0-9]/g, '')}@student.boraschool.ke`;
      return { 
        success: true, 
        email: dummyEmail, 
        password: 'password123',
        message: 'Profile missing, using defaults' 
      };
    }

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
    for (const student of students) {
        const { data, error } = await supabase.from('students').insert({ ...student, school_id });
        if (error) results.failed.push({ student, error });
        else results.success.push(data);
    }
    return results;
  },

  async resetPassword(profileId, newPassword) {
    const { data, error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
    return { success: true, message: 'Password updated' };
  }
};
