-- RANDSUM Expo: initial schema for cloud sync
-- All tables use RLS with user_id = auth.uid()

-- Profiles
CREATE TABLE profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  preferences JSONB,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY profiles_select ON profiles FOR SELECT USING (id = auth.uid());
CREATE POLICY profiles_insert ON profiles FOR INSERT WITH CHECK (id = auth.uid());
CREATE POLICY profiles_update ON profiles FOR UPDATE USING (id = auth.uid());
CREATE POLICY profiles_delete ON profiles FOR DELETE USING (id = auth.uid());

-- Templates
CREATE TABLE templates (
  id          TEXT PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  notation    TEXT NOT NULL,
  variables   JSONB,
  game_id     TEXT,
  game_inputs JSONB,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX templates_user_id_idx ON templates(user_id);

ALTER TABLE templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY templates_select ON templates FOR SELECT USING (user_id = auth.uid());
CREATE POLICY templates_insert ON templates FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY templates_update ON templates FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY templates_delete ON templates FOR DELETE USING (user_id = auth.uid());

-- Roll History
CREATE TABLE roll_history (
  id          TEXT PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  notation    TEXT NOT NULL,
  total       INTEGER NOT NULL,
  rolls       JSONB NOT NULL,
  game_id     TEXT,
  template_id TEXT REFERENCES templates(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX roll_history_user_id_created_at_idx ON roll_history(user_id, created_at DESC);

ALTER TABLE roll_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY roll_history_select ON roll_history FOR SELECT USING (user_id = auth.uid());
CREATE POLICY roll_history_insert ON roll_history FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY roll_history_update ON roll_history FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY roll_history_delete ON roll_history FOR DELETE USING (user_id = auth.uid());
