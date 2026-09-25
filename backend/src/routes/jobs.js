const pool = require("../services/database")
const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { logActivity } = require("../services/logger");

const router = express.Router();

const { redisClient } = require("../services/redis");

// Create upload directory
const uploadDirectory = path.join(__dirname, "../../uploads");

if (!fs.existsSync(uploadDirectory)) {
  fs.mkdirSync(uploadDirectory, {
    recursive: true,
  });
}

// Configure file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDirectory);
  },

  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;

    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
});

// Create onboarding job
router.post("/", upload.single("file"), async (req, res) => {
  try {
    const { job_id, customer } = req.body;

    if (!job_id || !customer) {
      return res.status(400).json({
        error: "job_id and customer are required",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        error: "CSV file is required",
      });
    }

    const configPath = path.join(__dirname, "../../../data_engine/configs/customers", `${customer.toLowerCase()}.yaml`);
    const hasSchema = fs.existsSync(configPath);
    
    if (!hasSchema) {
      const csvContent = fs.readFileSync(req.file.path, 'utf8');
      const lines = csvContent.split('\n');
      const firstLine = lines[0];
      const secondLine = lines[1] || "";
      const sourceHeaders = firstLine ? firstLine.trim() : "unknown";
      const sampleRow = secondLine ? secondLine.trim() : "unknown";
      
      require('dotenv').config({ path: path.join(__dirname, "../../../data_engine/.env") });
      const apiKey = process.env.GROQ_API;
      const canonicalSchema = "- customer_id (required)\\n- first_name (required)\\n- last_name (required)\\n- email (required)\\n- phone (required)\\n- created_at (required)";
      const prompt = `You are an expert data integration assistant. Map the following source CSV headers to the canonical schema. Source Headers: ${sourceHeaders} Sample Data: ${sampleRow} Canonical Schema: ${canonicalSchema} Return a strictly valid JSON object representing the mapping. The keys must be the canonical schema fields. The values must be objects with 'source' (the matching source header), 'required' (boolean), and optionally 'transformation' or 'format' if needed. For date fields, you MUST infer the exact Python strptime 'format' (e.g., '%Y-%m-%d', '%d/%m/%Y', '%m-%d-%Y') from the Sample Data provided. Do not just use 'ISO'. Only output JSON, no markdown blocks.`;
      
      const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST", headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: "openai/gpt-oss-120b", messages: [{ role: "user", content: prompt }], temperature: 0.1, response_format: { type: "json_object" } })
      });
      
      let generatedMapping = {};
      if (groqRes.ok) {
        const groqData = await groqRes.json();
        try { generatedMapping = JSON.parse(groqData.choices[0].message.content); } catch(e) {}
      }
      return res.status(200).json({ requires_approval: true, generated_mapping: generatedMapping, job_id, customer, file: req.file.path });
    }

    const job = {
      job_id,
      customer,
      file: req.file.path,
    };

    await redisClient.rPush("customer_onboarding_jobs", JSON.stringify(job));
    await logActivity(null, null, "Uploaded Data File", "Job", job_id, { customer, file: req.file.originalname });

    res.status(202).json({
      message: "Job queued successfully",
      job,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Failed to queue job",
    });
  }
});

router.post("/approve", async (req, res) => {
  try {
    const { job_id, customer, file } = req.body;
    if (!job_id || !customer || !file) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const job = { job_id, customer, file };
    await redisClient.rPush("customer_onboarding_jobs", JSON.stringify(job));
    await logActivity(null, null, "Approved & Queued Job", "Job", job_id, { customer });

    res.status(202).json({ message: "Job queued successfully", job });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to queue job" });
  }
});

router.post("/:job_id/rerun", async (req, res) => {
  try {
    const { job_id } = req.params;
    const result = await pool.query(
      `SELECT customer, file_name FROM onboarding_jobs WHERE job_id = $1`,
      [job_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Job not found" });
    }

    const originalJob = result.rows[0];
    const newJobId = require('crypto').randomUUID();

    const job = {
      job_id: newJobId,
      customer: originalJob.customer,
      file: originalJob.file_name,
    };

    await redisClient.rPush("customer_onboarding_jobs", JSON.stringify(job));
    await logActivity(null, null, "Rerun Job", "Job", newJobId, { customer: job.customer, original_job_id: job_id });

    res.status(202).json({
      message: "Job rerun queued successfully",
      job,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to queue rerun" });
  }
});

router.get("/:job_id", async (req, res) => {
  try {
    const { job_id } = req.params;

    const result = await pool.query(
      `
            SELECT
                job_id,
                customer,
                file_name,
                status,
                records_received,
                records_valid,
                records_rejected,
                error_message,
                current_step,
                status_message,
                created_at,
                updated_at
            FROM onboarding_jobs
            WHERE job_id = $1
            `,
      [job_id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "Job not found",
      });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Failed to retrieve job",
    });
  }
});

router.get("/:job_id/rejected", async (req, res) => {
  try {
    const { job_id } = req.params;

    const result = await pool.query(
      `
        SELECT
            id,
            job_id,
            row_number as row,
            customer,
            field_name as field,
            error_message as error,
            raw_value as value,
            status
        FROM rejected_records
        WHERE job_id = $1
        ORDER BY row_number ASC
      `,
      [job_id]
    );

    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Failed to retrieve rejected records",
    });
  }
});

const { exec } = require('child_process');

router.get("/:job_id/profile", async (req, res) => {
  try {
    const { job_id } = req.params;

    const result = await pool.query(
      `SELECT file_name FROM onboarding_jobs WHERE job_id = $1`,
      [job_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Job not found" });
    }

    const filePath = result.rows[0].file_name;
    const stats = fs.statSync(filePath);
    const fileSizeInMegabytes = stats.size / (1024 * 1024);

    const pythonScript = `
import sys
import json
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../../data_engine')))
from app.profiler import profile_csv
try:
    profile = profile_csv(r'${filePath.replace(/\\/g, '\\\\')}')
    print(json.dumps(profile))
except Exception as e:
    print(json.dumps({"error": str(e)}))
    sys.exit(1)
    `;

    const tempFile = path.join(__dirname, `temp_profile_${job_id}.py`);
    fs.writeFileSync(tempFile, pythonScript);

    exec(`python ${tempFile}`, { cwd: __dirname }, (error, stdout, stderr) => {
      if (fs.existsSync(tempFile)) {
        fs.unlinkSync(tempFile);
      }
      if (error) {
        console.error("Profiler error:", error);
        return res.status(500).json({ error: "Failed to profile data" });
      }
      try {
        const profileData = JSON.parse(stdout);
        if (profileData.error) {
            return res.status(500).json({ error: profileData.error });
        }
        profileData.file_size_mb = fileSizeInMegabytes.toFixed(2);
        res.json(profileData);
      } catch (parseError) {
        console.error("Parse error:", parseError);
        res.status(500).json({ error: "Invalid profile data from engine" });
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to retrieve profile" });
  }
});

router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT
          job_id,
          customer,
          file_name,
          status,
          records_received,
          records_valid,
          records_rejected,
          error_message,
          created_at,
          updated_at
      FROM onboarding_jobs
      ORDER BY created_at DESC
      `
    );
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to retrieve all jobs" });
  }
});

router.get("/customer/:customerName", async (req, res) => {
  try {
    const { customerName } = req.params;
    const result = await pool.query(
      `
      SELECT
          job_id,
          customer,
          file_name,
          status,
          records_received,
          records_valid,
          records_rejected,
          error_message,
          created_at,
          updated_at
      FROM onboarding_jobs
      WHERE customer ILIKE $1
      ORDER BY created_at DESC
      `,
      [customerName]
    );
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Failed to retrieve customer jobs",
    });
  }
});

router.get("/customer/:customerName/rejected", async (req, res) => {
  try {
    const { customerName } = req.params;

    const result = await pool.query(
      `
        SELECT
            id,
            job_id,
            row_number as row,
            customer,
            field_name as field,
            error_message as error,
            raw_value as value,
            status
        FROM rejected_records
        WHERE customer ILIKE $1
        ORDER BY row_number ASC
      `,
      [customerName]
    );

    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Failed to retrieve rejected records for customer",
    });
  }
});

module.exports = router;
