-- ============================================================
-- CEFR VOCABULARY BANK — kho từ vựng và ví dụ mẫu
-- ============================================================

CREATE TABLE IF NOT EXISTS vocabulary_bank (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  word             TEXT NOT NULL UNIQUE,
  meaning_vi       TEXT,                               -- Nghĩa tiếng Việt
  meaning_en       TEXT,                               -- Nghĩa tiếng Anh
  phonetic         TEXT,                               -- Phiên âm IPA
  audio_url        TEXT,                               -- Link audio phát âm (.mp3)
  part_of_speech   TEXT,                               -- noun, verb, adj, adv, etc.
  cefr_level       TEXT NOT NULL,                      -- A1, A2, B1, B2, C1, C2
  topic            TEXT,                               -- animals, food, grammar, etc.
  example_sentence TEXT,
  example_vi       TEXT,
  source           TEXT DEFAULT 'cefr',                -- cefr, teacher, etc.
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger to auto-update updated_at
CREATE TRIGGER trg_vocabulary_bank_updated_at
  BEFORE UPDATE ON vocabulary_bank
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Indexes for quick lookup
CREATE INDEX IF NOT EXISTS idx_vocab_level ON vocabulary_bank(cefr_level);
CREATE INDEX IF NOT EXISTS idx_vocab_topic ON vocabulary_bank(topic);
CREATE INDEX IF NOT EXISTS idx_vocab_word  ON vocabulary_bank(word);

-- Enable RLS
ALTER TABLE vocabulary_bank ENABLE ROW LEVEL SECURITY;

-- Row Level Security policies
CREATE POLICY "auth_read_vocabulary_bank"  ON vocabulary_bank FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_write_vocabulary_bank" ON vocabulary_bank FOR ALL    TO authenticated USING (true) WITH CHECK (true);
