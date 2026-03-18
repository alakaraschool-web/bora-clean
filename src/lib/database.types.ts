export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          user_id: string | null
          role: string
          name: string
          email: string
          phone: string | null
          avatar_url: string | null
          school_id: string | null
          student_id: string | null
          must_change_password: boolean
          password: string | null
          assignments: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          role?: string
          name: string
          email: string
          phone?: string | null
          avatar_url?: string | null
          school_id?: string | null
          student_id?: string | null
          must_change_password?: boolean
          password?: string | null
          assignments?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          role?: string
          name?: string
          email?: string
          phone?: string | null
          avatar_url?: string | null
          school_id?: string | null
          student_id?: string | null
          must_change_password?: boolean
          password?: string | null
          assignments?: Json | null
          created_at?: string
        }
      }
      schools: {
        Row: {
          id: string
          name: string
          location: string | null
          county: string | null
          sub_county: string | null
          type: string | null
          principal_name: string | null
          status: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          location?: string | null
          county?: string | null
          sub_county?: string | null
          type?: string | null
          principal_name?: string | null
          status?: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          location?: string | null
          county?: string | null
          sub_county?: string | null
          type?: string | null
          principal_name?: string | null
          status?: string
          created_at?: string
        }
      }
      exams: {
        Row: {
          id: string
          title: string
          term: string
          year: string
          class_id: string | null
          subject_id: string | null
          locked: boolean
          weighting: number
          created_at: string
          school_id: string
        }
        Insert: {
          id?: string
          title: string
          term: string
          year: string
          class_id?: string | null
          subject_id?: string | null
          locked?: boolean
          weighting?: number
          created_at?: string
          school_id: string
        }
        Update: {
          id?: string
          title?: string
          term?: string
          year?: string
          class_id?: string | null
          subject_id?: string | null
          locked?: boolean
          weighting?: number
          created_at?: string
          school_id?: string
        }
      }
      marks: {
        Row: {
          id: string
          student_id: string
          subject_id: string
          exam_id: string
          score: number
          grade: string | null
          created_at: string
        }
        Insert: {
          id?: string
          student_id: string
          subject_id: string
          exam_id: string
          score: number
          grade?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          student_id?: string
          subject_id?: string
          exam_id?: string
          score?: number
          grade?: string | null
          created_at?: string
        }
      }
      audit_logs: {
        Row: {
          id: string
          user_id: string
          action: string
          details: string | null
          timestamp: string
        }
        Insert: {
          id?: string
          user_id: string
          action: string
          details?: string | null
          timestamp?: string
        }
        Update: {
          id?: string
          user_id?: string
          action?: string
          details?: string | null
          timestamp?: string
        }
      }
      students: {
        Row: {
          id: string
          name: string
          adm: string
          class: string
          gender: string | null
          status: string
          school_id: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          adm: string
          class: string
          gender?: string | null
          status?: string
          school_id: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          adm?: string
          class?: string
          gender?: string | null
          status?: string
          school_id?: string
          created_at?: string
        }
      }
      classes: {
        Row: {
          id: string
          name: string
          teacher_id: string | null
          capacity: number
          school_id: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          teacher_id?: string | null
          capacity?: number
          school_id: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          teacher_id?: string | null
          capacity?: number
          school_id?: string
          created_at?: string
        }
      }
      school_settings: {
        Row: {
          id: string
          school_id: string
          name: string
          motto: string | null
          email: string | null
          phone: string | null
          website: string | null
          address: string | null
          logo_url: string | null
          letterhead_template: string | null
          updated_at: string
        }
        Insert: {
          id?: string
          school_id: string
          name: string
          motto?: string | null
          email?: string | null
          phone?: string | null
          website?: string | null
          address?: string | null
          logo_url?: string | null
          letterhead_template?: string | null
          updated_at?: string
        }
        Update: {
          id?: string
          school_id?: string
          name?: string
          motto?: string | null
          email?: string | null
          phone?: string | null
          website?: string | null
          address?: string | null
          logo_url?: string | null
          letterhead_template?: string | null
          updated_at?: string
        }
      }
      exam_materials: {
        Row: {
          id: string
          school_id: string
          teacher_id: string | null
          title: string
          subject: string
          file_url: string | null
          file_type: string | null
          status: string
          visibility: string
          created_at: string
        }
        Insert: {
          id?: string
          school_id: string
          teacher_id?: string | null
          title: string
          subject: string
          file_url?: string | null
          file_type?: string | null
          status?: string
          visibility?: string
          created_at?: string
        }
        Update: {
          id?: string
          school_id?: string
          teacher_id?: string | null
          title?: string
          subject?: string
          file_url?: string | null
          file_type?: string | null
          status?: string
          visibility?: string
          created_at?: string
        }
      }
      success_stories: {
        Row: {
          id: string
          title: string
          content: string
          author_name: string | null
          school_name: string | null
          image_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          content: string
          author_name?: string | null
          school_name?: string | null
          image_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          content?: string
          author_name?: string | null
          school_name?: string | null
          image_url?: string | null
          created_at?: string
        }
      }
    }
  }
}
