import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// Create connection pool
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'eve_data_site',
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    maxIdle: 10,
    idleTimeout: 60000,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0
});

// Test connection on startup
async function testConnection() {
    try {
        const connection = await pool.getConnection();
        console.log('✓ MySQL connected successfully');
        connection.release();
        return true;
    } catch (error) {
        console.error('✗ MySQL connection failed:', error.message);
        return false;
    }
}

// Graceful shutdown
async function closePool() {
    try {
        await pool.end();
        console.log('✓ MySQL connection pool closed');
    } catch (error) {
        console.error('✗ Error closing MySQL pool:', error.message);
    }
}

export { pool, testConnection, closePool };
