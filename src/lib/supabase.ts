import { createClient } from "@supabase/supabase-js";

// Environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase environment variables. Please check your .env file."
  );
}



// Exported Supabase client
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: "pkce", // Secure flow for public clients
  },
});

// Supabase Database Types
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          plan: "free" | "pro" | "business";
          role: "user" | "admin"; // ✅ REQUIRED (not optional)
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          plan?: "free" | "pro" | "business";
          role?: "user" | "admin"; // ✅ Optional for inserts (has default)
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          plan?: "free" | "pro" | "business";
          role?: "user" | "admin"; // ✅ Optional for updates
          created_at?: string;
          updated_at?: string;
        };
      };

      websites: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string | null;
          domain: string | null;
          status: "draft" | "published";
          template: string;
          thumbnail: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          description?: string | null;
          domain?: string | null;
          status?: "draft" | "published";
          template: string;
          thumbnail?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          description?: string | null;
          domain?: string | null;
          status?: "draft" | "published";
          template?: string;
          thumbnail?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}