import { Pool } from 'pg';

// Database connection configuration using the provided connection URL
const connectionString = 'postgres://postgres:BkFHA2uFkJj2a8mWSDr3idRQPwyYhc1r4nrcL7YTHHeq03e5O71tninpzcpFtniE@116.203.30.228:5432/postgres';

// Create a new PostgreSQL connection pool
const pool = new Pool({
  connectionString,
});

// Test the connection
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Error connecting to PostgreSQL database:', err);
  } else {
    console.log('Successfully connected to PostgreSQL database at:', res.rows[0].now);
  }
});

// Helper function to execute SQL queries
export async function query(text: string, params?: any[]) {
  try {
    const start = Date.now();
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('Error executing query:', error);
    throw error;
  }
}

// Export the pool for direct use if needed
export { pool }; 