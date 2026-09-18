const { Pool } = require('pg');

let pool = null;

const connectPostgres = async () => {
    const databaseUrl = process.env.DATABASE_URL;
    
    if (!databaseUrl) {
        console.error('❌ DATABASE_URL not set. PostgreSQL connection failed.');
        throw new Error('DATABASE_URL environment variable is required');
    }
    
    pool = new Pool({
        connectionString: databaseUrl,
        ssl: {
            rejectUnauthorized: false
        }
    });
    
    try {
        await pool.query('SELECT 1');
        
        // Auto-initialize missing tables
        await pool.query(`
            CREATE TABLE IF NOT EXISTS autoreact (
                server_id VARCHAR(36) NOT NULL,
                group_id VARCHAR(50) NOT NULL,
                autoreact_status BOOLEAN DEFAULT FALSE,
                updated_at TIMESTAMPTZ DEFAULT NOW(),
                PRIMARY KEY (server_id, group_id)
            );
        `);
        await pool.query(`
            CREATE TABLE IF NOT EXISTS owneradmin (
                server_id VARCHAR(36) NOT NULL,
                group_id VARCHAR(50) NOT NULL,
                owneradmin_status BOOLEAN DEFAULT FALSE,
                updated_at TIMESTAMPTZ DEFAULT NOW(),
                PRIMARY KEY (server_id, group_id)
            );
        `);
        
        console.log('✅ PostgreSQL Connected Successfully & Verified Tables');
        return true;
    } catch (error) {
        console.error('❌ PostgreSQL Connection Failed:', error.message);
        throw error;
    }
};

const getPool = () => {
    if (!pool) {
        throw new Error('PostgreSQL not initialized. Call connectPostgres() first.');
    }
    return pool;
};

const disconnectPostgres = async () => {
    if (pool) {
        await pool.end();
        pool = null;
    }
};

module.exports = {
    connectPostgres,
    getPool,
    disconnectPostgres
};
