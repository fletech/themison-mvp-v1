export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      invitations: {
        Row: {
          accepted_at: string | null;
          email: string;
          expires_at: string | null;
          id: string;
          initial_role: Database["public"]["Enums"]["organization_member_type"];
          invited_at: string | null;
          invited_by: string | null;
          name: string;
          organization_id: string;
          status: string | null;
        };
        Insert: {
          accepted_at?: string | null;
          email: string;
          expires_at?: string | null;
          id?: string;
          initial_role: Database["public"]["Enums"]["organization_member_type"];
          invited_at?: string | null;
          invited_by?: string | null;
          name: string;
          organization_id: string;
          status?: string | null;
        };
        Update: {
          accepted_at?: string | null;
          email?: string;
          expires_at?: string | null;
          id?: string;
          initial_role?: Database["public"]["Enums"]["organization_member_type"];
          invited_at?: string | null;
          invited_by?: string | null;
          name?: string;
          organization_id?: string;
          status?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "invitations_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          }
        ];
      };
      members: {
        Row: {
          created_at: string | null;
          default_role: Database["public"]["Enums"]["organization_member_type"];
          email: string;
          id: string;
          invited_by: string | null;
          name: string;
          onboarding_completed: boolean;
          organization_id: string;
          profile_id: string;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          default_role: Database["public"]["Enums"]["organization_member_type"];
          email: string;
          id?: string;
          invited_by?: string | null;
          name: string;
          onboarding_completed?: boolean;
          organization_id: string;
          profile_id: string;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          default_role?: Database["public"]["Enums"]["organization_member_type"];
          email?: string;
          id?: string;
          invited_by?: string | null;
          name?: string;
          onboarding_completed?: boolean;
          organization_id?: string;
          profile_id?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "members_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "members_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      organizations: {
        Row: {
          created_at: string | null;
          created_by: string;
          id: string;
          name: string;
          onboarding_completed: boolean | null;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          created_by: string;
          id?: string;
          name: string;
          onboarding_completed?: boolean | null;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          created_by?: string;
          id?: string;
          name?: string;
          onboarding_completed?: boolean | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "organizations_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "themison_admins";
            referencedColumns: ["id"];
          }
        ];
      };
      patients: {
        Row: {
          created_at: string | null;
          id: string;
          organization_id: string;
          patient_code: string;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          organization_id: string;
          patient_code: string;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          organization_id?: string;
          patient_code?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "patients_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          }
        ];
      };
      profiles: {
        Row: {
          created_at: string | null;
          email: string;
          first_name: string | null;
          id: string;
          last_name: string | null;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          email: string;
          first_name?: string | null;
          id?: string;
          last_name?: string | null;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          email?: string;
          first_name?: string | null;
          id?: string;
          last_name?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      roles: {
        Row: {
          created_at: string | null;
          created_by: string | null;
          description: string | null;
          id: string;
          name: string;
          organization_id: string;
          permission_level: Database["public"]["Enums"]["permission_level"];
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          created_by?: string | null;
          description?: string | null;
          id?: string;
          name: string;
          organization_id: string;
          permission_level?: Database["public"]["Enums"]["permission_level"];
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          created_by?: string | null;
          description?: string | null;
          id?: string;
          name?: string;
          organization_id?: string;
          permission_level?: Database["public"]["Enums"]["permission_level"];
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "roles_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          }
        ];
      };
      themison_admins: {
        Row: {
          active: boolean | null;
          created_at: string | null;
          created_by: string | null;
          email: string;
          id: string;
          name: string | null;
        };
        Insert: {
          active?: boolean | null;
          created_at?: string | null;
          created_by?: string | null;
          email: string;
          id?: string;
          name?: string | null;
        };
        Update: {
          active?: boolean | null;
          created_at?: string | null;
          created_by?: string | null;
          email?: string;
          id?: string;
          name?: string | null;
        };
        Relationships: [];
      };
      trial_documents: {
        Row: {
          amendment_number: number | null;
          created_at: string;
          description: string | null;
          document_name: string;
          document_type: Database["public"]["Enums"]["document_type_enum"];
          document_url: string;
          file_size: number | null;
          id: string;
          is_latest: boolean | null;
          mime_type: string | null;
          status: string | null;
          warning: boolean | null;
          tags: string[] | null;
          trial_id: string | null;
          updated_at: string | null;
          uploaded_by: string | null;
          version: number | null;
        };
        Insert: {
          amendment_number?: number | null;
          created_at?: string;
          description?: string | null;
          document_name: string;
          document_type: Database["public"]["Enums"]["document_type_enum"];
          document_url: string;
          file_size?: number | null;
          id?: string;
          is_latest?: boolean | null;
          mime_type?: string | null;
          status?: string | null;
          tags?: string[] | null;
          trial_id?: string | null;
          updated_at?: string | null;
          uploaded_by?: string | null;
          version?: number | null;
        };
        Update: {
          amendment_number?: number | null;
          created_at?: string;
          description?: string | null;
          document_name?: string;
          document_type?: Database["public"]["Enums"]["document_type_enum"];
          document_url?: string;
          file_size?: number | null;
          id?: string;
          is_latest?: boolean | null;
          mime_type?: string | null;
          status?: string | null;
          tags?: string[] | null;
          trial_id?: string | null;
          updated_at?: string | null;
          uploaded_by?: string | null;
          version?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "trial_documents_trial_id_fkey";
            columns: ["trial_id"];
            isOneToOne: false;
            referencedRelation: "trials";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "trial_documents_uploaded_by_fkey";
            columns: ["uploaded_by"];
            isOneToOne: false;
            referencedRelation: "members";
            referencedColumns: ["id"];
          }
        ];
      };
      trial_members: {
        Row: {
          created_at: string | null;
          end_date: string | null;
          id: string;
          is_active: boolean | null;
          member_id: string;
          role_id: string;
          start_date: string | null;
          trial_id: string;
        };
        Insert: {
          created_at?: string | null;
          end_date?: string | null;
          id?: string;
          is_active?: boolean | null;
          member_id: string;
          role_id: string;
          start_date?: string | null;
          trial_id: string;
        };
        Update: {
          created_at?: string | null;
          end_date?: string | null;
          id?: string;
          is_active?: boolean | null;
          member_id?: string;
          role_id?: string;
          start_date?: string | null;
          trial_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "trial_members_member_id_fkey";
            columns: ["member_id"];
            isOneToOne: false;
            referencedRelation: "members";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "trial_members_role_id_fkey";
            columns: ["role_id"];
            isOneToOne: false;
            referencedRelation: "roles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "trial_members_trial_id_fkey";
            columns: ["trial_id"];
            isOneToOne: false;
            referencedRelation: "trials";
            referencedColumns: ["id"];
          }
        ];
      };
      trial_members_pending: {
        Row: {
          created_at: string | null;
          id: string;
          invitation_id: string;
          invited_by: string | null;
          notes: string | null;
          role_id: string;
          trial_id: string;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          invitation_id: string;
          invited_by?: string | null;
          notes?: string | null;
          role_id: string;
          trial_id: string;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          invitation_id?: string;
          invited_by?: string | null;
          notes?: string | null;
          role_id?: string;
          trial_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "trial_members_pending_invitation_id_fkey";
            columns: ["invitation_id"];
            isOneToOne: false;
            referencedRelation: "invitations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "trial_members_pending_invited_by_fkey";
            columns: ["invited_by"];
            isOneToOne: false;
            referencedRelation: "members";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "trial_members_pending_role_id_fkey";
            columns: ["role_id"];
            isOneToOne: false;
            referencedRelation: "roles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "trial_members_pending_trial_id_fkey";
            columns: ["trial_id"];
            isOneToOne: false;
            referencedRelation: "trials";
            referencedColumns: ["id"];
          }
        ];
      };
      trial_patients: {
        Row: {
          created_at: string | null;
          enrollment_date: string | null;
          id: string;
          notes: string | null;
          patient_id: string;
          randomization_code: string | null;
          status: string | null;
          trial_id: string;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          enrollment_date?: string | null;
          id?: string;
          notes?: string | null;
          patient_id: string;
          randomization_code?: string | null;
          status?: string | null;
          trial_id: string;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          enrollment_date?: string | null;
          id?: string;
          notes?: string | null;
          patient_id?: string;
          randomization_code?: string | null;
          status?: string | null;
          trial_id?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "trial_patients_patient_id_fkey";
            columns: ["patient_id"];
            isOneToOne: false;
            referencedRelation: "patients";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "trial_patients_trial_id_fkey";
            columns: ["trial_id"];
            isOneToOne: false;
            referencedRelation: "trials";
            referencedColumns: ["id"];
          }
        ];
      };
      trials: {
        Row: {
          created_at: string | null;
          created_by: string | null;
          description: string | null;
          estimated_close_out: string | null;
          id: string;
          image_url: string | null;
          location: string;
          name: string;
          organization_id: string;
          phase: string;
          sponsor: string;
          status: string | null;
          study_start: string | null;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          created_by?: string | null;
          description?: string | null;
          estimated_close_out?: string | null;
          id?: string;
          image_url?: string | null;
          location: string;
          name: string;
          organization_id: string;
          phase: string;
          sponsor: string;
          status?: string | null;
          study_start?: string | null;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          created_by?: string | null;
          description?: string | null;
          estimated_close_out?: string | null;
          id?: string;
          image_url?: string | null;
          location?: string;
          name?: string;
          organization_id?: string;
          phase?: string;
          sponsor?: string;
          status?: string | null;
          study_start?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "trials_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      create_trial_with_members: {
        Args: { trial_data: Json; team_assignments: Json[] };
        Returns: string;
      };
      create_trial_with_members_debug: {
        Args: { trial_data: Json; team_assignments: Json[] };
        Returns: {
          trial_id: string;
          debug_logs: string[];
        }[];
      };
      create_trial_with_members_extended: {
        Args: {
          trial_data: Json;
          confirmed_assignments?: Json[];
          pending_assignments?: Json[];
        };
        Returns: string;
      };
      create_trial_with_mixed_assignments: {
        Args: { trial_data: Json; team_assignments?: Json[] };
        Returns: string;
      };
      debug_trial_creation: {
        Args: {
          org_id: string;
          user_profile_id: string;
          trial_data: Json;
          team_assignments: Json[];
        };
        Returns: {
          trial_id: string;
          debug_logs: string[];
        }[];
      };
      get_organization_roles: {
        Args: { org_id: string; search_term?: string };
        Returns: {
          id: string;
          name: string;
          description: string;
          permission_level: Database["public"]["Enums"]["permission_level"];
        }[];
      };
      get_trial_team: {
        Args: { trial_id_param: string };
        Returns: {
          member_id: string;
          member_name: string;
          member_email: string;
          role_name: string;
          permission_level: Database["public"]["Enums"]["permission_level"];
          is_active: boolean;
          start_date: string;
        }[];
      };
      get_user_organization_id: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
      get_user_organization_id_for_trial_members: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
      is_themison_admin: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      user_belongs_to_organization: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
      user_can_access_trial: {
        Args: { trial_id_param: string };
        Returns: boolean;
      };
      user_can_create_trials: {
        Args: { user_profile_id: string };
        Returns: boolean;
      };
      user_organization_status: {
        Args: { user_profile_id: string };
        Returns: {
          organization_id: string;
          organization_name: string;
          default_role: string;
          member_since: string;
        }[];
      };
      user_trial_permission: {
        Args: { user_profile_id: string; trial_id_param: string };
        Returns: Database["public"]["Enums"]["permission_level"];
      };
    };
    Enums: {
      document_type_enum:
        | "protocol"
        | "brochure"
        | "consent_form"
        | "report"
        | "manual"
        | "plan"
        | "amendment"
        | "icf"
        | "case_report_form"
        | "standard_operating_procedure"
        | "other";
      organization_member_type: "admin" | "staff";
      permission_level: "read" | "edit" | "admin";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DefaultSchema = Database[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
      DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] &
      DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R;
    }
    ? R
    : never
  : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Insert: infer I;
    }
    ? I
    : never
  : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Update: infer U;
    }
    ? U
    : never
  : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never;

export const Constants = {
  public: {
    Enums: {
      organization_member_type: ["admin", "staff"],
      permission_level: ["read", "edit", "admin"],
    },
  },
} as const;

// Type aliases for convenience
export type TrialMembersPending = Tables<"trial_members_pending">;
export type TrialMembersPendingInsert = TablesInsert<"trial_members_pending">;
export type TrialMembersPendingUpdate = TablesUpdate<"trial_members_pending">;
export type Invitation = Tables<"invitations">;
export type Member = Tables<"members">;
export type TrialMember = Tables<"trial_members">;
export type Role = Tables<"roles">;
export type Trial = Tables<"trials">;

// New exports for documents
export type TrialDocument = Tables<"trial_documents">;
export type TrialDocumentInsert = TablesInsert<"trial_documents">;
export type TrialDocumentUpdate = TablesUpdate<"trial_documents">;
export type DocumentTypeEnum =
  Database["public"]["Enums"]["document_type_enum"];
