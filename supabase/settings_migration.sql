-- ============================================================
-- Add system_settings table to store center & bank settings
-- ============================================================

CREATE TABLE IF NOT EXISTS system_settings (
  key                 TEXT PRIMARY KEY,
  value               JSONB NOT NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "auth_read_system_settings" ON system_settings;
DROP POLICY IF EXISTS "auth_write_system_settings" ON system_settings;

-- Policy: authenticated user read/write all
CREATE POLICY "auth_read_system_settings" ON system_settings FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "auth_write_system_settings" ON system_settings FOR ALL    USING (auth.role() = 'authenticated');

-- Insert initial values
INSERT INTO system_settings (key, value) VALUES
('center_settings', '{"name": "Trung tâm Anh ngữ ESL", "address": "123 Nguyễn Huệ, Q.1, TP.HCM", "phone": "028 1234 5678", "email": "info@esl.edu.vn"}'::jsonb),
('bank_settings', '{"bank_id": "", "bank_bin_id": "", "account_no": "", "account_name": ""}'::jsonb),
('general_settings', '{"email_notify": true, "sms_notify": false, "auto_report": true, "online_reg": true}'::jsonb)
ON CONFLICT (key) DO NOTHING;
