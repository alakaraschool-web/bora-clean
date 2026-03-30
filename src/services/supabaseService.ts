import { firebaseService } from './firebaseService';

export const supabaseService = {
  ...firebaseService,
  async getPublicResources() {
    console.warn('supabaseService.getPublicResources is not implemented for Firebase');
    return [];
  },
  async uploadAvatar(id: string, file: File) {
    console.warn('supabaseService.uploadAvatar is not implemented for Firebase');
    return '';
  },
  async updateProfile(id: string, data: any) {
    console.warn('supabaseService.updateProfile is not implemented for Firebase');
  },
  async getResourceUrl(name: string) {
    console.warn('supabaseService.getResourceUrl is not implemented for Firebase');
    return '';
  }
};
