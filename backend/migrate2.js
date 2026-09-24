require('dotenv').config();
const pool = require("./src/services/database");

async function migrate() {
  try {
    console.log("Creating rejected_records table...");
    await pool.query(`
      CREATE TABLE IF NOT EXISTS rejected_records (
          id SERIAL PRIMARY KEY,
          job_id VARCHAR(50),
          row_number INTEGER,
          customer VARCHAR(50),
          field_name VARCHAR(50),
          error_message TEXT,
          raw_value TEXT,
          status VARCHAR(20) DEFAULT 'Rejected',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("Migration successful.");
  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    pool.end();
  }
}

migrate();
