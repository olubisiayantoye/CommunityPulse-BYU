/*
  # CommunityPulse Database Schema

  ## Overview
  This migration creates the complete database structure for CommunityPulse, a real-time
  community sentiment and issue tracker application.

  ## Tables Created
  
  ### 1. profiles
  Stores user profile information and role assignments
  - `id` (uuid, FK to auth.users) - User identifier
  - `email` (text) - User email address
  - `role` (text) - User role: 'admin' or 'member'
  - `display_name` (text) - Optional display name
  - `dark_mode` (boolean) - Dark mode preference
  - `created_at` (timestamptz) - Account creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### 2. categories
  Defines feedback categories for organization
  - `id` (uuid) - Category identifier
  - `name` (text) - Category name (e.g., "Facilities", "Communication")
  - `description` (text) - Category description
  - `color` (text) - UI color code for visual distinction
  - `created_at` (timestamptz) - Creation timestamp

  ### 3. feedback
  Stores all community feedback submissions
  - `id` (uuid) - Feedback identifier
  - `content` (text) - Feedback message content
  - `category_id` (uuid, FK) - Associated category
  - `sentiment` (text) - AI-detected sentiment: 'positive', 'neutral', 'negative'
  - `sentiment_score` (numeric) - Confidence score (0-1)
  - `status` (text) - Moderation status: 'pending', 'in_progress', 'resolved'
  - `is_anonymous` (boolean) - Whether submission is anonymous
  - `author_id` (uuid, FK, nullable) - User ID if not anonymous
  - `priority` (text) - Priority level: 'low', 'medium', 'high', 'urgent'
  - `votes_count` (integer) - Cached vote count for performance
  - `created_at` (timestamptz) - Submission timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### 4. votes
  Tracks member votes on feedback items
  - `id` (uuid) - Vote identifier
  - `feedback_id` (uuid, FK) - Voted feedback item
  - `user_id` (uuid, FK) - User who voted
  - `created_at` (timestamptz) - Vote timestamp
  - Unique constraint on (feedback_id, user_id) to prevent duplicate votes

  ### 5. audit_logs
  Records admin actions for transparency and compliance
  - `id` (uuid) - Log entry identifier
  - `admin_id` (uuid, FK) - Admin who performed action
  - `action` (text) - Action type (e.g., "status_update", "priority_change")
  - `feedback_id` (uuid, FK, nullable) - Related feedback if applicable
  - `details` (jsonb) - Additional action details
  - `created_at` (timestamptz) - Action timestamp

  ## Security
  All tables have Row Level Security (RLS) enabled with appropriate policies:
  - Members can submit and view feedback, vote on items
  - Admins have full access to all data and moderation tools
  - Audit logs are read-only for admins
  - Anonymous feedback is truly anonymous (no author_id stored)

  ## Indexes
  Performance indexes added for:
  - Feedback filtering by sentiment, status, category, and date
  - Vote lookups by user and feedback
  - Audit log queries by admin and timestamp
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  display_name text,
  dark_mode boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  color text DEFAULT '#6366f1',
  created_at timestamptz DEFAULT now()
);

-- Create feedback table
CREATE TABLE IF NOT EXISTS feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content text NOT NULL,
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  sentiment text DEFAULT 'neutral' CHECK (sentiment IN ('positive', 'neutral', 'negative')),
  sentiment_score numeric(3,2) DEFAULT 0.5 CHECK (sentiment_score >= 0 AND sentiment_score <= 1),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'resolved')),
  is_anonymous boolean DEFAULT true,
  author_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  priority text DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  votes_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create votes table
CREATE TABLE IF NOT EXISTS votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  feedback_id uuid NOT NULL REFERENCES feedback(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(feedback_id, user_id)
);

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action text NOT NULL,
  feedback_id uuid REFERENCES feedback(id) ON DELETE SET NULL,
  details jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_feedback_sentiment ON feedback(sentiment);
CREATE INDEX IF NOT EXISTS idx_feedback_status ON feedback(status);
CREATE INDEX IF NOT EXISTS idx_feedback_category ON feedback(category_id);
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON feedback(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_votes_feedback ON votes(feedback_id);
CREATE INDEX IF NOT EXISTS idx_votes_user ON votes(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_admin ON audit_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Profiles RLS Policies
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Categories RLS Policies
CREATE POLICY "Anyone authenticated can view categories"
  ON categories FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert categories"
  ON categories FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update categories"
  ON categories FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Feedback RLS Policies
CREATE POLICY "Anyone authenticated can view feedback"
  ON feedback FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert feedback"
  ON feedback FOR INSERT
  TO authenticated
  WITH CHECK (
    (is_anonymous = true AND author_id IS NULL) OR
    (is_anonymous = false AND author_id = auth.uid())
  );

CREATE POLICY "Admins can update feedback"
  ON feedback FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Votes RLS Policies
CREATE POLICY "Users can view all votes"
  ON votes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert own votes"
  ON votes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own votes"
  ON votes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Audit Logs RLS Policies
CREATE POLICY "Admins can view audit logs"
  ON audit_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can insert audit logs"
  ON audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = admin_id AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Insert default categories
INSERT INTO categories (name, description, color) VALUES
  ('Communication', 'Issues related to information sharing and announcements', '#3b82f6'),
  ('Facilities', 'Physical spaces, equipment, and infrastructure', '#10b981'),
  ('Events', 'Activities, programs, and gatherings', '#f59e0b'),
  ('Leadership', 'Organizational direction and management', '#ef4444'),
  ('Culture', 'Community atmosphere and values', '#8b5cf6'),
  ('Other', 'Topics not covered by other categories', '#6b7280')
ON CONFLICT (name) DO NOTHING;

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_feedback_updated_at
  BEFORE UPDATE ON feedback
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to update votes_count when votes are added/removed
CREATE OR REPLACE FUNCTION update_feedback_votes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE feedback SET votes_count = votes_count + 1 WHERE id = NEW.feedback_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE feedback SET votes_count = votes_count - 1 WHERE id = OLD.feedback_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger to maintain votes_count
CREATE TRIGGER update_votes_count_on_insert
  AFTER INSERT ON votes
  FOR EACH ROW
  EXECUTE FUNCTION update_feedback_votes_count();

CREATE TRIGGER update_votes_count_on_delete
  AFTER DELETE ON votes
  FOR EACH ROW
  EXECUTE FUNCTION update_feedback_votes_count();

-- Function to create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, role)
  VALUES (NEW.id, NEW.email, 'member');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();
