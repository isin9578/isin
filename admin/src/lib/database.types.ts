// Canonical TypeScript types for the iSIN database.
// Mirrors supabase/migrations/*.sql — keep in sync via `npm run sync-types` (repo root).
// Format matches `supabase gen types typescript` output so it plugs into
// `createClient<Database>` from @supabase/supabase-js.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Role = 'member' | 'admin';
export type ProfileStatus = 'pending' | 'active' | 'suspended';
export type CycleFrequency = 'monthly' | 'bi-weekly';
export type CycleStatus = 'active' | 'completed' | 'draft';
export type CycleMemberStatus = 'active' | 'completed';
export type ContributionStatus = 'pending' | 'verified' | 'failed';
export type PaymentMethod = 'GCash' | 'Maya' | 'Manual Admin Entry' | 'Bank Transfer' | 'Cash' | 'Other';
export type DistributionStatus = 'scheduled' | 'disbursed' | 'pending_verification';
export type CoverageType = 'Life Insurance' | 'Accident Coverage' | 'Health Protection' | 'Other';
export type PolicyStatus = 'active' | 'lapsed' | 'expired' | 'cancelled';
export type ClaimStatus = 'submitted' | 'under_review' | 'approved' | 'rejected';
export type NotificationType = 'contribution_reminder' | 'schedule_update' | 'payment_alert' | 'announcement';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          mobile_number: string;
          birthdate: string | null;
          address: string | null;
          role: Role;
          status: ProfileStatus;
          created_at: string;
        };
        Insert: {
          id: string;
          full_name: string;
          mobile_number: string;
          birthdate?: string | null;
          address?: string | null;
          role?: Role;
          status?: ProfileStatus;
          created_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          mobile_number?: string;
          birthdate?: string | null;
          address?: string | null;
          role?: Role;
          status?: ProfileStatus;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'profiles_id_fkey';
            columns: ['id'];
            referencedRelation: 'users';
            referencedColumns: ['id'];
            isOneToOne: true;
          },
        ];
      };
      cycles: {
        Row: {
          id: string;
          title: string;
          contribution_amount: number;
          frequency: CycleFrequency;
          start_date: string;
          end_date: string;
          status: CycleStatus;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          contribution_amount?: number;
          frequency?: CycleFrequency;
          start_date: string;
          end_date: string;
          status?: CycleStatus;
          created_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          contribution_amount?: number;
          frequency?: CycleFrequency;
          start_date?: string;
          end_date?: string;
          status?: CycleStatus;
          created_at?: string;
        };
        Relationships: [];
      };
      cycle_members: {
        Row: {
          id: string;
          cycle_id: string;
          user_id: string;
          slot_number: number;
          payout_date: string;
          status: CycleMemberStatus;
          created_at: string;
        };
        Insert: {
          id?: string;
          cycle_id: string;
          user_id: string;
          slot_number: number;
          payout_date: string;
          status?: CycleMemberStatus;
          created_at?: string;
        };
        Update: {
          id?: string;
          cycle_id?: string;
          user_id?: string;
          slot_number?: number;
          payout_date?: string;
          status?: CycleMemberStatus;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'cycle_members_cycle_id_fkey';
            columns: ['cycle_id'];
            referencedRelation: 'cycles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'cycle_members_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      contributions: {
        Row: {
          id: string;
          user_id: string;
          cycle_id: string;
          amount: number;
          payment_date: string;
          payment_method: PaymentMethod;
          status: ContributionStatus;
          proof_of_payment_url: string | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          cycle_id: string;
          amount?: number;
          payment_date?: string;
          payment_method?: PaymentMethod;
          status?: ContributionStatus;
          proof_of_payment_url?: string | null;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          cycle_id?: string;
          amount?: number;
          payment_date?: string;
          payment_method?: PaymentMethod;
          status?: ContributionStatus;
          proof_of_payment_url?: string | null;
          notes?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'contributions_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'contributions_cycle_id_fkey';
            columns: ['cycle_id'];
            referencedRelation: 'cycles';
            referencedColumns: ['id'];
          },
        ];
      };
      distributions: {
        Row: {
          id: string;
          cycle_id: string;
          recipient_user_id: string;
          amount: number;
          disbursement_date: string | null;
          status: DistributionStatus;
          reference_number: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          cycle_id: string;
          recipient_user_id: string;
          amount: number;
          disbursement_date?: string | null;
          status?: DistributionStatus;
          reference_number?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          cycle_id?: string;
          recipient_user_id?: string;
          amount?: number;
          disbursement_date?: string | null;
          status?: DistributionStatus;
          reference_number?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'distributions_cycle_id_fkey';
            columns: ['cycle_id'];
            referencedRelation: 'cycles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'distributions_recipient_user_id_fkey';
            columns: ['recipient_user_id'];
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      insurance_policies: {
        Row: {
          id: string;
          user_id: string;
          coverage_type: CoverageType;
          coverage_amount: number;
          premium_amount: number;
          status: PolicyStatus;
          start_date: string;
          end_date: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          coverage_type: CoverageType;
          coverage_amount?: number;
          premium_amount?: number;
          status?: PolicyStatus;
          start_date?: string;
          end_date?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          coverage_type?: CoverageType;
          coverage_amount?: number;
          premium_amount?: number;
          status?: PolicyStatus;
          start_date?: string;
          end_date?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'insurance_policies_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      insurance_claims: {
        Row: {
          id: string;
          user_id: string;
          claim_type: CoverageType;
          description: string;
          status: ClaimStatus;
          documents_url: string[];
          submitted_at: string;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          claim_type: CoverageType;
          description: string;
          status?: ClaimStatus;
          documents_url?: string[];
          submitted_at?: string;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          claim_type?: CoverageType;
          description?: string;
          status?: ClaimStatus;
          documents_url?: string[];
          submitted_at?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'insurance_claims_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          message: string;
          type: NotificationType;
          is_read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          message: string;
          type: NotificationType;
          is_read?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          message?: string;
          type?: NotificationType;
          is_read?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'notifications_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      notification_preferences: {
        Row: {
          user_id: string;
          type: NotificationType;
          enabled: boolean;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          type: NotificationType;
          enabled?: boolean;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          type?: NotificationType;
          enabled?: boolean;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'notification_preferences_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: {
      member_savings: {
        Row: {
          user_id: string;
          full_name: string;
          total_verified_savings: number;
          total_pending_savings: number;
          contribution_count: number;
          pending_contribution_count: number;
          verified_contribution_count: number;
        };
        Relationships: [];
      };
      cycle_pool_totals: {
        Row: {
          cycle_id: string;
          title: string;
          contribution_amount: number;
          frequency: CycleFrequency;
          start_date: string;
          end_date: string;
          status: CycleStatus;
          member_count: number;
          active_member_count: number;
          completed_slot_count: number;
          total_verified_contributions: number;
          total_pending_contributions: number;
          expected_pool_amount: number;
          pending_contribution_count: number;
        };
        Relationships: [];
      };
      member_cycle_enrollment: {
        Row: {
          user_id: string;
          slot_number: number;
          payout_date: string;
          member_status: CycleMemberStatus;
          cycle_id: string;
          cycle_title: string;
          contribution_amount: number;
          frequency: CycleFrequency;
          start_date: string;
          end_date: string;
          cycle_status: CycleStatus;
        };
        Relationships: [];
      };
      cycle_payout_schedule: {
        Row: {
          cycle_id: string;
          recipient_user_id: string;
          amount: number;
          disbursement_date: string | null;
          distribution_status: DistributionStatus;
          reference_number: string | null;
          slot_number: number;
          payout_date: string;
          viewer_slot_user_id: string;
          is_own_slot: boolean;
        };
        Relationships: [];
      };
      member_coverage: {
        Row: {
          user_id: string;
          full_name: string;
          active_coverage_amount: number;
          active_policy_count: number;
          open_claim_count: number;
        };
        Relationships: [];
      };
    };
    Functions: {
      is_admin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      is_cycle_member: {
        Args: { p_cycle_id: string };
        Returns: boolean;
      };
      mark_notifications_read: {
        Args: { p_ids?: string[] };
        Returns: number;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];
export type TablesInsert<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert'];
export type TablesUpdate<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update'];
export type Views<T extends keyof Database['public']['Views']> =
  Database['public']['Views'][T]['Row'];
