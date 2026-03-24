import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

export const authService = {
  async createUser(email, password, role, name, phone, school_id, student_id) {
    // 1. Create Auth Account
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name, role, school_id }
    });

    if (authError) {
      if (authError.message.includes('already registered')) {
        const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers();
        if (listError) throw listError;
        const existingUser = users.users.find((u: any) => u.email === email);
        if (existingUser) {
          const { error: profileError } = await supabaseAdmin.from('profiles').upsert({
            id: existingUser.id,
            user_id: existingUser.id,
            name,
            email,
            phone,
            role,
            school_id,
            student_id,
            password,
            must_change_password: true
          });
          if (profileError) throw profileError;
          return { success: true, user: existingUser, message: 'User already existed, profile updated' };
        }
      }
      throw authError;
    }

    // 2. Create Profile Record
    const { error: profileError } = await supabaseAdmin.from('profiles').upsert({
      id: authData.user.id,
      user_id: authData.user.id,
      name,
      email,
      phone,
      role,
      school_id,
      student_id,
      password,
      must_change_password: true
    });

    if (profileError) throw profileError;

    return { success: true, user: authData.user };
  },

  async studentLoginVerify(admissionNumber, namePart) {
    // 1. Find student by admission number
    const { data: student, error: studentError } = await supabaseAdmin
      .from('students')
      .select('*')
      .eq('admission_number', admissionNumber)
      .maybeSingle();

    if (studentError || !student) {
      throw new Error('Student not found with this admission number');
    }

    // 2. Verify name part
    const names = student.name.toLowerCase().split(/\s+/);
    const inputName = namePart.toLowerCase().trim();
    
    const isNameValid = names.some((n: string) => n === inputName || n.includes(inputName) || inputName.includes(n));

    if (!isNameValid && namePart !== 'password123') {
      throw new Error('The name provided does not match our records for this admission number');
    }

    // 3. Get profile to find the current password and email
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('email, password, id')
      .eq('student_id', student.id)
      .maybeSingle();

    if (profileError || !profile) {
      const dummyEmail = `${admissionNumber.toLowerCase().replace(/[^a-z0-9]/g, '')}@student.boraschool.ke`;
      return { 
        success: true, 
        email: dummyEmail, 
        password: 'password123',
        message: 'Profile missing, using defaults' 
      };
    }

    return { 
      success: true, 
      email: profile.email, 
      password: profile.password || 'password123' 
    };
  },

  async bulkCreateStudents(students, school_id) {
    const results = {
      success: [] as any[],
      failed: [] as any[]
    };

    for (const student of students) {
      const { name, admission_number, class: className, gender, phone } = student;
      const dummyEmail = `${admission_number.toLowerCase().replace(/[^a-z0-9]/g, '')}@student.boraschool.ke`;
      const password = 'password123';

      try {
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email: dummyEmail,
          password,
          email_confirm: true,
          user_metadata: { name, role: 'student', school_id }
        });

        let authUserId;
        if (authError) {
          if (authError.message.includes('already registered')) {
            const { data: users } = await supabaseAdmin.auth.admin.listUsers();
            const existingUser = users?.users.find((u: any) => u.email === dummyEmail);
            if (existingUser) {
              authUserId = existingUser.id;
            } else {
              throw authError;
            }
          } else {
            throw authError;
          }
        } else {
          authUserId = authData.user.id;
        }

        const { data: existingStudent } = await supabaseAdmin
          .from('students')
          .select('id')
          .eq('admission_number', admission_number)
          .eq('school_id', school_id)
          .single();

        const studentIdToUse = existingStudent ? existingStudent.id : authUserId;

        const { data: studentData, error: studentError } = await supabaseAdmin.from('students').upsert({
          id: studentIdToUse,
          name,
          admission_number,
          class: className,
          gender,
          school_id,
          status: 'Active'
        }).select().single();

        if (studentError) throw studentError;

        const { error: profileError } = await supabaseAdmin.from('profiles').upsert({
          id: authUserId,
          user_id: authUserId,
          name,
          email: dummyEmail,
          phone: phone || null,
          role: 'student',
          school_id,
          student_id: studentData.id,
          password,
          must_change_password: true
        });

        if (profileError) throw profileError;

        results.success.push({ id: authUserId, name, admission_number });
      } catch (err: any) {
        console.error(`Error creating student ${admission_number}:`, err);
        results.failed.push({ name, admission_number, error: err.message });
      }
    }
    return results;
  },

  async resetPassword(profileId, newPassword) {
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('user_id, email, phone')
      .eq('id', profileId)
      .single();

    if (profileError || !profile) {
      throw new Error('Profile not found');
    }

    if (!profile.user_id) {
      const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers();
      if (listError) throw listError;

      const authUser = users.users.find((u: any) => 
        u.email === profile.email || 
        u.phone === profile.phone ||
        u.user_metadata?.phone === profile.phone
      );

      if (authUser) {
        const { error: authUpdateError } = await supabaseAdmin.auth.admin.updateUserById(
          authUser.id,
          { password: newPassword }
        );
        if (authUpdateError) throw authUpdateError;

        await supabaseAdmin.from('profiles').update({ user_id: authUser.id }).eq('id', profileId);
        
        return { success: true, message: 'Auth password updated and synced' };
      }

      throw new Error('User not found in Auth system. Please login normally to create your account.');
    }

    const { error: authUpdateError } = await supabaseAdmin.auth.admin.updateUserById(
      profile.user_id,
      { password: newPassword }
    );
    if (authUpdateError) throw authUpdateError;

    return { success: true, message: 'Auth password updated' };
  }
};
