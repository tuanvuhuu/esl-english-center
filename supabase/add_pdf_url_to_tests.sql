-- Add pdf_url column to tests table
ALTER TABLE tests ADD COLUMN IF NOT EXISTS pdf_url TEXT;
