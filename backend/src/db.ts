// Use dotenv to load environment variables from the .env file
import 'dotenv/config';
import mysql from 'mysql2/promise';

// This function creates a connection pool and sets up the necessary table.
// In a real application, database credentials should be stored in environment variables.
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
});

async function setupDatabase(): Promise<void> {
    try {
        const connection = await pool.getConnection();
        
        // This query creates the table if it doesn't already exist.
        // It's crucial for the first run.
        await connection.query(`
            CREATE TABLE IF NOT EXISTS proctoring_reports (
                id INT AUTO_INCREMENT PRIMARY KEY,
                candidate_name VARCHAR(255) NOT NULL,
                interview_duration VARCHAR(50) NOT NULL,
                focus_lost_count INT NOT NULL,
                multiple_faces_count INT NOT NULL,
                absence_count INT NOT NULL,
                phone_detected_count INT NOT NULL,
                notes_detected_count INT NOT NULL,
                integrity_score INT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('Database table "proctoring_reports" is ready.');
        connection.release();
    } catch (err) {
        console.error('Failed to connect to the database or set up the table:', err);
    }
}

export {
    pool,
    setupDatabase
};
