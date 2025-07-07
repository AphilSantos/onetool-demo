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
      posts: {
        Row: {
          id: number
          title: string
          content: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          title: string
          content?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          title?: string
          content?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      ai_sessions: {
        Row: {
          id: string
          user_id: string
          messages: Json
          current_task: string | null
          task_status: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          messages?: Json
          current_task?: string | null
          task_status?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          messages?: Json
          current_task?: string | null
          task_status?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type AISession = Database['public']['Tables']['ai_sessions']['Row']
export type AISessionInsert = Database['public']['Tables']['ai_sessions']['Insert']
export type AISessionUpdate = Database['public']['Tables']['ai_sessions']['Update']