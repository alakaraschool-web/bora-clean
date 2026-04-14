import { supabase } from '../lib/supabase';

export const supabaseService = {
  async getAllSchools() {
    const { data, error } = await supabase.from('schools').select('*');
    if (error) throw error;
    return data;
  },
  async getStudentCountsBySchool() {
    // Implement count logic
    return {};
  },
  async getTotalStudentsCount() {
    const { count, error } = await supabase.from('students').select('*', { count: 'exact', head: true });
    if (error) throw error;
    return count || 0;
  },
  async getActiveExamsCount() {
    const { count, error } = await supabase.from('exams').select('*', { count: 'exact', head: true }).eq('status', 'Active');
    if (error) throw error;
    return count || 0;
  },
  async getExamMaterials() {
    const { data, error } = await supabase.from('exam_materials').select('*');
    if (error) throw error;
    return data;
  },
  async getSuccessStories() {
    const { data, error } = await supabase.from('success_stories').select('*');
    if (error) throw error;
    return data;
  },
  async updateSchoolStatus(id: string, status: string) {
    const { error } = await supabase.from('schools').update({ status }).eq('id', id);
    if (error) throw error;
  },
  async updateMaterialStatus(id: string, status: string) {
    const { error } = await supabase.from('exam_materials').update({ status }).eq('id', id);
    if (error) throw error;
  },
  async createExamMaterial(material: any) {
    const { error } = await supabase.from('exam_materials').insert(material);
    if (error) throw error;
  },
  async updateMaterialVisibility(id: string, visibility: string) {
    const { error } = await supabase.from('exam_materials').update({ visibility }).eq('id', id);
    if (error) throw error;
  },
  async deleteMaterial(id: string) {
    const { error } = await supabase.from('exam_materials').delete().eq('id', id);
    if (error) throw error;
  },
  async updateSchoolSubscription(id: string, date: string) {
    const { error } = await supabase.from('schools').update({ subscription_expires_at: date }).eq('id', id);
    if (error) throw error;
  },
  async createSuccessStory(story: any) {
    const { data, error } = await supabase.from('success_stories').insert(story).select().single();
    if (error) throw error;
    return data;
  },
  async deleteSuccessStory(id: string) {
    const { error } = await supabase.from('success_stories').delete().eq('id', id);
    if (error) throw error;
  },
  async getProfiles() {
    const { data, error } = await supabase.from('profiles').select('*');
    if (error) throw error;
    return data;
  },
  async updateExam(id: string, exam: any) {
    const { error } = await supabase.from('exams').update(exam).eq('id', id);
    if (error) throw error;
  },
  async uploadExamMaterial(material: any) {
    const { error } = await supabase.from('exam_materials').insert(material);
    if (error) throw error;
  },
  async updateSchoolSettings(id: string, settings: any) {
    const { error } = await supabase.from('schools').update(settings).eq('id', id);
    if (error) throw error;
  },
  async getPublicResources() {
    const { data, error } = await supabase.from('resources').select('*').eq('visibility', 'Public');
    if (error) throw error;
    return data;
  },
  async uploadAvatar(id: string, file: File) {
    const { data, error } = await supabase.storage.from('avatars').upload(`${id}/${file.name}`, file);
    if (error) throw error;
    return data;
  },
  async updateProfile(id: string, profile: any) {
    const { error } = await supabase.from('profiles').update(profile).eq('id', id);
    if (error) throw error;
  },
  async getResourceUrl(path: string) {
    const { data } = await supabase.storage.from('resources').getPublicUrl(path);
    return data.publicUrl;
  },
  async getStudents() {
    const { data, error } = await supabase.from('students').select('*');
    if (error) throw error;
    return data;
  }
};
