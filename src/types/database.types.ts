export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          membership_tier: 'free' | 'basic' | 'premium' | null;
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          subscription_status: 'active' | 'canceled' | 'past_due' | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          membership_tier?: 'free' | 'basic' | 'premium' | null;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          subscription_status?: 'active' | 'canceled' | 'past_due' | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          membership_tier?: 'free' | 'basic' | 'premium' | null;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          subscription_status?: 'active' | 'canceled' | 'past_due' | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      subscription_plans: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          price: number;
          interval: 'month' | 'year';
          features: Json;
          stripe_price_id: string;
          active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          price: number;
          interval: 'month' | 'year';
          features: Json;
          stripe_price_id: string;
          active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          price?: number;
          interval?: 'month' | 'year';
          features?: Json;
          stripe_price_id?: string;
          active?: boolean;
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}
