-- ==============================================================================
-- CampusNx9 (CIT) - Supabase Profiles & Authentication Migration
-- File: supabase/migrations/01_auth_profiles.sql
-- ==============================================================================

-- 1. Ensure public.profiles exists and contains all required institutional fields
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT,
    full_name TEXT,
    email TEXT,
    role TEXT NOT NULL DEFAULT 'FACULTY',
    department TEXT,
    faculty_id TEXT,
    org TEXT,
    approval_status TEXT NOT NULL DEFAULT 'pending',
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Add columns if table already existed without them
ALTER TABLE public.profiles 
    ADD COLUMN IF NOT EXISTS user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    ADD COLUMN IF NOT EXISTS username TEXT,
    ADD COLUMN IF NOT EXISTS full_name TEXT,
    ADD COLUMN IF NOT EXISTS email TEXT,
    ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'FACULTY',
    ADD COLUMN IF NOT EXISTS department TEXT,
    ADD COLUMN IF NOT EXISTS faculty_id TEXT,
    ADD COLUMN IF NOT EXISTS org TEXT,
    ADD COLUMN IF NOT EXISTS approval_status TEXT NOT NULL DEFAULT 'pending',
    ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL;

-- 3. Case-insensitive Unique Constraint on username
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_username_lower ON public.profiles (LOWER(TRIM(username)));

-- 4. Role validation check constraint (Enforce 4 valid institutional roles)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'check_profiles_role'
    ) THEN
        ALTER TABLE public.profiles ADD CONSTRAINT check_profiles_role 
            CHECK (role IN ('ADMIN', 'DEPARTMENT_COORDINATOR', 'FACULTY', 'CLUB_REPRESENTATIVE'));
    END IF;
END $$;

-- 5. Approval status check constraint (pending, approved, rejected)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'check_profiles_approval_status'
    ) THEN
        ALTER TABLE public.profiles ADD CONSTRAINT check_profiles_approval_status 
            CHECK (approval_status IN ('pending', 'approved', 'rejected'));
    END IF;
END $$;

-- 6. Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 7. RLS Policies

-- Policy A: SELECT
-- Users can view their own profile; Approved Admins can view all profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" 
    ON public.profiles FOR SELECT 
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles" 
    ON public.profiles FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE user_id = auth.uid() AND role = 'ADMIN' AND approval_status = 'approved'
        )
    );

-- Policy B: INSERT
-- Users can insert their own profile with 'pending' status only, and CANNOT self-assign 'ADMIN'
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" 
    ON public.profiles FOR INSERT 
    WITH CHECK (
        auth.uid() = user_id 
        AND approval_status = 'pending' 
        AND role != 'ADMIN'
    );

-- Policy C: UPDATE
-- Normal users can update their own personal info (full_name), but CANNOT modify role or approval_status
DROP POLICY IF EXISTS "Users can update own personal info only" ON public.profiles;
CREATE POLICY "Users can update own personal info only" 
    ON public.profiles FOR UPDATE 
    USING (auth.uid() = user_id)
    WITH CHECK (
        auth.uid() = user_id
        AND role = (SELECT p.role FROM public.profiles p WHERE p.user_id = auth.uid())
        AND approval_status = (SELECT p.approval_status FROM public.profiles p WHERE p.user_id = auth.uid())
    );

-- Policy D: UPDATE (Admins)
-- Approved Admins can update any profile (e.g., approving accounts, assigning roles)
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
CREATE POLICY "Admins can update all profiles" 
    ON public.profiles FOR UPDATE 
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE user_id = auth.uid() AND role = 'ADMIN' AND approval_status = 'approved'
        )
    );

-- 8. Auto-create Profile Trigger on auth.users Signup
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
DECLARE
    requested_role TEXT;
    requested_username TEXT;
    requested_full_name TEXT;
    requested_dept TEXT;
    requested_org TEXT;
BEGIN
    -- Extract metadata supplied during signUp()
    requested_role := COALESCE(NEW.raw_user_meta_data->>'role', 'FACULTY');
    -- Enforce that self-assigned ADMIN is strictly prohibited: fallback to FACULTY
    IF requested_role = 'ADMIN' THEN
        requested_role := 'FACULTY';
    END IF;

    requested_username := COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1));
    requested_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', '');
    requested_dept := NEW.raw_user_meta_data->>'department';
    requested_org := NEW.raw_user_meta_data->>'org';

    INSERT INTO public.profiles (
        user_id,
        username,
        full_name,
        email,
        role,
        department,
        org,
        approval_status,
        active
    ) VALUES (
        NEW.id,
        requested_username,
        requested_full_name,
        NEW.email,
        requested_role,
        requested_dept,
        requested_org,
        'pending',
        TRUE
    )
    ON CONFLICT (user_id) DO NOTHING;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger execution on auth.users insert
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
