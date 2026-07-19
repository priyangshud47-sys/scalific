// ── Domain interfaces (used in component code) ──────────────────────────────

export interface SiteSetting {
  id: string;
  key: string;
  value: string | null;
  updated_at: string;
}

export interface Service {
  id: string;
  title: string;
  description: string | null;
  icon_url: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string | null;
  photo_url: string | null;
  bio: string | null;
  linkedin_url: string | null;
  display_order: number;
  is_active: boolean;
}

export interface ContentBlock {
  id: string;
  section_key: string;
  content: string | null;
  media_url: string | null;
  updated_at: string;
}

export type ContactFieldType = "text" | "email" | "textarea" | "phone" | "select";

export interface ContactFormField {
  id: string;
  field_label: string;
  field_name: string;
  field_type: ContactFieldType;
  is_required: boolean;
  options: string[] | null;
  display_order: number;
}

export interface ContactSubmission {
  id: string;
  data: Record<string, any>;
  submitted_at: string;
}

export interface Testimonial {
  id: string;
  quote: string;
  author_name: string;
  author_title: string | null;
  company: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
}

// ── Supabase Database type (supabase-js v2 generic) ──────────────────────────
// Must use fully-explicit flat types — no Omit<>/Partial<> — to avoid
// "type resolves to never" inference errors in supabase-js v2.

export type Database = {
  public: {
    Tables: {
      site_settings: {
        Row: {
          id: string;
          key: string;
          value: string | null;
          updated_at: string;
        };
        Insert: {
          id?: string;
          key: string;
          value?: string | null;
          updated_at?: string;
        };
        Update: {
          id?: string;
          key?: string;
          value?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      services: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          icon_url: string | null;
          display_order: number;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          icon_url?: string | null;
          display_order?: number;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string | null;
          icon_url?: string | null;
          display_order?: number;
          is_active?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      team_members: {
        Row: {
          id: string;
          name: string;
          role: string | null;
          photo_url: string | null;
          bio: string | null;
          linkedin_url: string | null;
          display_order: number;
          is_active: boolean;
        };
        Insert: {
          id?: string;
          name: string;
          role?: string | null;
          photo_url?: string | null;
          bio?: string | null;
          linkedin_url?: string | null;
          display_order?: number;
          is_active?: boolean;
        };
        Update: {
          id?: string;
          name?: string;
          role?: string | null;
          photo_url?: string | null;
          bio?: string | null;
          linkedin_url?: string | null;
          display_order?: number;
          is_active?: boolean;
        };
        Relationships: [];
      };
      content_blocks: {
        Row: {
          id: string;
          section_key: string;
          content: string | null;
          media_url: string | null;
          updated_at: string;
        };
        Insert: {
          id?: string;
          section_key: string;
          content?: string | null;
          media_url?: string | null;
          updated_at?: string;
        };
        Update: {
          id?: string;
          section_key?: string;
          content?: string | null;
          media_url?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      contact_form_fields: {
        Row: {
          id: string;
          field_label: string;
          field_name: string;
          field_type: ContactFieldType;
          is_required: boolean;
          options: string[] | null;
          display_order: number;
        };
        Insert: {
          id?: string;
          field_label: string;
          field_name: string;
          field_type: ContactFieldType;
          is_required?: boolean;
          options?: string[] | null;
          display_order?: number;
        };
        Update: {
          id?: string;
          field_label?: string;
          field_name?: string;
          field_type?: ContactFieldType;
          is_required?: boolean;
          options?: string[] | null;
          display_order?: number;
        };
        Relationships: [];
      };
      contact_submissions: {
        Row: {
          id: string;
          data: Record<string, any>;
          submitted_at: string;
        };
        Insert: {
          id?: string;
          data: Record<string, any>;
          submitted_at?: string;
        };
        Update: {
          id?: string;
          data?: Record<string, any>;
          submitted_at?: string;
        };
        Relationships: [];
      };
      testimonials: {
        Row: {
          id: string;
          quote: string;
          author_name: string;
          author_title: string | null;
          company: string | null;
          display_order: number;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          quote: string;
          author_name: string;
          author_title?: string | null;
          company?: string | null;
          display_order?: number;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          quote?: string;
          author_name?: string;
          author_title?: string | null;
          company?: string | null;
          display_order?: number;
          is_active?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      employee_permissions: {
        Row: {
          id: string;
          user_email: string;
          role_title: string;
          is_super_admin: boolean;
          allowed_sections: string[];
          created_at: string;
        };
        Insert: {
          id?: string;
          user_email: string;
          role_title?: string;
          is_super_admin?: boolean;
          allowed_sections?: string[];
          created_at?: string;
        };
        Update: {
          id?: string;
          user_email?: string;
          role_title?: string;
          is_super_admin?: boolean;
          allowed_sections?: string[];
          created_at?: string;
        };
        Relationships: [];
      };
      activity_logs: {
        Row: {
          id: string;
          user_email: string;
          action: string;
          module: string;
          details: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_email: string;
          action: string;
          module: string;
          details?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_email?: string;
          action?: string;
          module?: string;
          details?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      permission_requests: {
        Row: {
          id: string;
          requested_by: string;
          request_type: string;
          target_email: string;
          payload: Record<string, any>;
          status: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          requested_by: string;
          request_type: string;
          target_email: string;
          payload: Record<string, any>;
          status?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          requested_by?: string;
          request_type?: string;
          target_email?: string;
          payload?: Record<string, any>;
          status?: string;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
