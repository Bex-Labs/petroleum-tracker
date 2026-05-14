-- ============================================================
-- PETROTRACK — New Supabase Tables
-- Run these in Supabase → SQL Editor
-- ============================================================

-- 1. REPORTS TABLE
-- Users submit incorrect fuel status reports here
CREATE TABLE IF NOT EXISTS reports (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  station_id    UUID REFERENCES stations(id) ON DELETE CASCADE,
  station_name  TEXT,
  reported_by   UUID REFERENCES users(id) ON DELETE SET NULL,
  reporter_email TEXT,
  report_type   TEXT,   -- 'wrong_fuel_status' | 'wrong_price' | 'station_closed' | 'other'
  note          TEXT,
  status        TEXT DEFAULT 'pending', -- 'pending' | 'resolved'
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- 2. NOTIFICATIONS TABLE
-- user_id = NULL means broadcast to everyone
CREATE TABLE IF NOT EXISTS notifications (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID REFERENCES users(id) ON DELETE CASCADE,  -- NULL = broadcast
  title      TEXT NOT NULL,
  message    TEXT NOT NULL,
  type       TEXT DEFAULT 'announcement', -- 'price_update' | 'announcement' | 'alert' | 'approval' | 'report'
  is_read    BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Add 'flagged' column to existing users table (for admin flag feature)
ALTER TABLE users ADD COLUMN IF NOT EXISTS flagged BOOLEAN DEFAULT FALSE;

-- ============================================================
-- ROW LEVEL SECURITY (RLS) — Enable after creating tables
-- ============================================================

-- Reports: anyone logged in can insert; admin can read all
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can insert reports" ON reports FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Admins can read reports"  ON reports FOR SELECT USING (true);
CREATE POLICY "Admins can update reports" ON reports FOR UPDATE USING (true);
CREATE POLICY "Admins can delete reports" ON reports FOR DELETE USING (true);

-- Notifications: users can read their own + broadcasts; only admin can insert
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own + broadcast notifs" ON notifications
  FOR SELECT USING (user_id = auth.uid() OR user_id IS NULL);
CREATE POLICY "Users can mark own notifs read" ON notifications
  FOR UPDATE USING (user_id = auth.uid() OR user_id IS NULL);
CREATE POLICY "Admin can insert notifications" ON notifications
  FOR INSERT WITH CHECK (true);
