-- ==============================================================================
-- ASCEND: LIFE RPG PRODUCTIVITY APP - DATABASE SCHEMA
-- PostgreSQL schema for Supabase with Row Level Security (RLS)
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT NOT NULL,
    archetype TEXT NOT NULL DEFAULT 'Cyber Mage', -- Cyber Mage, Iron Titan, Shadow Rogue, Bio Hacker, Astral Sage, Nova Paladin
    avatar_url TEXT DEFAULT '/avatars/mage.png',
    level INTEGER NOT NULL DEFAULT 1,
    xp INTEGER NOT NULL DEFAULT 0,
    gold INTEGER NOT NULL DEFAULT 100,
    title TEXT DEFAULT 'Novice Seeker',
    theme TEXT DEFAULT 'cyberpunk',
    sound_enabled BOOLEAN DEFAULT true,
    timezone TEXT DEFAULT 'UTC',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. ATTRIBUTES TABLE (XP gained in each RPG stat)
CREATE TABLE IF NOT EXISTS public.attributes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    intellect_xp INTEGER NOT NULL DEFAULT 0,
    strength_xp INTEGER NOT NULL DEFAULT 0,
    vitality_xp INTEGER NOT NULL DEFAULT 0,
    discipline_xp INTEGER NOT NULL DEFAULT 0,
    creativity_xp INTEGER NOT NULL DEFAULT 0,
    charisma_xp INTEGER NOT NULL DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. STREAKS TABLE
CREATE TABLE IF NOT EXISTS public.streaks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    current_streak INTEGER NOT NULL DEFAULT 0,
    longest_streak INTEGER NOT NULL DEFAULT 0,
    last_completed_date DATE,
    streak_freeze_count INTEGER NOT NULL DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. QUESTS TABLE
CREATE TABLE IF NOT EXISTS public.quests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL DEFAULT 'Work', -- Work, Fitness, Learning, Habit, Creative, Social
    difficulty TEXT NOT NULL DEFAULT 'Medium', -- Easy, Medium, Hard, Epic, Legendary
    attribute TEXT NOT NULL DEFAULT 'Intellect', -- Intellect, Strength, Vitality, Discipline, Creativity, Charisma
    xp_reward INTEGER NOT NULL DEFAULT 50,
    gold_reward INTEGER NOT NULL DEFAULT 20,
    status TEXT NOT NULL DEFAULT 'Active', -- Active, Completed, Failed, Archived
    is_recurring BOOLEAN NOT NULL DEFAULT false,
    recurrence_interval TEXT DEFAULT 'Daily', -- Daily, Weekly, None
    recurring_days TEXT[],
    due_date TIMESTAMP WITH TIME ZONE,
    priority TEXT DEFAULT 'Medium', -- Low, Medium, High
    reminder_time TEXT,
    reminder_enabled BOOLEAN DEFAULT false,
    timer_minutes INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. QUEST COMPLETIONS LOG (For analytics & double-completion protection)
CREATE TABLE IF NOT EXISTS public.quest_completions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    quest_id UUID NOT NULL REFERENCES public.quests(id) ON DELETE CASCADE,
    xp_earned INTEGER NOT NULL,
    gold_earned INTEGER NOT NULL,
    attribute_earned TEXT NOT NULL,
    attribute_xp_earned INTEGER NOT NULL,
    completion_date DATE NOT NULL DEFAULT CURRENT_DATE,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. GUILD SHOP ITEMS
CREATE TABLE IF NOT EXISTS public.items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    description TEXT NOT NULL,
    category TEXT NOT NULL, -- Theme, Badge, Title, Frame, Consumable
    price INTEGER NOT NULL DEFAULT 100,
    icon TEXT NOT NULL,
    rarity TEXT NOT NULL DEFAULT 'Common', -- Common, Rare, Epic, Legendary, Mythic
    effect_type TEXT, -- theme_unlock, badge_unlock, title_unlock, frame_unlock, streak_freeze, xp_boost
    effect_value TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. USER INVENTORY
CREATE TABLE IF NOT EXISTS public.inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
    is_equipped BOOLEAN NOT NULL DEFAULT false,
    quantity INTEGER NOT NULL DEFAULT 1,
    acquired_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, item_id)
);

-- 8. ACHIEVEMENTS CATALOG
CREATE TABLE IF NOT EXISTS public.achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'General', -- General, Streaks, Quests, Attributes, Economy
    icon TEXT NOT NULL,
    reward_xp INTEGER NOT NULL DEFAULT 100,
    reward_gold INTEGER NOT NULL DEFAULT 50,
    target_metric TEXT NOT NULL, -- quests_completed, streak_days, level_reached, gold_earned, attribute_points
    threshold INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 9. USER ACHIEVEMENTS
CREATE TABLE IF NOT EXISTS public.user_achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    achievement_id UUID NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
    is_claimed BOOLEAN NOT NULL DEFAULT false,
    unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    claimed_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(user_id, achievement_id)
);

-- 10. TRANSACTIONS / AUDIT LOG
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- quest_reward, shop_purchase, achievement_claim, bonus
    amount INTEGER NOT NULL, -- positive for gains, negative for spent
    currency TEXT NOT NULL DEFAULT 'gold', -- gold, xp
    description TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- INDEXES FOR PERFORMANCE
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_quests_user_id ON public.quests(user_id);
CREATE INDEX IF NOT EXISTS idx_quests_status ON public.quests(status);
CREATE INDEX IF NOT EXISTS idx_quest_completions_user_date ON public.quest_completions(user_id, completion_date);
CREATE INDEX IF NOT EXISTS idx_inventory_user ON public.inventory(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user ON public.user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user ON public.transactions(user_id);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attributes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quest_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can view and edit only their own profile
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Attributes: Users can view and update own attributes
CREATE POLICY "Users can view own attributes" ON public.attributes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own attributes" ON public.attributes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own attributes" ON public.attributes FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Streaks: Users can view and update own streaks
CREATE POLICY "Users can view own streak" ON public.streaks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own streak" ON public.streaks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own streak" ON public.streaks FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Quests: Users can view, create, update, and delete own quests
CREATE POLICY "Users can view own quests" ON public.quests FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own quests" ON public.quests FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own quests" ON public.quests FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own quests" ON public.quests FOR DELETE USING (auth.uid() = user_id);

-- Quest completions: Users can view and record own completions
CREATE POLICY "Users can view own quest completions" ON public.quest_completions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own quest completions" ON public.quest_completions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Shop Items & Achievements are publicly readable by authenticated users
CREATE POLICY "Anyone can view shop items" ON public.items FOR SELECT TO authenticated, anon USING (true);
CREATE POLICY "Anyone can view achievements catalog" ON public.achievements FOR SELECT TO authenticated, anon USING (true);

-- Inventory: Users manage own inventory
CREATE POLICY "Users can view own inventory" ON public.inventory FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert into own inventory" ON public.inventory FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own inventory" ON public.inventory FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own inventory" ON public.inventory FOR DELETE USING (auth.uid() = user_id);

-- User Achievements: Users view and update own unlocked achievements
CREATE POLICY "Users can view own unlocked achievements" ON public.user_achievements FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own unlocked achievements" ON public.user_achievements FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own unlocked achievements" ON public.user_achievements FOR UPDATE USING (auth.uid() = user_id);

-- Transactions: Users view and record own transactions
CREATE POLICY "Users can view own transactions" ON public.transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own transactions" ON public.transactions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ==============================================================================
-- AUTOMATIC PROFILE & ATTRIBUTE INITIALIZATION TRIGGER ON USER SIGNUP
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    -- Insert default profile
    INSERT INTO public.profiles (user_id, username, archetype, avatar_url, level, xp, gold, title)
    VALUES (
        new.id,
        COALESCE(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
        COALESCE(new.raw_user_meta_data->>'archetype', 'Cyber Mage'),
        COALESCE(new.raw_user_meta_data->>'avatar_url', '/avatars/mage.png'),
        1,
        0,
        150,
        'Novice Seeker'
    );

    -- Insert default attributes
    INSERT INTO public.attributes (user_id, intellect_xp, strength_xp, vitality_xp, discipline_xp, creativity_xp, charisma_xp)
    VALUES (new.id, 0, 0, 0, 0, 0, 0);

    -- Insert default streak
    INSERT INTO public.streaks (user_id, current_streak, longest_streak, last_completed_date)
    VALUES (new.id, 0, 0, NULL);

    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- 11. PUBLIC READ-ONLY LEADERBOARD VIEW & RPC
-- Exposes ONLY non-sensitive progression fields: username, archetype, level, total_xp, achievement_count, title
-- Zero private fields (no email, no gold, no transactions, no private notes)
-- ==============================================================================
CREATE OR REPLACE VIEW public.leaderboard_view AS
SELECT
    p.user_id,
    p.username,
    p.archetype,
    p.avatar_url,
    p.level,
    p.xp AS total_xp,
    p.title,
    COUNT(ua.id)::INTEGER AS achievement_count,
    DENSE_RANK() OVER (ORDER BY p.level DESC, p.xp DESC) AS rank
FROM public.profiles p
LEFT JOIN public.user_achievements ua ON ua.user_id = p.user_id
GROUP BY p.user_id, p.username, p.archetype, p.avatar_url, p.level, p.xp, p.title;

-- Grant public read access to leaderboard view for all authenticated & anon users
GRANT SELECT ON public.leaderboard_view TO authenticated, anon;

-- Function to fetch top leaderboard entries + current user rank
CREATE OR REPLACE FUNCTION public.get_leaderboard(limit_count INTEGER DEFAULT 50)
RETURNS TABLE (
    user_id UUID,
    username TEXT,
    archetype TEXT,
    avatar_url TEXT,
    level INTEGER,
    total_xp INTEGER,
    title TEXT,
    achievement_count INTEGER,
    rank BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT *
    FROM public.leaderboard_view
    ORDER BY rank ASC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.get_leaderboard TO authenticated, anon;
