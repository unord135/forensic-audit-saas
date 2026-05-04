-- =============================================================
-- profiles
-- One row per user, auto-created by trigger on auth.users INSERT
-- =============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id           uuid        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email        text        NOT NULL,
  display_name text,
  created_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles: select own"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "profiles: insert own"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles: update own"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Trigger: auto-populate profiles when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================================
-- audit_runs
-- Persists every security scan result per user
-- =============================================================
CREATE TABLE IF NOT EXISTS public.audit_runs (
  id                    uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  score                 integer     NOT NULL CHECK (score BETWEEN 0 AND 100),
  scanned_files         integer     NOT NULL,
  secrets_count         integer     NOT NULL DEFAULT 0,
  vulnerabilities_count integer     NOT NULL DEFAULT 0,
  findings              jsonb       NOT NULL DEFAULT '{}',
  created_at            timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_runs ENABLE ROW LEVEL SECURITY;

-- Users can only read their own audit history
CREATE POLICY "audit_runs: select own"
  ON public.audit_runs FOR SELECT
  USING (auth.uid() = user_id);

-- Users can only insert their own audit runs
CREATE POLICY "audit_runs: insert own"
  ON public.audit_runs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Index for fast "latest N scans for this user" queries
CREATE INDEX IF NOT EXISTS audit_runs_user_created_idx
  ON public.audit_runs (user_id, created_at DESC);
