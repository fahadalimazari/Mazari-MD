-- ============================================
-- POSTGRESQL SCHEMA FOR MAZARI-MD BOT
-- ============================================
-- SERVER_ID isolation is used to separate data across multiple bot instances
-- Each server instance must have a unique SERVER_ID (set via environment variable)

-- 1. SESSIONS TABLE - Store WhatsApp Baileys credentials
-- This table stores the authentication credentials needed for bot reconnect
CREATE TABLE IF NOT EXISTS sessions (
    server_id VARCHAR(36) NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    credentials JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (server_id, phone_number)
);

-- 2. USER_CONFIGS TABLE - Store per-user bot settings
-- This table stores settings like ANTI_CALL, AUTO_RECORDING, etc.
CREATE TABLE IF NOT EXISTS user_configs (
    server_id VARCHAR(36) NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    config JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (server_id, phone_number)
);

-- 3. SERVER_SESSIONS TABLE - Track active sessions
-- This table tracks which numbers have active sessions for auto-reconnect
CREATE TABLE IF NOT EXISTS server_sessions (
    server_id VARCHAR(36) NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    last_connected TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE,
    connection_info JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (server_id, phone_number)
);

-- 4. OTP TABLE - One-time passwords for configuration verification (optional)
-- This table is used for secure configuration updates
CREATE TABLE IF NOT EXISTS otp (
    server_id VARCHAR(36) NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    otp VARCHAR(10) NOT NULL,
    config JSONB NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (server_id, phone_number, otp)
);

CREATE TABLE IF NOT EXISTS adminlock (
    server_id VARCHAR(36) NOT NULL,
    group_id VARCHAR(50) NOT NULL,
    adminlock_status BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (server_id, group_id)
);

CREATE TABLE IF NOT EXISTS autoreact (
    server_id VARCHAR(36) NOT NULL,
    group_id VARCHAR(50) NOT NULL,
    autoreact_status BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (server_id, group_id)
);

CREATE TABLE IF NOT EXISTS owneradmin (
    server_id VARCHAR(36) NOT NULL,
    group_id VARCHAR(50) NOT NULL,
    owneradmin_status BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (server_id, group_id)
);



-- 5. STATS TABLE - Usage statistics (optional - currently not used)
-- Uncomment if you plan to track bot usage statistics
-- CREATE TABLE IF NOT EXISTS stats (
--     server_id VARCHAR(36) NOT NULL,
--     phone_number VARCHAR(20) NOT NULL,
--     date DATE NOT NULL,
--     commands_used INTEGER DEFAULT 0,
--     messages_received INTEGER DEFAULT 0,
--     messages_sent INTEGER DEFAULT 0,
--     groups_interacted INTEGER DEFAULT 0,
--     PRIMARY KEY (server_id, phone_number, date)
-- );

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_sessions_server_number ON sessions (server_id, phone_number);
CREATE INDEX IF NOT EXISTS idx_user_configs_server_number ON user_configs (server_id, phone_number);
CREATE INDEX IF NOT EXISTS idx_server_sessions_active ON server_sessions (server_id, is_active);
CREATE INDEX IF NOT EXISTS idx_otp_expires ON otp (expires_at);
CREATE INDEX IF NOT EXISTS idx_adminlock_server_group ON adminlock (server_id, group_id);
CREATE INDEX IF NOT EXISTS idx_autoreact_server_group ON autoreact (server_id, group_id);
CREATE INDEX IF NOT EXISTS idx_owneradmin_server_group ON owneradmin (server_id, group_id);


-- ============================================
-- SAMPLE DATA
-- ============================================

-- To get started, set your SERVER_ID in environment variables:
-- SERVER_ID=your-unique-server-id (e.g., mazari-bot-04, heroku-dyno-123, etc.)

-- The bot will automatically create entries in these tables when:
-- 1. User pairs with the bot (sessions, server_sessions created)
-- 2. User config is saved (user_configs created)
-- 3. Bot reconnects and saves credentials (sessions updated)
