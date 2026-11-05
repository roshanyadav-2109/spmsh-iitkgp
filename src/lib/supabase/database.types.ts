export type Json =
  string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      administration: {
        Row: {
          created_at: string;
          designation: string;
          display_order: number;
          email: string | null;
          full_name: string;
          id: string;
          is_active: boolean;
          phone: string | null;
          photo_path: string | null;
          qualifications: string | null;
        };
        Insert: {
          created_at?: string;
          designation: string;
          display_order?: number;
          email?: string | null;
          full_name: string;
          id?: string;
          is_active?: boolean;
          phone?: string | null;
          photo_path?: string | null;
          qualifications?: string | null;
        };
        Update: {
          created_at?: string;
          designation?: string;
          display_order?: number;
          email?: string | null;
          full_name?: string;
          id?: string;
          is_active?: boolean;
          phone?: string | null;
          photo_path?: string | null;
          qualifications?: string | null;
        };
        Relationships: [];
      };
      announcements: {
        Row: {
          attachment_path: string | null;
          body: string;
          category: string | null;
          created_at: string;
          created_by: string | null;
          id: string;
          is_pinned: boolean;
          is_published: boolean;
          published_at: string | null;
          slug: string;
          title: string;
          updated_at: string;
        };
        Insert: {
          attachment_path?: string | null;
          body: string;
          category?: string | null;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          is_pinned?: boolean;
          is_published?: boolean;
          published_at?: string | null;
          slug: string;
          title: string;
          updated_at?: string;
        };
        Update: {
          attachment_path?: string | null;
          body?: string;
          category?: string | null;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          is_pinned?: boolean;
          is_published?: boolean;
          published_at?: string | null;
          slug?: string;
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "announcements_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "staff_profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      appointments: {
        Row: {
          booked_over_phone: boolean;
          booking_ref: string;
          cancel_reason: string | null;
          contact_purged_at: string | null;
          created_at: string;
          created_by: string | null;
          doctor_id: string;
          doctor_remarks: string | null;
          id: string;
          is_overflow: boolean;
          on_date: string;
          patient_age: number;
          patient_id_no: string | null;
          patient_name: string;
          patient_phone: string;
          patient_sex: string;
          patient_type: string;
          reason: string | null;
          slot_time: string | null;
          source: Database["public"]["Enums"]["booking_source"];
          status: Database["public"]["Enums"]["appointment_status"];
          token_label: string | null;
          token_no: number;
          updated_at: string;
        };
        Insert: {
          booked_over_phone?: boolean;
          booking_ref: string;
          cancel_reason?: string | null;
          contact_purged_at?: string | null;
          created_at?: string;
          created_by?: string | null;
          doctor_id: string;
          doctor_remarks?: string | null;
          id?: string;
          is_overflow?: boolean;
          on_date: string;
          patient_age: number;
          patient_id_no?: string | null;
          patient_name: string;
          patient_phone: string;
          patient_sex: string;
          patient_type: string;
          reason?: string | null;
          slot_time?: string | null;
          source?: Database["public"]["Enums"]["booking_source"];
          status?: Database["public"]["Enums"]["appointment_status"];
          token_label?: string | null;
          token_no: number;
          updated_at?: string;
        };
        Update: {
          booked_over_phone?: boolean;
          booking_ref?: string;
          cancel_reason?: string | null;
          contact_purged_at?: string | null;
          created_at?: string;
          created_by?: string | null;
          doctor_id?: string;
          doctor_remarks?: string | null;
          id?: string;
          is_overflow?: boolean;
          on_date?: string;
          patient_age?: number;
          patient_id_no?: string | null;
          patient_name?: string;
          patient_phone?: string;
          patient_sex?: string;
          patient_type?: string;
          reason?: string | null;
          slot_time?: string | null;
          source?: Database["public"]["Enums"]["booking_source"];
          status?: Database["public"]["Enums"]["appointment_status"];
          token_label?: string | null;
          token_no?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "appointments_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "staff_profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "appointments_doctor_id_fkey";
            columns: ["doctor_id"];
            isOneToOne: false;
            referencedRelation: "doctors";
            referencedColumns: ["id"];
          },
        ];
      };
      audit_log: {
        Row: {
          action: string;
          actor_id: string | null;
          actor_role: Database["public"]["Enums"]["staff_role"] | null;
          created_at: string;
          entity: string;
          entity_id: string | null;
          id: number;
          meta: Json | null;
        };
        Insert: {
          action: string;
          actor_id?: string | null;
          actor_role?: Database["public"]["Enums"]["staff_role"] | null;
          created_at?: string;
          entity: string;
          entity_id?: string | null;
          id?: number;
          meta?: Json | null;
        };
        Update: {
          action?: string;
          actor_id?: string | null;
          actor_role?: Database["public"]["Enums"]["staff_role"] | null;
          created_at?: string;
          entity?: string;
          entity_id?: string | null;
          id?: number;
          meta?: Json | null;
        };
        Relationships: [
          {
            foreignKeyName: "audit_log_actor_id_fkey";
            columns: ["actor_id"];
            isOneToOne: false;
            referencedRelation: "staff_profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      departments: {
        Row: {
          created_at: string;
          description: string | null;
          display_order: number;
          id: string;
          is_active: boolean;
          location_note: string | null;
          name: string;
          slug: string;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          display_order?: number;
          id?: string;
          is_active?: boolean;
          location_note?: string | null;
          name: string;
          slug: string;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          display_order?: number;
          id?: string;
          is_active?: boolean;
          location_note?: string | null;
          name?: string;
          slug?: string;
        };
        Relationships: [];
      };
      doctor_schedules: {
        Row: {
          created_at: string;
          doctor_id: string;
          end_time: string;
          id: string;
          is_active: boolean;
          max_patients: number;
          room_no: string | null;
          slot_minutes: number;
          start_time: string;
          weekday: number;
        };
        Insert: {
          created_at?: string;
          doctor_id: string;
          end_time: string;
          id?: string;
          is_active?: boolean;
          max_patients: number;
          room_no?: string | null;
          slot_minutes?: number;
          start_time: string;
          weekday: number;
        };
        Update: {
          created_at?: string;
          doctor_id?: string;
          end_time?: string;
          id?: string;
          is_active?: boolean;
          max_patients?: number;
          room_no?: string | null;
          slot_minutes?: number;
          start_time?: string;
          weekday?: number;
        };
        Relationships: [
          {
            foreignKeyName: "doctor_schedules_doctor_id_fkey";
            columns: ["doctor_id"];
            isOneToOne: false;
            referencedRelation: "doctors";
            referencedColumns: ["id"];
          },
        ];
      };
      doctors: {
        Row: {
          about: string | null;
          created_at: string;
          department_id: string | null;
          designation: string | null;
          display_order: number;
          full_name: string;
          id: string;
          is_active: boolean;
          is_department_head: boolean;
          photo_path: string | null;
          qualifications: string | null;
          registration_no: string | null;
          room_no: string | null;
          slug: string;
        };
        Insert: {
          about?: string | null;
          created_at?: string;
          department_id?: string | null;
          designation?: string | null;
          display_order?: number;
          full_name: string;
          id?: string;
          is_active?: boolean;
          is_department_head?: boolean;
          photo_path?: string | null;
          qualifications?: string | null;
          registration_no?: string | null;
          room_no?: string | null;
          slug: string;
        };
        Update: {
          about?: string | null;
          created_at?: string;
          department_id?: string | null;
          designation?: string | null;
          display_order?: number;
          full_name?: string;
          id?: string;
          is_active?: boolean;
          is_department_head?: boolean;
          photo_path?: string | null;
          qualifications?: string | null;
          registration_no?: string | null;
          room_no?: string | null;
          slug?: string;
        };
        Relationships: [
          {
            foreignKeyName: "doctors_department_id_fkey";
            columns: ["department_id"];
            isOneToOne: false;
            referencedRelation: "departments";
            referencedColumns: ["id"];
          },
        ];
      };
      hospital_holidays: {
        Row: {
          created_at: string;
          created_by: string | null;
          on_date: string;
          reason: string;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          on_date: string;
          reason: string;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          on_date?: string;
          reason?: string;
        };
        Relationships: [
          {
            foreignKeyName: "hospital_holidays_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "staff_profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      schedule_exceptions: {
        Row: {
          approved_at: string | null;
          approved_by: string | null;
          created_at: string;
          created_by: string | null;
          doctor_id: string;
          end_time: string | null;
          id: string;
          kind: Database["public"]["Enums"]["exception_type"];
          max_patients: number | null;
          on_date: string;
          reason: string | null;
          start_time: string | null;
        };
        Insert: {
          approved_at?: string | null;
          approved_by?: string | null;
          created_at?: string;
          created_by?: string | null;
          doctor_id: string;
          end_time?: string | null;
          id?: string;
          kind: Database["public"]["Enums"]["exception_type"];
          max_patients?: number | null;
          on_date: string;
          reason?: string | null;
          start_time?: string | null;
        };
        Update: {
          approved_at?: string | null;
          approved_by?: string | null;
          created_at?: string;
          created_by?: string | null;
          doctor_id?: string;
          end_time?: string | null;
          id?: string;
          kind?: Database["public"]["Enums"]["exception_type"];
          max_patients?: number | null;
          on_date?: string;
          reason?: string | null;
          start_time?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "schedule_exceptions_approved_by_fkey";
            columns: ["approved_by"];
            isOneToOne: false;
            referencedRelation: "staff_profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "schedule_exceptions_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "staff_profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "schedule_exceptions_doctor_id_fkey";
            columns: ["doctor_id"];
            isOneToOne: false;
            referencedRelation: "doctors";
            referencedColumns: ["id"];
          },
        ];
      };
      services: {
        Row: {
          created_at: string;
          department_id: string | null;
          description: string | null;
          display_order: number;
          id: string;
          is_active: boolean;
          name: string;
          slug: string;
          timings: string | null;
        };
        Insert: {
          created_at?: string;
          department_id?: string | null;
          description?: string | null;
          display_order?: number;
          id?: string;
          is_active?: boolean;
          name: string;
          slug: string;
          timings?: string | null;
        };
        Update: {
          created_at?: string;
          department_id?: string | null;
          description?: string | null;
          display_order?: number;
          id?: string;
          is_active?: boolean;
          name?: string;
          slug?: string;
          timings?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "services_department_id_fkey";
            columns: ["department_id"];
            isOneToOne: false;
            referencedRelation: "departments";
            referencedColumns: ["id"];
          },
        ];
      };
      site_settings: {
        Row: {
          is_booking_policy: boolean;
          key: string;
          label: string;
          updated_at: string;
          updated_by: string | null;
          value: string;
        };
        Insert: {
          is_booking_policy?: boolean;
          key: string;
          label: string;
          updated_at?: string;
          updated_by?: string | null;
          value: string;
        };
        Update: {
          is_booking_policy?: boolean;
          key?: string;
          label?: string;
          updated_at?: string;
          updated_by?: string | null;
          value?: string;
        };
        Relationships: [
          {
            foreignKeyName: "site_settings_updated_by_fkey";
            columns: ["updated_by"];
            isOneToOne: false;
            referencedRelation: "staff_profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      staff_profiles: {
        Row: {
          created_at: string;
          doctor_id: string | null;
          full_name: string;
          id: string;
          is_active: boolean;
          phone: string | null;
          role: Database["public"]["Enums"]["staff_role"];
        };
        Insert: {
          created_at?: string;
          doctor_id?: string | null;
          full_name: string;
          id: string;
          is_active?: boolean;
          phone?: string | null;
          role: Database["public"]["Enums"]["staff_role"];
        };
        Update: {
          created_at?: string;
          doctor_id?: string | null;
          full_name?: string;
          id?: string;
          is_active?: boolean;
          phone?: string | null;
          role?: Database["public"]["Enums"]["staff_role"];
        };
        Relationships: [
          {
            foreignKeyName: "staff_profiles_doctor_id_fkey";
            columns: ["doctor_id"];
            isOneToOne: false;
            referencedRelation: "doctors";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      auth_doctor_id: { Args: never; Returns: string };
      auth_role: {
        Args: never;
        Returns: Database["public"]["Enums"]["staff_role"];
      };
      book_appointment: {
        Args: {
          p_booked_over_phone?: boolean;
          p_doctor_id: string;
          p_on_date: string;
          p_overflow?: boolean;
          p_override_cutoff?: boolean;
          p_override_phone_limit?: boolean;
          p_override_reason?: string;
          p_patient_age: number;
          p_patient_id_no?: string;
          p_patient_name: string;
          p_patient_phone: string;
          p_patient_sex: string;
          p_patient_type: string;
          p_reason?: string;
        };
        Returns: {
          booking_ref: string;
          doctor_id: string;
          is_overflow: boolean;
          on_date: string;
          slot_time: string;
          token_label: string;
          token_no: number;
        }[];
      };
      cancel_public_appointment: {
        Args: { p_phone: string; p_reason?: string; p_ref: string };
        Returns: {
          booking_ref: string;
          status: Database["public"]["Enums"]["appointment_status"];
        }[];
      };
      cancel_session: {
        Args: { p_doctor_id: string; p_on_date: string; p_reason: string };
        Returns: {
          booking_ref: string;
          patient_name: string;
          patient_phone: string;
          patient_type: string;
          slot_time: string;
          token_label: string;
        }[];
      };
      clinics_on: {
        Args: { p_on_date?: string };
        Returns: {
          booked: number;
          capacity: number;
          doctor_id: string;
          end_time: string;
          start_time: string;
        }[];
      };
      count_purgeable_contacts: { Args: { p_months: number }; Returns: number };
      generate_booking_ref: { Args: never; Returns: string };
      get_availability: {
        Args: { p_doctor_id: string; p_from: string; p_to: string };
        Returns: {
          booked: number;
          capacity: number;
          end_time: string;
          is_full: boolean;
          is_open: boolean;
          next_token: number;
          on_date: string;
          reason: string;
          reason_code: string;
          room_no: string;
          slot_minutes: number;
          start_time: string;
        }[];
      };
      is_desk: { Args: never; Returns: boolean };
      is_staff: { Args: never; Returns: boolean };
      is_tech: { Args: never; Returns: boolean };
      log_audit: {
        Args: {
          p_action: string;
          p_entity: string;
          p_entity_id?: string;
          p_meta?: Json;
        };
        Returns: undefined;
      };
      lookup_appointment: {
        Args: { p_phone: string; p_ref: string };
        Returns: {
          booking_ref: string;
          can_cancel: boolean;
          created_at: string;
          department_name: string;
          doctor_name: string;
          on_date: string;
          patient_age: number;
          patient_name: string;
          patient_sex: string;
          patient_type: string;
          reason: string;
          room_no: string;
          session_end: string;
          session_start: string;
          slot_time: string;
          status: Database["public"]["Enums"]["appointment_status"];
          token_label: string;
        }[];
      };
      now_time_ist: { Args: never; Returns: string };
      opd_count: { Args: { p_on_date?: string }; Returns: number };
      purge_patient_contacts: { Args: { p_months: number }; Returns: number };
      resolve_session: {
        Args: { p_doctor_id: string; p_on_date: string };
        Returns: {
          end_time: string;
          is_open: boolean;
          max_patients: number;
          reason: string;
          reason_code: string;
          room_no: string;
          slot_minutes: number;
          start_time: string;
        }[];
      };
      setting_bool: {
        Args: { p_default: boolean; p_key: string };
        Returns: boolean;
      };
      setting_int: {
        Args: { p_default: number; p_key: string };
        Returns: number;
      };
      today_ist: { Args: never; Returns: string };
    };
    Enums: {
      appointment_status: "booked" | "arrived" | "attended" | "no_show" | "cancelled";
      booking_source: "public" | "reception";
      exception_type: "holiday" | "cancelled" | "modified" | "extra";
      staff_role: "tech" | "reception" | "doctor";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      appointment_status: ["booked", "arrived", "attended", "no_show", "cancelled"],
      booking_source: ["public", "reception"],
      exception_type: ["holiday", "cancelled", "modified", "extra"],
      staff_role: ["tech", "reception", "doctor"],
    },
  },
} as const;
