-- ============================================================
-- TESTS & TEST_RESULTS — migration
-- ============================================================

-- 1. tests table
CREATE TABLE IF NOT EXISTS tests (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  class_id        UUID NOT NULL REFERENCES classes(id),
  name            TEXT NOT NULL,
  type            TEXT NOT NULL DEFAULT 'quiz'
                  CHECK (type IN ('quiz', 'unit_test', 'midterm', 'final', 'speaking', 'placement')),
  test_date       DATE NOT NULL,
  total_score     NUMERIC NOT NULL DEFAULT 100,
  pass_threshold  NUMERIC NOT NULL DEFAULT 60,
  description     TEXT,
  status          TEXT NOT NULL DEFAULT 'upcoming'
                  CHECK (status IN ('upcoming', 'completed', 'cancelled')),

  is_deleted      BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by      UUID,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by      UUID
);

CREATE TRIGGER trg_tests_updated_at
  BEFORE UPDATE ON tests
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 2. test_results table
CREATE TABLE IF NOT EXISTS test_results (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  test_id          UUID NOT NULL REFERENCES tests(id),
  student_id       UUID NOT NULL REFERENCES students(id),

  score_reading    NUMERIC CHECK (score_reading    BETWEEN 0 AND 100),
  score_listening  NUMERIC CHECK (score_listening  BETWEEN 0 AND 100),
  score_speaking   NUMERIC CHECK (score_speaking   BETWEEN 0 AND 100),
  score_writing    NUMERIC CHECK (score_writing    BETWEEN 0 AND 100),
  total_score      NUMERIC CHECK (total_score      BETWEEN 0 AND 100),
  is_passed        BOOLEAN,

  teacher_feedback TEXT,
  ai_feedback      TEXT,

  is_deleted       BOOLEAN NOT NULL DEFAULT FALSE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by       UUID,
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by       UUID,

  UNIQUE (test_id, student_id)
);

CREATE TRIGGER trg_test_results_updated_at
  BEFORE UPDATE ON test_results
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE tests        ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_read_tests"  ON tests FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_write_tests" ON tests FOR ALL    TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_read_test_results"  ON test_results FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "auth_write_test_results" ON test_results FOR ALL    USING (auth.role() = 'authenticated');

-- ============================================================
-- TEST QUESTIONS & OPTIONS
-- ============================================================

-- 3. test_questions
CREATE TABLE IF NOT EXISTS test_questions (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  test_id       UUID NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
  skill         TEXT NOT NULL DEFAULT 'general'
                CHECK (skill IN ('reading', 'listening', 'speaking', 'writing', 'general')),
  type          TEXT NOT NULL DEFAULT 'mcq'
                CHECK (type IN ('mcq', 'true_false', 'fill_blank', 'short_answer', 'essay', 'speaking_prompt')),
  question_text TEXT NOT NULL,
  image_url     TEXT,
  audio_url     TEXT,
  points        NUMERIC NOT NULL DEFAULT 1,
  order_index   INTEGER NOT NULL DEFAULT 0,
  explanation   TEXT,
  is_deleted    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by    UUID,
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by    UUID
);

CREATE TRIGGER trg_test_questions_updated_at
  BEFORE UPDATE ON test_questions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 4. test_question_options  (MCQ / true_false only)
CREATE TABLE IF NOT EXISTS test_question_options (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question_id  UUID NOT NULL REFERENCES test_questions(id) ON DELETE CASCADE,
  option_text  TEXT NOT NULL,
  is_correct   BOOLEAN NOT NULL DEFAULT FALSE,
  order_index  INTEGER NOT NULL DEFAULT 0
);

-- RLS
ALTER TABLE test_questions        ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_question_options ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_read_test_questions"         ON test_questions        FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "auth_write_test_questions"        ON test_questions        FOR ALL    USING (auth.role() = 'authenticated');
CREATE POLICY "auth_read_test_question_options"  ON test_question_options FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "auth_write_test_question_options" ON test_question_options FOR ALL    USING (auth.role() = 'authenticated');
