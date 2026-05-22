-- ============================================================
-- TEST QUESTION BANK — kho câu hỏi tái sử dụng
-- ============================================================

CREATE TABLE IF NOT EXISTS question_bank (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  skill         TEXT NOT NULL DEFAULT 'general'
                CHECK (skill IN ('reading', 'listening', 'speaking', 'writing', 'general')),
  type          TEXT NOT NULL DEFAULT 'mcq'
                CHECK (type IN ('mcq', 'true_false', 'fill_blank', 'short_answer', 'essay', 'speaking_prompt')),
  level         TEXT,                       -- A1, A2, B1, ... or "Starter", "Mover"...
  topic         TEXT,                       -- "Family", "Animals", "Daily routine"...
  difficulty    INTEGER DEFAULT 1 CHECK (difficulty BETWEEN 1 AND 5),
  question_text TEXT NOT NULL,
  image_url     TEXT,
  audio_url     TEXT,
  points        NUMERIC NOT NULL DEFAULT 1,
  explanation   TEXT,
  tags          TEXT[],                     -- ['unit-3', 'grammar', 'past-tense']
  usage_count   INTEGER NOT NULL DEFAULT 0, -- how many times used in tests
  is_public     BOOLEAN NOT NULL DEFAULT FALSE, -- hybrid sharing model
  is_deleted    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by    UUID DEFAULT auth.uid(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by    UUID
);

CREATE INDEX IF NOT EXISTS idx_question_bank_skill_level  ON question_bank (skill, level) WHERE NOT is_deleted;
CREATE INDEX IF NOT EXISTS idx_question_bank_topic        ON question_bank (topic)        WHERE NOT is_deleted;
CREATE INDEX IF NOT EXISTS idx_question_bank_tags         ON question_bank USING GIN (tags) WHERE NOT is_deleted;

CREATE TRIGGER trg_question_bank_updated_at
  BEFORE UPDATE ON question_bank
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Options for bank questions (same structure as test_question_options)
CREATE TABLE IF NOT EXISTS question_bank_options (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bank_id      UUID NOT NULL REFERENCES question_bank(id) ON DELETE CASCADE,
  option_text  TEXT NOT NULL,
  is_correct   BOOLEAN NOT NULL DEFAULT FALSE,
  order_index  INTEGER NOT NULL DEFAULT 0
);

-- RLS
ALTER TABLE question_bank         ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_bank_options ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_read_question_bank"          ON question_bank         FOR SELECT TO authenticated USING (auth.uid() = created_by OR is_public = true);
CREATE POLICY "auth_insert_question_bank"        ON question_bank         FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "auth_update_question_bank"        ON question_bank         FOR UPDATE TO authenticated USING (auth.uid() = created_by) WITH CHECK (auth.uid() = created_by);
CREATE POLICY "auth_delete_question_bank"        ON question_bank         FOR DELETE TO authenticated USING (auth.uid() = created_by);

CREATE POLICY "auth_read_question_bank_options"  ON question_bank_options FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM question_bank q WHERE q.id = bank_id AND (q.created_by = auth.uid() OR q.is_public = true)));
CREATE POLICY "auth_write_question_bank_options" ON question_bank_options FOR ALL    TO authenticated USING (EXISTS (SELECT 1 FROM question_bank q WHERE q.id = bank_id AND q.created_by = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM question_bank q WHERE q.id = bank_id AND q.created_by = auth.uid()));
