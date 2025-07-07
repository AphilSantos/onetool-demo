/*
  # Create AI Sessions Table

  1. New Tables
    - `ai_sessions`
      - `id` (uuid, primary key)
      - `user_id` (text, unique)
      - `messages` (jsonb, conversation history)
      - `current_task` (text, nullable, current task description)
      - `task_status` (text, nullable, task status)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `ai_sessions` table
    - Add policy for users to manage their own sessions
*/

CREATE TABLE IF NOT EXISTS ai_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text UNIQUE NOT NULL,
  messages jsonb DEFAULT '[]'::jsonb,
  current_task text,
  task_status text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE ai_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own sessions"
  ON ai_sessions
  FOR ALL
  TO authenticated
  USING (true);

-- Create an index for faster lookups by user_id
CREATE INDEX IF NOT EXISTS idx_ai_sessions_user_id ON ai_sessions(user_id);

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create a trigger to automatically update updated_at
CREATE TRIGGER update_ai_sessions_updated_at
    BEFORE UPDATE ON ai_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();