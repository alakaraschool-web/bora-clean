import { supabase } from '../lib/supabase';
import { Database } from '../lib/database.types';

export const supabaseService = {
  // Profiles
  async getProfile(id: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  },

  async updateProfile(id: string, updates: Database['public']['Tables']['profiles']['Update']) {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', id);
    if (error) throw error;
    return data;
  },

  // Exams
  async getExams(schoolId: string) {
    const { data, error } = await supabase
      .from('exams')
      .select('*')
      .eq('school_id', schoolId);
    if (error) throw error;
    return data;
  },

  async createExam(exam: Database['public']['Tables']['exams']['Insert']) {
    const { data, error } = await supabase
      .from('exams')
      .insert(exam)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateExam(id: string, updates: Database['public']['Tables']['exams']['Update']) {
    const { data, error } = await supabase
      .from('exams')
      .update(updates)
      .eq('id', id);
    if (error) throw error;
    return data;
  },

  // Marks
  async getMarks(examId: string) {
    const { data, error } = await supabase
      .from('marks')
      .select('*')
      .eq('exam_id', examId);
    if (error) throw error;
    return data;
  },

  async upsertMarks(marks: Database['public']['Tables']['marks']['Insert'][]) {
    const { data, error } = await supabase
      .from('marks')
      .upsert(marks);
    if (error) throw error;
    return data;
  },

  // Students
  async getStudents(schoolId: string) {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('school_id', schoolId);
    if (error) throw error;
    return data;
  },

  async getStudentsByClass(schoolId: string, className: string) {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('school_id', schoolId)
      .eq('class', className);
    if (error) throw error;
    return data;
  },

  // School Settings
  async getSchoolSettings(schoolId: string) {
    const { data, error } = await supabase
      .from('school_settings')
      .select('*')
      .eq('school_id', schoolId)
      .single();
    if (error) throw error;
    return data;
  },

  async updateSchoolSettings(schoolId: string, updates: Database['public']['Tables']['school_settings']['Update']) {
    const { data, error } = await supabase
      .from('school_settings')
      .update(updates)
      .eq('school_id', schoolId);
    if (error) throw error;
    return data;
  },

  // Audit Logs
  async addAuditLog(log: Database['public']['Tables']['audit_logs']['Insert']) {
    const { data, error } = await supabase
      .from('audit_logs')
      .insert(log);
    if (error) throw error;
    return data;
  },

  // Storage
  async uploadAvatar(id: string, file: File) {
    const fileExt = file.name.split('.').pop();
    const fileName = `${id}-${Math.random()}.${fileExt}`;
    const filePath = `avatars/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    return publicUrl;
  },

  async uploadLogo(schoolId: string, file: File) {
    const fileExt = file.name.split('.').pop();
    const fileName = `${schoolId}-${Math.random()}.${fileExt}`;
    const filePath = `logos/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('logos')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('logos')
      .getPublicUrl(filePath);

    return publicUrl;
  },

  async getPublicResources() {
    const { data, error } = await supabase.storage
      .from('public-resources')
      .list();
    if (error) throw error;
    return data;
  },

  async getResourceUrl(fileName: string) {
    const { data: { publicUrl } } = supabase.storage
      .from('public-resources')
      .getPublicUrl(fileName);
    return publicUrl;
  },

  // Super Admin
  async getAllSchools() {
    const { data, error } = await supabase
      .from('schools')
      .select('*');
    if (error) throw error;
    return data;
  },

  async getStudentCountsBySchool() {
    const { data, error } = await supabase
      .from('students')
      .select('school_id');
    if (error) throw error;
    
    const counts: Record<string, number> = {};
    data.forEach(s => {
      counts[s.school_id] = (counts[s.school_id] || 0) + 1;
    });
    return counts;
  },

  // Exam Materials
  async getExamMaterials() {
    const { data, error } = await supabase
      .from('exam_materials')
      .select('*, schools(name)');
    if (error) throw error;
    return data;
  },

  async updateMaterialStatus(id: string, status: string) {
    const { data, error } = await supabase
      .from('exam_materials')
      .update({ status })
      .eq('id', id);
    if (error) throw error;
    return data;
  },

  async updateMaterialVisibility(id: string, visibility: string) {
    const { data, error } = await supabase
      .from('exam_materials')
      .update({ visibility })
      .eq('id', id);
    if (error) throw error;
    return data;
  },

  async deleteMaterial(id: string) {
    const { error } = await supabase
      .from('exam_materials')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  // Success Stories
  async getSuccessStories() {
    const { data, error } = await supabase
      .from('success_stories')
      .select('*');
    if (error) throw error;
    return data;
  },

  async createSuccessStory(story: Database['public']['Tables']['success_stories']['Insert']) {
    const { data, error } = await supabase
      .from('success_stories')
      .insert(story)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deleteSuccessStory(id: string) {
    const { error } = await supabase
      .from('success_stories')
      .delete()
      .eq('id', id);
    if (error) throw error;
  }
};
