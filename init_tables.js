require('dotenv').config();
const { connectPostgres, getPool, disconnectPostgres } = require('./lib/connect-pg');

(async () => {
    try {
        console.log("Connecting to PostgreSQL...");
        await connectPostgres();
        const pool = getPool();

        console.log("Creating owneradmin table...");
        await pool.query(`
            CREATE TABLE IF NOT EXISTS owneradmin (
                server_id VARCHAR(36) NOT NULL,
                group_id VARCHAR(50) NOT NULL,
                owneradmin_status BOOLEAN DEFAULT FALSE,
                updated_at TIMESTAMPTZ DEFAULT NOW(),
                PRIMARY KEY (server_id, group_id)
            );
        `);
        console.log("✅ owneradmin table created.");

        console.log("Creating autoreact table...");
        await pool.query(`
            CREATE TABLE IF NOT EXISTS autoreact (
                server_id VARCHAR(36) NOT NULL,
                group_id VARCHAR(50) NOT NULL,
                autoreact_status BOOLEAN DEFAULT FALSE,
                updated_at TIMESTAMPTZ DEFAULT NOW(),
                PRIMARY KEY (server_id, group_id)
            );
        `);
        console.log("✅ autoreact table created.");

        console.log("Creating indexes...");
        await pool.query(`CREATE INDEX IF NOT EXISTS idx_autoreact_server_group ON autoreact (server_id, group_id);`);
        await pool.query(`CREATE INDEX IF NOT EXISTS idx_owneradmin_server_group ON owneradmin (server_id, group_id);`);
        console.log("✅ Indexes created.");

        await disconnectPostgres();
        console.log("Disconnected successfully.");
    } catch (e) {
        console.error("Error:", e);
    }
})();
