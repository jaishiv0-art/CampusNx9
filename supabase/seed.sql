-- ==============================================================================
-- ASCEND: LIFE RPG PRODUCTIVITY APP - SEED DATA
-- Default items, cosmetics, themes, and achievements catalog
-- ==============================================================================

-- 1. SEED SHOP ITEMS
INSERT INTO public.items (name, description, category, price, icon, rarity, effect_type, effect_value)
VALUES
  -- Themes
  ('Obsidian Void Theme', 'A pitch-black interface with deep violet luminescent accents.', 'Theme', 200, 'Palette', 'Rare', 'theme_unlock', 'theme-void'),
  ('Solar Flare Theme', 'A radiant gold and amber cyberpunk UI inspired by solar cores.', 'Theme', 300, 'Sun', 'Epic', 'theme_unlock', 'theme-solar'),
  ('Emerald Matrix Theme', 'High-tech matrix green terminal glow and digital rain aesthetic.', 'Theme', 350, 'Terminal', 'Epic', 'theme_unlock', 'theme-matrix'),
  ('Crimson Vanguard Theme', 'Aggressive tactical red and crimson HUD styling.', 'Theme', 450, 'Flame', 'Legendary', 'theme_unlock', 'theme-crimson'),
  ('Cyberpunk Neon Theme', 'Default luminous cyan and electric magenta grid aesthetic.', 'Theme', 0, 'Sparkles', 'Common', 'theme_unlock', 'theme-cyberpunk'),

  -- Badges
  ('Novice Slayer Badge', 'Proof of completing your first 5 quests in the Ascend universe.', 'Badge', 100, 'ShieldCheck', 'Common', 'badge_unlock', 'badge-novice'),
  ('Neural Architect Badge', 'Awarded to master planners and intellect specialists.', 'Badge', 250, 'BrainCircuit', 'Rare', 'badge_unlock', 'badge-architect'),
  ('Iron Will Crest', 'Worn by disciples of unrelenting daily discipline.', 'Badge', 300, 'Dumbbell', 'Epic', 'badge_unlock', 'badge-iron-will'),
  ('Titan of the Grid', 'Legendary emblem worn only by Grandmaster productivity warriors.', 'Badge', 600, 'Crown', 'Legendary', 'badge_unlock', 'badge-titan'),
  ('Ascendant Singularity', 'Mythic crest representing mastery over all six life attributes.', 'Badge', 1200, 'Infinity', 'Mythic', 'badge_unlock', 'badge-singularity'),

  -- Titles
  ('The Relentless', 'Display title: "Ayush the Relentless"', 'Title', 150, 'Tag', 'Rare', 'title_unlock', 'The Relentless'),
  ('Neural Overlord', 'Display title: "Ayush, Neural Overlord"', 'Title', 350, 'Zap', 'Epic', 'title_unlock', 'Neural Overlord'),
  ('Shadow Operator', 'Display title: "Ayush, Shadow Operator"', 'Title', 400, 'EyeOff', 'Epic', 'title_unlock', 'Shadow Operator'),
  ('Grand Ascendant', 'Display title: "Ayush, Grand Ascendant"', 'Title', 800, 'Award', 'Legendary', 'title_unlock', 'Grand Ascendant'),

  -- Frames
  ('Neon Hexagon Frame', 'Glowing cyan polygon border around your avatar portrait.', 'Frame', 180, 'Hexagon', 'Rare', 'frame_unlock', 'frame-hex'),
  ('Plasma Holo-Ring', 'Rotating quantum plasma ring surrounding your character icon.', 'Frame', 320, 'CircleDot', 'Epic', 'frame_unlock', 'frame-plasma'),
  ('Celestial Aureole', 'Divine golden aura with pulsing particle effects.', 'Frame', 750, 'Sparkles', 'Legendary', 'frame_unlock', 'frame-celestial'),

  -- Consumables & Perks
  ('Streak Freeze Relic', 'Protects your streak from resetting if you miss a calendar day.', 'Consumable', 120, 'ShieldAlert', 'Common', 'streak_freeze', '1'),
  ('Elixir of Focus (2x XP)', 'Grants 2x XP for the next 3 completed quests.', 'Consumable', 180, 'FlaskConical', 'Rare', 'xp_boost', '2x_3quests'),
  ('Guild Bounty License', 'Unlocks special high-reward Legendary daily quests.', 'Consumable', 250, 'Scroll', 'Epic', 'bounty_license', 'unlocked')
ON CONFLICT (name) DO NOTHING;

-- 2. SEED ACHIEVEMENTS CATALOG
INSERT INTO public.achievements (code, title, description, category, icon, reward_xp, reward_gold, target_metric, threshold)
VALUES
  -- General & First Steps
  ('FIRST_QUEST', 'The Awakening', 'Complete your very first quest in ASCEND.', 'General', 'Zap', 100, 50, 'quests_completed', 1),
  ('LEVEL_5', 'Rising Seeker', 'Reach Character Level 5 through disciplined effort.', 'General', 'TrendingUp', 200, 100, 'level_reached', 5),
  ('LEVEL_10', 'Adept Ascendant', 'Reach Character Level 10 and unlock Adept status.', 'General', 'Award', 500, 250, 'level_reached', 10),
  ('LEVEL_25', 'Grand Paragon', 'Reach Character Level 25 and attain Grandmaster rank.', 'General', 'Crown', 1500, 750, 'level_reached', 25),

  -- Quests Milestones
  ('QUESTS_10', 'Quest Apprentice', 'Complete 10 quests across any life categories.', 'Quests', 'CheckCircle2', 250, 100, 'quests_completed', 10),
  ('QUESTS_50', 'Task Eradicator', 'Complete 50 life quests with precision.', 'Quests', 'Swords', 800, 400, 'quests_completed', 50),
  ('QUESTS_100', 'Centurion of Action', 'Complete 100 quests in your ASCEND journey.', 'Quests', 'Flame', 2000, 1000, 'quests_completed', 100),

  -- Streaks
  ('STREAK_3', 'Momentum Spark', 'Maintain a 3-day quest completion streak.', 'Streaks', 'Flame', 150, 75, 'streak_days', 3),
  ('STREAK_7', 'Unbroken Week', 'Sustain a perfect 7-day daily execution streak.', 'Streaks', 'Sparkles', 400, 200, 'streak_days', 7),
  ('STREAK_30', 'Habit Titan', 'Achieve a legendary 30-day streak of relentless consistency.', 'Streaks', 'Trophy', 1500, 800, 'streak_days', 30),
  ('STREAK_100', 'Ascendant Discipline', 'Reach an unbroken 100-day daily streak.', 'Streaks', 'Infinity', 5000, 2500, 'streak_days', 100),

  -- Attributes & Economy
  ('INTELLECT_100', 'Neural Mastery', 'Accumulate 500 Intellect XP from deep work and learning.', 'Attributes', 'Brain', 300, 150, 'attribute_points', 500),
  ('STRENGTH_100', 'Titan Physiology', 'Accumulate 500 Strength & Vitality XP from health and workouts.', 'Attributes', 'Activity', 300, 150, 'attribute_points', 500),
  ('GOLD_1000', 'Guild Merchant', 'Accumulate 1,000 total Gold earned in the ASCEND economy.', 'Economy', 'Coins', 500, 250, 'gold_earned', 1000),
  ('SHOP_PATRON', 'Grid Shopper', 'Purchase your first cosmetic or perk item from the Guild Shop.', 'Economy', 'ShoppingBag', 200, 100, 'items_purchased', 1)
ON CONFLICT (code) DO NOTHING;
