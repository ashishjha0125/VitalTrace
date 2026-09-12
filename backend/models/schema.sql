-- Users table
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255),
  github_id VARCHAR(100) UNIQUE,
  avatar_url TEXT,
  age INTEGER CHECK (age > 0 AND age <= 120),
  medical_history TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sessions table  
CREATE TABLE sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  start_time BIGINT NOT NULL,
  duration INTEGER NOT NULL,
  avg_bpm INTEGER,
  total_samples INTEGER,
  quality VARCHAR(20) DEFAULT 'Good',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ECG Recordings
CREATE TABLE ecg_recordings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  sample_rate INTEGER DEFAULT 200,
  duration_seconds FLOAT,
  data_points JSONB NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_sessions_user ON sessions(user_id);
CREATE INDEX idx_ecg_user ON ecg_recordings(user_id);
CREATE INDEX idx_ecg_session ON ecg_recordings(session_id);
