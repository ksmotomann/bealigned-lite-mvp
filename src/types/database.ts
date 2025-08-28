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
      sessions: {
        Row: {
          id: string
          created_at: string
          expires_at: string
          client_meta: Json | null
        }
        Insert: {
          id?: string
          created_at?: string
          expires_at: string
          client_meta?: Json | null
        }
        Update: {
          id?: string
          created_at?: string
          expires_at?: string
          client_meta?: Json | null
        }
      }
      steps: {
        Row: {
          id: number
          slug: string
          title: string
          description: string
          order: number
          schema: Json
        }
        Insert: {
          id: number
          slug: string
          title: string
          description: string
          order: number
          schema: Json
        }
        Update: {
          id?: number
          slug?: string
          title?: string
          description?: string
          order?: number
          schema?: Json
        }
      }
      prompts: {
        Row: {
          id: string
          step_id: number | null
          text: string
          kind: string
        }
        Insert: {
          id?: string
          step_id?: number | null
          text: string
          kind: string
        }
        Update: {
          id?: string
          step_id?: number | null
          text?: string
          kind?: string
        }
      }
      feelings_bank: {
        Row: {
          term: string
          category: string
        }
        Insert: {
          term: string
          category: string
        }
        Update: {
          term?: string
          category?: string
        }
      }
      values_bank: {
        Row: {
          term: string
          category: string
        }
        Insert: {
          term: string
          category: string
        }
        Update: {
          term?: string
          category?: string
        }
      }
      frameworks: {
        Row: {
          name: string
          content: Json
        }
        Insert: {
          name: string
          content: Json
        }
        Update: {
          name?: string
          content?: Json
        }
      }
      knowledge_docs: {
        Row: {
          id: string
          title: string
          source: string | null
          version: string | null
          kind: string | null
          checksum: string | null
          content: string
          metadata: Json | null
        }
        Insert: {
          id?: string
          title: string
          source?: string | null
          version?: string | null
          kind?: string | null
          checksum?: string | null
          content: string
          metadata?: Json | null
        }
        Update: {
          id?: string
          title?: string
          source?: string | null
          version?: string | null
          kind?: string | null
          checksum?: string | null
          content?: string
          metadata?: Json | null
        }
      }
      embeddings: {
        Row: {
          id: number
          doc_id: string | null
          chunk: string
          embedding: string
          metadata: Json | null
        }
        Insert: {
          id?: never
          doc_id?: string | null
          chunk: string
          embedding: string
          metadata?: Json | null
        }
        Update: {
          id?: never
          doc_id?: string | null
          chunk?: string
          embedding?: string
          metadata?: Json | null
        }
      }
      responses: {
        Row: {
          id: string
          session_id: string | null
          step_id: number | null
          user_text: string | null
          ai_text: string | null
          knowledge_audit: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          session_id?: string | null
          step_id?: number | null
          user_text?: string | null
          ai_text?: string | null
          knowledge_audit?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          session_id?: string | null
          step_id?: number | null
          user_text?: string | null
          ai_text?: string | null
          knowledge_audit?: Json | null
          created_at?: string
        }
      }
      options: {
        Row: {
          id: string
          session_id: string | null
          text: string
          why_tags: string[] | null
          rank: number | null
        }
        Insert: {
          id?: string
          session_id?: string | null
          text: string
          why_tags?: string[] | null
          rank?: number | null
        }
        Update: {
          id?: string
          session_id?: string | null
          text?: string
          why_tags?: string[] | null
          rank?: number | null
        }
      }
      messages: {
        Row: {
          id: string
          session_id: string | null
          draft: string | null
          final: string | null
          framework: string | null
          created_at: string
        }
        Insert: {
          id?: string
          session_id?: string | null
          draft?: string | null
          final?: string | null
          framework?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          session_id?: string | null
          draft?: string | null
          final?: string | null
          framework?: string | null
          created_at?: string
        }
      }
      audit_logs: {
        Row: {
          id: number
          session_id: string | null
          event: string
          details: Json | null
          created_at: string
        }
        Insert: {
          id?: never
          session_id?: string | null
          event: string
          details?: Json | null
          created_at?: string
        }
        Update: {
          id?: never
          session_id?: string | null
          event?: string
          details?: Json | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      search_embeddings: {
        Args: {
          query_embedding: string
          match_threshold?: number
          match_count?: number
        }
        Returns: {
          doc_id: string
          chunk: string
          similarity: number
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}