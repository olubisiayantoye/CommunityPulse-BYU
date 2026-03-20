import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Profile = {
  id: string;
  email: string;
  role: 'admin' | 'member';
  display_name: string | null;
  dark_mode: boolean;
  created_at: string;
  updated_at: string;
};

export type Category = {
  id: string;
  name: string;
  description: string | null;
  color: string;
  created_at: string;
};

export type Feedback = {
  id: string;
  content: string;
  category_id: string | null;
  sentiment: 'positive' | 'neutral' | 'negative';
  sentiment_score: number;
  status: 'pending' | 'in_progress' | 'resolved';
  is_anonymous: boolean;
  author_id: string | null;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  votes_count: number;
  created_at: string;
  updated_at: string;
};

export type Vote = {
  id: string;
  feedback_id: string;
  user_id: string;
  created_at: string;
};

export type AuditLog = {
  id: string;
  admin_id: string;
  action: string;
  feedback_id: string | null;
  details: Record<string, unknown>;
  created_at: string;
};
