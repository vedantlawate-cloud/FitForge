-- ============================================================
-- FitForge Seed Data
-- ============================================================

-- Common exercises
INSERT INTO exercises (name, category, muscle_group_primary, muscle_groups_secondary, equipment, difficulty, instructions) VALUES
-- Chest
('Barbell Bench Press', 'strength', 'chest', ARRAY['triceps', 'front_deltoid'], 'barbell', 'intermediate', 'Lie flat on bench, grip bar slightly wider than shoulder-width. Lower bar to chest, press back up explosively.'),
('Incline Dumbbell Press', 'strength', 'chest', ARRAY['triceps', 'front_deltoid'], 'dumbbell', 'intermediate', 'Set bench to 30-45 degrees. Press dumbbells from chest level to lockout.'),
('Cable Flyes', 'strength', 'chest', ARRAY['front_deltoid'], 'cable', 'beginner', 'Set cables at shoulder height, step forward, bring hands together in arc motion.'),
('Push Ups', 'strength', 'chest', ARRAY['triceps', 'front_deltoid'], 'bodyweight', 'beginner', 'Hands shoulder-width, body straight, lower chest to floor then push up.'),
('Dips (Chest)', 'strength', 'chest', ARRAY['triceps', 'front_deltoid'], 'bodyweight', 'intermediate', 'Lean forward slightly, lower until upper arms parallel to floor.'),

-- Back
('Deadlift', 'strength', 'lower_back', ARRAY['glutes', 'hamstrings', 'traps', 'lats'], 'barbell', 'advanced', 'Stand with bar over mid-foot, hinge at hips, grip bar, drive through floor to stand.'),
('Pull Ups', 'strength', 'lats', ARRAY['biceps', 'rear_deltoid', 'rhomboids'], 'bodyweight', 'intermediate', 'Hang from bar with overhand grip, pull body up until chin above bar.'),
('Barbell Row', 'strength', 'lats', ARRAY['biceps', 'rear_deltoid', 'rhomboids'], 'barbell', 'intermediate', 'Hinge forward 45 degrees, row bar to lower chest, control descent.'),
('Lat Pulldown', 'strength', 'lats', ARRAY['biceps', 'rear_deltoid'], 'cable', 'beginner', 'Pull bar down to upper chest, keep elbows pointing down.'),
('Seated Cable Row', 'strength', 'rhomboids', ARRAY['biceps', 'lats'], 'cable', 'beginner', 'Sit upright, row handle to abdomen, squeeze shoulder blades.'),

-- Legs
('Barbell Squat', 'strength', 'quads', ARRAY['glutes', 'hamstrings', 'lower_back'], 'barbell', 'intermediate', 'Bar on traps, squat until thighs parallel, drive up through heels.'),
('Romanian Deadlift', 'strength', 'hamstrings', ARRAY['glutes', 'lower_back'], 'barbell', 'intermediate', 'Hold bar at hip level, hinge forward keeping legs straight, feel stretch.'),
('Leg Press', 'strength', 'quads', ARRAY['glutes', 'hamstrings'], 'machine', 'beginner', 'Push platform away, lower until 90 degrees, do not lock knees.'),
('Bulgarian Split Squat', 'strength', 'quads', ARRAY['glutes', 'hamstrings'], 'dumbbell', 'intermediate', 'Rear foot elevated, lower front knee toward floor.'),
('Leg Curl', 'strength', 'hamstrings', ARRAY['calves'], 'machine', 'beginner', 'Curl weight toward glutes, control the descent.'),
('Calf Raise', 'strength', 'calves', ARRAY[]::text[], 'machine', 'beginner', 'Rise onto toes as high as possible, lower fully for full stretch.'),

-- Shoulders
('Overhead Press', 'strength', 'front_deltoid', ARRAY['triceps', 'lateral_deltoid', 'traps'], 'barbell', 'intermediate', 'Press bar from collar bones to overhead lockout.'),
('Lateral Raise', 'strength', 'lateral_deltoid', ARRAY['traps'], 'dumbbell', 'beginner', 'Raise dumbbells to shoulder height with slight elbow bend.'),
('Face Pull', 'strength', 'rear_deltoid', ARRAY['rotator_cuff', 'rhomboids'], 'cable', 'beginner', 'Pull rope to face level, elbows high, rotate hands outward.'),
('Arnold Press', 'strength', 'front_deltoid', ARRAY['lateral_deltoid', 'triceps'], 'dumbbell', 'intermediate', 'Start with palms facing you, rotate as you press overhead.'),

-- Arms
('Barbell Curl', 'strength', 'biceps', ARRAY['forearms'], 'barbell', 'beginner', 'Curl bar from hip to shoulder level, keep elbows stationary.'),
('Hammer Curl', 'strength', 'biceps', ARRAY['forearms', 'brachialis'], 'dumbbell', 'beginner', 'Neutral grip curl, thumbs pointing up throughout movement.'),
('Tricep Pushdown', 'strength', 'triceps', ARRAY[]::text[], 'cable', 'beginner', 'Keep elbows at sides, push bar down to full extension.'),
('Skull Crushers', 'strength', 'triceps', ARRAY[]::text[], 'barbell', 'intermediate', 'Lower bar to forehead, extend to lockout keeping elbows tucked.'),

-- Core
('Plank', 'strength', 'core', ARRAY['lower_back', 'glutes'], 'bodyweight', 'beginner', 'Hold position with body straight, breathe steadily.'),
('Crunches', 'strength', 'core', ARRAY[]::text[], 'bodyweight', 'beginner', 'Curl shoulders toward hips, lower with control.'),
('Hanging Leg Raise', 'strength', 'core', ARRAY['hip_flexors'], 'bodyweight', 'intermediate', 'Hang from bar, raise legs to parallel or higher.'),
('Cable Crunch', 'strength', 'core', ARRAY[]::text[], 'cable', 'beginner', 'Kneel, pull rope toward floor crunching abs.'),

-- Cardio
('Running', 'cardio', 'quads', ARRAY['calves', 'glutes', 'core'], 'none', 'beginner', 'Maintain comfortable pace, breathe through nose and mouth.'),
('Cycling', 'cardio', 'quads', ARRAY['calves', 'glutes'], 'machine', 'beginner', 'Adjust seat height, pedal at consistent cadence.'),
('Jump Rope', 'cardio', 'calves', ARRAY['core', 'shoulders'], 'other', 'beginner', 'Keep elbows close, rotate wrists, stay on balls of feet.'),
('Rowing Machine', 'cardio', 'lats', ARRAY['core', 'quads', 'biceps'], 'machine', 'intermediate', 'Drive with legs first, then lean back, then pull arms.');

-- Common foods
INSERT INTO foods (name, brand, serving_size_g, serving_description, calories_per_serving, protein_g, carbs_g, fat_g, fiber_g) VALUES
('Chicken Breast (cooked)', NULL, 100, '100g', 165, 31, 0, 3.6, 0),
('Brown Rice (cooked)', NULL, 100, '100g', 123, 2.7, 25.6, 1, 1.8),
('White Rice (cooked)', NULL, 100, '100g', 130, 2.4, 28.6, 0.3, 0.4),
('Oats (dry)', NULL, 40, '40g serving', 148, 5.4, 27.4, 2.7, 4.1),
('Eggs (whole, large)', NULL, 50, '1 large egg', 72, 6, 0.4, 5, 0),
('Greek Yogurt (0% fat)', NULL, 150, '150g', 82, 14.5, 5.7, 0.4, 0),
('Banana', NULL, 118, '1 medium', 105, 1.3, 27, 0.4, 3.1),
('Broccoli', NULL, 100, '100g', 34, 2.8, 6.6, 0.4, 2.6),
('Sweet Potato', NULL, 100, '100g', 86, 1.6, 20.1, 0.1, 3),
('Salmon (fillet)', NULL, 100, '100g', 208, 20, 0, 13, 0),
('Whey Protein', 'Generic', 30, '1 scoop (30g)', 120, 24, 3, 1.5, 0),
('Almonds', NULL, 28, '28g (about 23 almonds)', 164, 6, 6, 14, 3.5),
('Avocado', NULL, 100, '100g', 160, 2, 9, 15, 7),
('Milk (whole)', NULL, 240, '1 cup (240ml)', 149, 8, 12, 8, 0),
('Whole Wheat Bread', NULL, 28, '1 slice', 69, 3.5, 12, 1, 1.9),
('Cottage Cheese', NULL, 100, '100g', 98, 11, 3.4, 4.3, 0),
('Tuna (canned in water)', NULL, 85, '1 can (85g)', 109, 25, 0, 1, 0),
('Quinoa (cooked)', NULL, 100, '100g', 120, 4.4, 21.3, 1.9, 2.8),
('Spinach', NULL, 100, '100g', 23, 2.9, 3.6, 0.4, 2.2),
('Peanut Butter', NULL, 16, '1 tbsp (16g)', 94, 4, 3, 8, 1);
