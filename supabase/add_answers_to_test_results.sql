-- Add answers and grading_status columns to test_results table
ALTER TABLE test_results ADD COLUMN IF NOT EXISTS answers JSONB DEFAULT '{}'::jsonb;
ALTER TABLE test_results ADD COLUMN IF NOT EXISTS grading_status TEXT DEFAULT 'graded' CHECK (grading_status IN ('graded', 'pending'));
