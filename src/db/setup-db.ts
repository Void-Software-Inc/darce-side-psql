const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

// Database connection configuration using the provided connection URL
const connectionString = 'postgres://postgres:BkFHA2uFkJj2a8mWSDr3idRQPwyYhc1r4nrcL7YTHHeq03e5O71tninpzcpFtniE@116.203.30.228:5432/postgres';

// Create a new PostgreSQL connection pool
const pool = new Pool({
  connectionString,
});

// Define types for database rows
interface TableRow {
  table_name: string;
}

interface UserRow {
  id: number;
  username: string;
  email: string;
  role_id: number;
}

async function setupDatabase() {
  try {
    console.log('Setting up database...');
    
    // Read the schema SQL file
    const schemaPath = path.join(process.cwd(), 'src', 'db', 'schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    
    // Execute the SQL
    await pool.query(schemaSql);
    
    console.log('Database setup completed successfully!');
    
    // Verify the setup by checking if tables were created
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
    
    console.log('Created tables:');
    tablesResult.rows.forEach((row: TableRow) => {
      console.log(`- ${row.table_name}`);
    });
    
    // Check users
    const usersResult = await pool.query('SELECT id, username, email, role_id FROM users');
    console.log(`\nCreated users (${usersResult.rowCount}):`);
    usersResult.rows.forEach((user: UserRow) => {
      console.log(`- ${user.username} (${user.email}), role_id: ${user.role_id}`);
    });
    
  } catch (error) {
    console.error('Error setting up database:', error);
  } finally {
    // Close the pool
    await pool.end();
  }
}

// Run the setup
setupDatabase(); 