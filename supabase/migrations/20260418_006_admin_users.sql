CREATE TABLE admin_users (
  user_id      uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text NOT NULL,
  role         text NOT NULL DEFAULT 'admin'
    CHECK (role IN ('admin','super_admin')),
  created_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
