-- Add audio_url column to test_results (for speaking tests)
ALTER TABLE test_results ADD COLUMN IF NOT EXISTS speaking_audio_url TEXT;
