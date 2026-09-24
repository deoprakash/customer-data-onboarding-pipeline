const express = require("express");
const pool = require("../services/database");

const router = express.Router();

// GET /logs
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM activity_logs ORDER BY created_at DESC LIMIT 50`
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching logs:", error);
    res.status(500).json({ error: "Failed to load logs" });
  }
});

module.exports = router;
