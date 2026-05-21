-- ============================================================
-- Add payment code (mã phiếu thu) to payments table
-- Format: PT-XXXXX (5 random alphanumeric characters)
-- ============================================================

-- 1. Add the code column
ALTER TABLE payments ADD COLUMN IF NOT EXISTS code TEXT UNIQUE;

-- 2. Create function to generate random payment code
CREATE OR REPLACE FUNCTION generate_payment_code()
RETURNS TRIGGER AS $$
DECLARE
  new_code TEXT;
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  i INT;
BEGIN
  IF NEW.code IS NULL THEN
    LOOP
      new_code := 'PT-';
      FOR i IN 1..5 LOOP
        new_code := new_code || substr(chars, floor(random() * length(chars) + 1)::int, 1);
      END LOOP;
      -- Check uniqueness
      EXIT WHEN NOT EXISTS (SELECT 1 FROM payments WHERE code = new_code);
    END LOOP;
    NEW.code := new_code;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Create trigger to auto-generate code on insert
DROP TRIGGER IF EXISTS trg_payments_generate_code ON payments;
CREATE TRIGGER trg_payments_generate_code
  BEFORE INSERT ON payments
  FOR EACH ROW EXECUTE FUNCTION generate_payment_code();

-- 4. Backfill existing payments that don't have a code
DO $$
DECLARE
  r RECORD;
  new_code TEXT;
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  i INT;
BEGIN
  FOR r IN SELECT id FROM payments WHERE code IS NULL LOOP
    LOOP
      new_code := 'PT-';
      FOR i IN 1..5 LOOP
        new_code := new_code || substr(chars, floor(random() * length(chars) + 1)::int, 1);
      END LOOP;
      EXIT WHEN NOT EXISTS (SELECT 1 FROM payments WHERE code = new_code);
    END LOOP;
    UPDATE payments SET code = new_code WHERE id = r.id;
  END LOOP;
END;
$$;
