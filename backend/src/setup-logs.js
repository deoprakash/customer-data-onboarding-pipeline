require('dotenv').config({ path: '../.env' });
const pool = require('./services/database');

async function setup() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS activity_logs (
        id SERIAL PRIMARY KEY,
        user_name VARCHAR(100),
        action VARCHAR(255),
        entity_type VARCHAR(100),
        entity_id VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        details JSONB
      );
    `);

    // Clear mock data if any
    await pool.query(`TRUNCATE TABLE activity_logs RESTART IDENTITY`);
    
    
    console.log("Activity logs table created and seeded successfully");
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

setup();
