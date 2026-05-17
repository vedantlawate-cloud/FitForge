-- ============================================================
-- FitForge Database Schema
-- PostgreSQL 14+
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- USERS & AUTH
-- ============================================================

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100),
    avatar_url TEXT,
    bio TEXT,
    date_of_birth DATE,
    gender VARCHAR(20) CHECK (gender IN ('male', 'female', 'non-binary', 'prefer_not_to_say')),
    height_cm DECIMAL(5,2),
    weight_kg DECIMAL(6,2),
    activity_level VARCHAR(30) DEFAULT 'moderately_active' 
        CHECK (activity_level IN ('sedentary', 'lightly_active', 'moderately_active', 'very_active', 'super_active')),
    fitness_goal VARCHAR(30) DEFAULT 'maintain'
        CHECK (fitness_goal IN ('lose_weight', 'maintain', 'gain_muscle', 'improve_endurance', 'general_fitness')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    theme VARCHAR(20) DEFAULT 'dark' CHECK (theme IN ('dark', 'light', 'system')),
    unit_system VARCHAR(10) DEFAULT 'metric' CHECK (unit_system IN ('metric', 'imperial')),
    calorie_goal INTEGER DEFAULT 2000,
    protein_goal_g INTEGER DEFAULT 150,
    carbs_goal_g INTEGER DEFAULT 250,
    fat_goal_g INTEGER DEFAULT 65,
    water_goal_ml INTEGER DEFAULT 2500,
    step_goal INTEGER DEFAULT 10000,
    notifications_enabled BOOLEAN DEFAULT TRUE,
    weekly_report_email BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

CREATE TABLE IF NOT EXISTS refresh_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    token TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- BODY MEASUREMENTS
-- ============================================================

CREATE TABLE IF NOT EXISTS body_measurements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    logged_date DATE NOT NULL DEFAULT CURRENT_DATE,
    weight_kg DECIMAL(6,2),
    body_fat_pct DECIMAL(4,1),
    muscle_mass_kg DECIMAL(6,2),
    bmi DECIMAL(4,1),
    chest_cm DECIMAL(5,1),
    waist_cm DECIMAL(5,1),
    hips_cm DECIMAL(5,1),
    bicep_cm DECIMAL(5,1),
    thigh_cm DECIMAL(5,1),
    calf_cm DECIMAL(5,1),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- FOOD & NUTRITION
-- ============================================================

CREATE TABLE IF NOT EXISTS foods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    brand VARCHAR(100),
    barcode VARCHAR(50),
    serving_size_g DECIMAL(8,2) DEFAULT 100,
    serving_description VARCHAR(100) DEFAULT '100g',
    calories_per_serving DECIMAL(8,2) NOT NULL,
    protein_g DECIMAL(8,2) DEFAULT 0,
    carbs_g DECIMAL(8,2) DEFAULT 0,
    fat_g DECIMAL(8,2) DEFAULT 0,
    fiber_g DECIMAL(8,2) DEFAULT 0,
    sugar_g DECIMAL(8,2) DEFAULT 0,
    sodium_mg DECIMAL(8,2) DEFAULT 0,
    is_custom BOOLEAN DEFAULT FALSE,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS food_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    food_id UUID REFERENCES foods(id) ON DELETE CASCADE,
    logged_date DATE NOT NULL DEFAULT CURRENT_DATE,
    meal_type VARCHAR(20) NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack', 'pre_workout', 'post_workout')),
    quantity_g DECIMAL(8,2) NOT NULL,
    calories DECIMAL(8,2),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS water_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    logged_date DATE NOT NULL DEFAULT CURRENT_DATE,
    amount_ml INTEGER NOT NULL,
    logged_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- DIET ROUTINES
-- ============================================================

CREATE TABLE IF NOT EXISTS diet_routines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    diet_type VARCHAR(50) CHECK (diet_type IN ('balanced', 'keto', 'paleo', 'vegan', 'vegetarian', 'carnivore', 'mediterranean', 'custom')),
    calorie_target INTEGER,
    protein_target_g INTEGER,
    carbs_target_g INTEGER,
    fat_target_g INTEGER,
    is_active BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS diet_routine_meals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    routine_id UUID REFERENCES diet_routines(id) ON DELETE CASCADE,
    day_of_week INTEGER CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Sunday
    meal_type VARCHAR(20) NOT NULL,
    meal_name VARCHAR(100),
    description TEXT,
    target_calories INTEGER,
    notes TEXT
);

-- ============================================================
-- EXERCISE LIBRARY
-- ============================================================

CREATE TABLE IF NOT EXISTS exercises (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(150) NOT NULL,
    category VARCHAR(50) CHECK (category IN ('strength', 'cardio', 'flexibility', 'balance', 'sports', 'other')),
    muscle_group_primary VARCHAR(50),
    muscle_groups_secondary TEXT[], -- Array of muscle groups
    equipment VARCHAR(50) CHECK (equipment IN ('barbell', 'dumbbell', 'cable', 'machine', 'bodyweight', 'kettlebell', 'bands', 'other', 'none')),
    difficulty VARCHAR(20) DEFAULT 'intermediate' CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
    instructions TEXT,
    tips TEXT,
    is_custom BOOLEAN DEFAULT FALSE,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- WORKOUT ROUTINES
-- ============================================================

CREATE TABLE IF NOT EXISTS workout_routines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    goal VARCHAR(50) CHECK (goal IN ('strength', 'hypertrophy', 'endurance', 'weight_loss', 'athletic', 'general')),
    days_per_week INTEGER CHECK (days_per_week BETWEEN 1 AND 7),
    estimated_duration_min INTEGER,
    is_active BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS workout_days (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    routine_id UUID REFERENCES workout_routines(id) ON DELETE CASCADE,
    day_number INTEGER NOT NULL CHECK (day_number BETWEEN 1 AND 7),
    name VARCHAR(100), -- e.g. "Push Day", "Leg Day"
    focus VARCHAR(100),
    notes TEXT
);

CREATE TABLE IF NOT EXISTS workout_day_exercises (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workout_day_id UUID REFERENCES workout_days(id) ON DELETE CASCADE,
    exercise_id UUID REFERENCES exercises(id) ON DELETE CASCADE,
    order_index INTEGER NOT NULL DEFAULT 0,
    sets INTEGER NOT NULL DEFAULT 3,
    reps_min INTEGER,
    reps_max INTEGER,
    rpe DECIMAL(3,1), -- Rate of perceived exertion
    rest_seconds INTEGER DEFAULT 90,
    tempo VARCHAR(20), -- e.g. "3-1-2-0"
    notes TEXT
);

-- ============================================================
-- WORKOUT SESSIONS (Logs)
-- ============================================================

CREATE TABLE IF NOT EXISTS workout_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    routine_id UUID REFERENCES workout_routines(id) ON DELETE SET NULL,
    workout_day_id UUID REFERENCES workout_days(id) ON DELETE SET NULL,
    name VARCHAR(100),
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    duration_minutes INTEGER,
    calories_burned INTEGER,
    notes TEXT,
    rating INTEGER CHECK (rating BETWEEN 1 AND 5),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS workout_set_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES workout_sessions(id) ON DELETE CASCADE,
    exercise_id UUID REFERENCES exercises(id) ON DELETE CASCADE,
    set_number INTEGER NOT NULL,
    weight_kg DECIMAL(6,2),
    reps INTEGER,
    duration_seconds INTEGER, -- for timed exercises
    distance_m DECIMAL(8,2),  -- for cardio
    rpe DECIMAL(3,1),
    is_pr BOOLEAN DEFAULT FALSE,
    notes TEXT,
    logged_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PERSONAL RECORDS (PRs)
-- ============================================================

CREATE TABLE IF NOT EXISTS personal_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    exercise_id UUID REFERENCES exercises(id) ON DELETE CASCADE,
    record_type VARCHAR(20) DEFAULT '1rm' CHECK (record_type IN ('1rm', '3rm', '5rm', '10rm', 'endurance', 'distance', 'custom')),
    value DECIMAL(8,2) NOT NULL, -- weight in kg or reps or time
    unit VARCHAR(20) DEFAULT 'kg',
    reps INTEGER DEFAULT 1,
    achieved_at DATE NOT NULL DEFAULT CURRENT_DATE,
    session_id UUID REFERENCES workout_sessions(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- DAILY ACTIVITY
-- ============================================================

CREATE TABLE IF NOT EXISTS daily_activity (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    logged_date DATE NOT NULL DEFAULT CURRENT_DATE,
    steps INTEGER DEFAULT 0,
    active_minutes INTEGER DEFAULT 0,
    calories_burned INTEGER DEFAULT 0,
    sleep_hours DECIMAL(4,1),
    sleep_quality INTEGER CHECK (sleep_quality BETWEEN 1 AND 5),
    mood INTEGER CHECK (mood BETWEEN 1 AND 5),
    energy_level INTEGER CHECK (energy_level BETWEEN 1 AND 5),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, logged_date)
);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX idx_food_logs_user_date ON food_logs(user_id, logged_date);
CREATE INDEX idx_workout_sessions_user ON workout_sessions(user_id);
CREATE INDEX idx_workout_set_logs_session ON workout_set_logs(session_id);
CREATE INDEX idx_personal_records_user_exercise ON personal_records(user_id, exercise_id);
CREATE INDEX idx_body_measurements_user_date ON body_measurements(user_id, logged_date);
CREATE INDEX idx_daily_activity_user_date ON daily_activity(user_id, logged_date);
CREATE INDEX idx_water_logs_user_date ON water_logs(user_id, logged_date);

-- ============================================================
-- TRIGGERS: auto-update updated_at
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_user_settings_updated_at BEFORE UPDATE ON user_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_workout_routines_updated_at BEFORE UPDATE ON workout_routines
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_diet_routines_updated_at BEFORE UPDATE ON diet_routines
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
