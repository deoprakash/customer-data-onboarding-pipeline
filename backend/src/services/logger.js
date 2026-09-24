const pool = require("./database");

async function logActivity(userId, userName, action, entityType, entityId, details) {
  try {
    await pool.query(
      `INSERT INTO activity_logs (user_name, action, entity_type, entity_id, details) 
       VALUES ($1, $2, $3, $4, $5)`,
      [userName || 'System User', action, entityType, entityId, details || {}]
    );
  } catch (error) {
    console.error("Failed to log activity:", error);
  }
}

module.exports = { logActivity };
