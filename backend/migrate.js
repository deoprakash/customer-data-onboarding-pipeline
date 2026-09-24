require('dotenv').config();
const pool = require("./src/services/database");

async function migrate() {
  try {
    console.log("Adding columns to onboarding_jobs...");
    await pool.query(`
      ALTER TABLE onboarding_jobs
      ADD COLUMN IF NOT EXISTS current_step VARCHAR(50),
      ADD COLUMN IF NOT EXISTS status_message TEXT;
    `);
    console.log("Migration successful.");
  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    pool.end();
  }
}

migrate();
