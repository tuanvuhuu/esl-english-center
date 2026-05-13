-- ============================================================
-- Tạo tài khoản admin: esl_center@gmail.com
-- Mật khẩu mặc định: Admin@2026  (đổi sau khi login)
-- ============================================================

DO $$
DECLARE
  new_user_id UUID := uuid_generate_v4();
BEGIN
  -- Bỏ qua nếu email đã tồn tại
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = 'esl_center@gmail.com') THEN
    RAISE NOTICE 'User esl_center@gmail.com đã tồn tại, bỏ qua.';
    RETURN;
  END IF;

  -- 1. Tạo user trong auth.users
  INSERT INTO auth.users (
    id, instance_id, aud, role,
    email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data,
    is_super_admin, created_at, updated_at,
    confirmation_token, recovery_token,
    email_change_token_new, email_change
  ) VALUES (
    new_user_id,
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated',
    'esl_center@gmail.com',
    crypt('Admin@2026', gen_salt('bf')),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"ESL Admin","role":"admin"}',
    FALSE, NOW(), NOW(),
    '', '', '', ''
  );

  -- 2. Bắt buộc phải có identity record để login được
  INSERT INTO auth.identities (
    id, user_id, provider_id, identity_data,
    provider, last_sign_in_at, created_at, updated_at
  ) VALUES (
    uuid_generate_v4(),
    new_user_id,
    'esl_center@gmail.com',
    format('{"sub":"%s","email":"esl_center@gmail.com"}', new_user_id)::jsonb,
    'email',
    NOW(), NOW(), NOW()
  );

  -- 3. Tạo profile với role admin
  INSERT INTO public.profiles (id, full_name, role_id)
  VALUES (
    new_user_id,
    'ESL Admin',
    'f0000000-0000-0000-0000-000000000001'
  )
  ON CONFLICT (id) DO UPDATE
    SET role_id = 'f0000000-0000-0000-0000-000000000001';

END $$;
