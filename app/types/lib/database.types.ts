export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)";
  };
  public: {
    Tables: {
      applications: {
        Row: {
          category_id: number;
          created_at: string;
          created_by: number;
          description: string;
          developer_id: number | null;
          display_order: number;
          id: number;
          is_deleted: boolean;
          name: string;
          thumbnail_path: string | null;
          updated_at: string;
          updated_by: number;
          url: string;
        };
        Insert: {
          category_id: number;
          created_at?: string;
          created_by: number;
          description: string;
          developer_id?: number | null;
          display_order?: number;
          id?: number;
          is_deleted?: boolean;
          name: string;
          thumbnail_path?: string | null;
          updated_at?: string;
          updated_by: number;
          url: string;
        };
        Update: {
          category_id?: number;
          created_at?: string;
          created_by?: number;
          description?: string;
          developer_id?: number | null;
          display_order?: number;
          id?: number;
          is_deleted?: boolean;
          name?: string;
          thumbnail_path?: string | null;
          updated_at?: string;
          updated_by?: number;
          url?: string;
        };
        Relationships: [
          {
            foreignKeyName: "applications_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "applications_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "applications_developer_id_fkey";
            columns: ["developer_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "applications_updated_by_fkey";
            columns: ["updated_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      categories: {
        Row: {
          category_type: string;
          created_at: string;
          description: string | null;
          display_order: number;
          id: number;
          is_deleted: boolean;
          name: string;
          updated_at: string;
        };
        Insert: {
          category_type: string;
          created_at?: string;
          description?: string | null;
          display_order?: number;
          id?: number;
          is_deleted?: boolean;
          name: string;
          updated_at?: string;
        };
        Update: {
          category_type?: string;
          created_at?: string;
          description?: string | null;
          display_order?: number;
          id?: number;
          is_deleted?: boolean;
          name?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      documents: {
        Row: {
          assignee: string | null;
          category_id: number;
          created_at: string;
          created_by: number;
          description: string | null;
          display_order: number;
          id: number;
          is_deleted: boolean;
          name: string;
          updated_at: string;
          updated_by: number;
          url: string;
        };
        Insert: {
          assignee?: string | null;
          category_id: number;
          created_at?: string;
          created_by: number;
          description?: string | null;
          display_order?: number;
          id?: number;
          is_deleted?: boolean;
          name: string;
          updated_at?: string;
          updated_by: number;
          url: string;
        };
        Update: {
          assignee?: string | null;
          category_id?: number;
          created_at?: string;
          created_by?: number;
          description?: string | null;
          display_order?: number;
          id?: number;
          is_deleted?: boolean;
          name?: string;
          updated_at?: string;
          updated_by?: number;
          url?: string;
        };
        Relationships: [
          {
            foreignKeyName: "documents_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "documents_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "documents_updated_by_fkey";
            columns: ["updated_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      position_tags: {
        Row: {
          created_at: string;
          id: number;
          position_id: number;
          updated_at: string;
          user_id: number;
        };
        Insert: {
          created_at?: string;
          id?: number;
          position_id: number;
          updated_at?: string;
          user_id: number;
        };
        Update: {
          created_at?: string;
          id?: number;
          position_id?: number;
          updated_at?: string;
          user_id?: number;
        };
        Relationships: [
          {
            foreignKeyName: "position_tags_position_id_fkey";
            columns: ["position_id"];
            isOneToOne: false;
            referencedRelation: "positions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "position_tags_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      positions: {
        Row: {
          created_at: string;
          description: string | null;
          display_order: number;
          id: number;
          is_deleted: boolean;
          name: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          display_order?: number;
          id?: number;
          is_deleted?: boolean;
          name: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          display_order?: number;
          id?: number;
          is_deleted?: boolean;
          name?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      users: {
        Row: {
          auth_id: string;
          avatar_url: string | null;
          bio: string | null;
          created_at: string;
          display_name: string;
          email: string;
          facebook_url: string | null;
          github_url: string | null;
          id: number;
          instagram_url: string | null;
          is_deleted: boolean;
          portfolio_url: string | null;
          role: string;
          status: string;
          updated_at: string;
          x_url: string | null;
        };
        Insert: {
          auth_id: string;
          avatar_url?: string | null;
          bio?: string | null;
          created_at?: string;
          display_name: string;
          email: string;
          facebook_url?: string | null;
          github_url?: string | null;
          id?: number;
          instagram_url?: string | null;
          is_deleted?: boolean;
          portfolio_url?: string | null;
          role?: string;
          status?: string;
          updated_at?: string;
          x_url?: string | null;
        };
        Update: {
          auth_id?: string;
          avatar_url?: string | null;
          bio?: string | null;
          created_at?: string;
          display_name?: string;
          email?: string;
          facebook_url?: string | null;
          github_url?: string | null;
          id?: number;
          instagram_url?: string | null;
          is_deleted?: boolean;
          portfolio_url?: string | null;
          role?: string;
          status?: string;
          updated_at?: string;
          x_url?: string | null;
        };
        Relationships: [];
      };
      videos: {
        Row: {
          assignee: string | null;
          category_id: number;
          created_at: string;
          created_by: number;
          description: string | null;
          display_order: number;
          id: number;
          is_deleted: boolean;
          length: number | null;
          name: string;
          thumbnail_path: string | null;
          thumbnail_time: number | null;
          updated_at: string;
          updated_by: number;
          url: string;
        };
        Insert: {
          assignee?: string | null;
          category_id: number;
          created_at?: string;
          created_by: number;
          description?: string | null;
          display_order?: number;
          id?: number;
          is_deleted?: boolean;
          length?: number | null;
          name: string;
          thumbnail_path?: string | null;
          thumbnail_time?: number | null;
          updated_at?: string;
          updated_by: number;
          url: string;
        };
        Update: {
          assignee?: string | null;
          category_id?: number;
          created_at?: string;
          created_by?: number;
          description?: string | null;
          display_order?: number;
          id?: number;
          is_deleted?: boolean;
          length?: number | null;
          name?: string;
          thumbnail_path?: string | null;
          thumbnail_time?: number | null;
          updated_at?: string;
          updated_by?: number;
          url?: string;
        };
        Relationships: [
          {
            foreignKeyName: "videos_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "videos_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "videos_updated_by_fkey";
            columns: ["updated_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      get_clerk_user_id: { Args: never; Returns: string };
      is_authenticated_user: { Args: never; Returns: boolean };
      is_registered_user: { Args: never; Returns: boolean };
      requesting_user_id: { Args: never; Returns: string };
      set_clerk_user_id: { Args: { clerk_id: string }; Returns: undefined };
    };
    Enums: {
      [_ in never]: never;
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
