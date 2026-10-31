-- ==============================================================================
-- CampusNx9 - Chilika Institute of Technology (CIT) Database Schema
-- Supabase / PostgreSQL Schema for Production Timetable & Campus Management
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if re-creating
DROP TABLE IF EXISTS audit CASCADE;
DROP TABLE IF EXISTS proposals CASCADE;
DROP TABLE IF EXISTS system_state CASCADE;
DROP TABLE IF EXISTS cancellations CASCADE;
DROP TABLE IF EXISTS booking_requests CASCADE;
DROP TABLE IF EXISTS exams CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;
DROP TABLE IF EXISTS courses CASCADE;
DROP TABLE IF EXISTS student_groups CASCADE;
DROP TABLE IF EXISTS faculty CASCADE;
DROP TABLE IF EXISTS room_unavailability CASCADE;
DROP TABLE IF EXISTS rooms CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 1. ROOMS TABLE
CREATE TABLE rooms (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    building TEXT NOT NULL,
    type TEXT NOT NULL,
    capacity INTEGER NOT NULL,
    features TEXT[] DEFAULT '{}',
    accessible BOOLEAN NOT NULL DEFAULT FALSE,
    allowed_uses TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. ROOM UNAVAILABILITY TABLE
CREATE TABLE room_unavailability (
    id SERIAL PRIMARY KEY,
    room_id TEXT NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    day TEXT NOT NULL,
    periods INTEGER[] NOT NULL,
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. FACULTY TABLE
CREATE TABLE faculty (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    department TEXT NOT NULL,
    max_hours_per_day INTEGER NOT NULL DEFAULT 4,
    needs_accessible BOOLEAN NOT NULL DEFAULT FALSE,
    unavailable JSONB DEFAULT '[]'::jsonb,
    preferences JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. STUDENT GROUPS TABLE
CREATE TABLE student_groups (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    year INTEGER NOT NULL,
    department TEXT NOT NULL,
    size INTEGER NOT NULL,
    needs_accessible BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. COURSES TABLE
CREATE TABLE courses (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    department TEXT NOT NULL,
    year INTEGER NOT NULL,
    lecture_hours INTEGER NOT NULL DEFAULT 0,
    tutorial_hours INTEGER NOT NULL DEFAULT 0,
    lab_blocks INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. SESSIONS TABLE
CREATE TABLE sessions (
    id TEXT PRIMARY KEY,
    course_id TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    kind TEXT NOT NULL CHECK (kind IN ('lecture', 'tutorial', 'lab')),
    groups TEXT[] NOT NULL,
    faculty_id TEXT NOT NULL REFERENCES faculty(id) ON DELETE CASCADE,
    size INTEGER NOT NULL,
    duration INTEGER NOT NULL DEFAULT 1,
    room_types TEXT[] NOT NULL,
    needs_accessible BOOLEAN NOT NULL DEFAULT FALSE,
    basket_slot TEXT,
    fixed_slot JSONB,
    day TEXT,
    start_period INTEGER,
    room_id TEXT REFERENCES rooms(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. SPECTRA WEEK BOOKING REQUESTS TABLE
CREATE TABLE booking_requests (
    id TEXT PRIMARY KEY,
    submitted_at TIMESTAMPTZ NOT NULL,
    requester TEXT NOT NULL,
    role TEXT NOT NULL,
    department TEXT,
    requested_category TEXT NOT NULL,
    title TEXT NOT NULL,
    attendance INTEGER NOT NULL,
    duration_periods INTEGER NOT NULL,
    windows JSONB NOT NULL,
    room_types TEXT[] NOT NULL,
    needs TEXT[] DEFAULT '{}',
    requested_room TEXT,
    mandatory_for_groups TEXT[] DEFAULT '{}',
    series_id TEXT,
    raw_text TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'alternative_offered', 'cancelled')),
    decision JSONB,
    decided_by TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. CANCELLATIONS TABLE
CREATE TABLE cancellations (
    request_id TEXT PRIMARY KEY,
    cancelled_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    reason TEXT
);

-- 9. MIDSEM EXAMS TABLE
CREATE TABLE exams (
    id TEXT PRIMARY KEY,
    course_ids TEXT[] NOT NULL,
    groups TEXT[] NOT NULL,
    size INTEGER NOT NULL,
    duration_hours INTEGER NOT NULL DEFAULT 2,
    scheduled_day TEXT,
    scheduled_session TEXT,
    assigned_rooms TEXT[],
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 10. PROPOSALS TABLE (Disruptions, Move requests, Unavailability)
CREATE TABLE proposals (
    id SERIAL PRIMARY KEY,
    kind TEXT NOT NULL,
    created_by TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    payload JSONB NOT NULL,
    result JSONB NOT NULL,
    decided_by TEXT,
    created TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 11. USERS & ROLES TABLE
CREATE TABLE users (
    username TEXT PRIMARY KEY,
    pw TEXT NOT NULL,
    role TEXT NOT NULL,
    department TEXT,
    faculty_id TEXT REFERENCES faculty(id) ON DELETE SET NULL,
    org TEXT,
    active INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 12. AUDIT LOG TABLE
CREATE TABLE audit (
    id SERIAL PRIMARY KEY,
    ts TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    actor TEXT NOT NULL,
    action TEXT NOT NULL,
    detail JSONB
);

-- 13. SYSTEM STATE / KV STORE TABLE
CREATE TABLE system_state (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexes for lightning fast queries
CREATE INDEX idx_sessions_day_period ON sessions(day, start_period);
CREATE INDEX idx_sessions_faculty ON sessions(faculty_id);
CREATE INDEX idx_sessions_course ON sessions(course_id);
CREATE INDEX idx_bookings_status ON booking_requests(status);
CREATE INDEX idx_proposals_status ON proposals(status);
CREATE INDEX idx_audit_actor ON audit(actor);
