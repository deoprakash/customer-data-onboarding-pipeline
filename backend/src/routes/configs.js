const express = require("express");
const fs = require("fs");
const path = require("path");
const yaml = require("js-yaml");
const { logActivity } = require("../services/logger");

const router = express.Router();

const getConfigPath = (customer) => {
  return path.join(__dirname, "../../../data_engine/configs/customers", `${customer.toLowerCase()}.yaml`);
};

const getHistoryPath = (customer) => {
  return path.join(__dirname, "../../../data_engine/configs/customers", `${customer.toLowerCase()}_history.json`);
};

// GET default schema
router.get("/defaultSchema", (req, res) => {
  res.json({
    customer_id: { source: 'id', required: true },
    first_name: { source: 'name', required: true },
    last_name: { source: 'name', required: true },
    email: { source: 'email_address', required: true },
    phone: { source: 'phone_number', required: true },
    created_at: { source: 'registration_date', required: true }
  });
});

// GET config
router.get("/:customer", (req, res) => {
  try {
    const configPath = getConfigPath(req.params.customer);
    if (!fs.existsSync(configPath)) {
      return res.status(404).json({ error: "Config not found" });
    }
    const fileContents = fs.readFileSync(configPath, 'utf8');
    const data = yaml.load(fileContents);
    res.json(data);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to load config" });
  }
});

// GET config history
router.get("/:customer/history", (req, res) => {
  try {
    const historyPath = getHistoryPath(req.params.customer);
    if (!fs.existsSync(historyPath)) {
      return res.json([]);
    }
    const history = JSON.parse(fs.readFileSync(historyPath, 'utf8'));
    res.json(history);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to load history" });
  }
});

// POST generate config via LLM
router.post("/:customer/generate", async (req, res) => {
  try {
    const customer = req.params.customer;
    
    // Load GROQ API Key
    require('dotenv').config({ path: path.join(__dirname, "../../../data_engine/.env") });
    const apiKey = process.env.GROQ_API;
    
    if (!apiKey) {
      return res.status(500).json({ error: "GROQ_API key is missing in data_engine/.env" });
    }

    // Attempt to read the sample data to get headers
    const sampleCsvPath = path.join(__dirname, `../../../sample-data/${customer.toLowerCase()}/customers.csv`);
    let sourceHeaders = "unknown_field1, unknown_field2";
    if (fs.existsSync(sampleCsvPath)) {
      const csvContent = fs.readFileSync(sampleCsvPath, 'utf8');
      const firstLine = csvContent.split('\n')[0];
      if (firstLine) {
        sourceHeaders = firstLine.trim();
      }
    }

    const canonicalSchema = `
    - customer_id (required)
    - first_name (required)
    - last_name (required)
    - email (required)
    - phone (required)
    - created_at (required)
    `;

    const prompt = `
    You are an expert data integration assistant. Map the following source CSV headers to the canonical schema.
    
    Source Headers: ${sourceHeaders}
    
    Canonical Schema: ${canonicalSchema}
    
    Return a strictly valid JSON object representing the mapping. The keys must be the canonical schema fields. 
    The values must be objects with 'source' (the matching source header), 'required' (boolean), and optionally 'transformation' or 'format' if needed.
    Example output:
    {
      "customer_id": { "source": "client_ref", "required": true },
      "first_name": { "source": "customer_name", "required": true, "transformation": "extract_first_name" }
    }
    Only output JSON, no markdown blocks.
    `;

    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-120b",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.1,
        response_format: { type: "json_object" }
      })
    });

    if (!groqRes.ok) {
      const errorText = await groqRes.text();
      console.error("Groq API error:", errorText);
      return res.status(500).json({ error: "Failed to generate mapping via LLM" });
    }

    const groqData = await groqRes.json();
    let generatedMapping;
    try {
      generatedMapping = JSON.parse(groqData.choices[0].message.content);
    } catch (e) {
      return res.status(500).json({ error: "Invalid JSON from LLM" });
    }
    
    await logActivity(null, "AI System", "Generated Schema Mapping", "Schema", customer, { 
      status: "Success",
      model: "openai/gpt-oss-120b"
    });

    res.json(generatedMapping);

  } catch (e) {
    console.error("LLM Generation error:", e);
    res.status(500).json({ error: "Internal error generating mapping" });
  }
});

// POST config (save updates)
router.post("/:customer", async (req, res) => {
  try {
    const customer = req.params.customer;
    const configPath = getConfigPath(customer);
    const historyPath = getHistoryPath(customer);
    
    let oldConfig = {};
    if (fs.existsSync(configPath)) {
      oldConfig = yaml.load(fs.readFileSync(configPath, 'utf8')) || {};
    }

    const newConfig = req.body;
    
    // Calculate simple changes
    const changes = [];
    Object.keys(newConfig).forEach(key => {
      const oldVal = oldConfig[key] ? oldConfig[key].source : null;
      const newVal = newConfig[key] ? newConfig[key].source : null;
      if (oldVal !== newVal) {
        changes.push(`${oldVal || 'none'} → ${newVal}`);
      }
    });
    if (changes.length === 0) changes.push('Minor mapping update');

    // Load or init history
    let history = [];
    if (fs.existsSync(historyPath)) {
      history = JSON.parse(fs.readFileSync(historyPath, 'utf8'));
    }

    const version = history.length > 0 ? history[0].version + 1 : 1;
    
    const newHistoryEntry = {
      version,
      author: 'User', // Hardcoded for MVP
      date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
      changes,
      config: newConfig,
      status: 'Published'
    };

    // Mark previous as Archived
    if (history.length > 0) {
      history[0].status = 'Archived';
    }

    history.unshift(newHistoryEntry);
    fs.writeFileSync(historyPath, JSON.stringify(history, null, 2), 'utf8');

    // Save actual yaml
    const yamlStr = yaml.dump(newConfig);
    fs.writeFileSync(configPath, yamlStr, 'utf8');
    
    await logActivity(null, "User", "Updated Schema Mapping", "Schema", customer, { version });

    res.json({ message: "Config saved successfully" });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to save config" });
  }
});

// POST rollback
router.post("/:customer/rollback/:version", async (req, res) => {
  try {
    const customer = req.params.customer;
    const versionToRollback = parseInt(req.params.version);
    const configPath = getConfigPath(customer);
    const historyPath = getHistoryPath(customer);

    if (!fs.existsSync(historyPath)) return res.status(404).json({ error: "No history found" });

    let history = JSON.parse(fs.readFileSync(historyPath, 'utf8'));
    const targetVersion = history.find(h => h.version === versionToRollback);
    
    if (!targetVersion) return res.status(404).json({ error: "Version not found" });

    // Save as new version
    const version = history[0].version + 1;
    const newHistoryEntry = {
      version,
      author: 'User (Rollback)',
      date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
      changes: [`Rolled back to Version ${versionToRollback}`],
      config: targetVersion.config,
      status: 'Published'
    };

    history[0].status = 'Archived';
    history.unshift(newHistoryEntry);
    fs.writeFileSync(historyPath, JSON.stringify(history, null, 2), 'utf8');

    const yamlStr = yaml.dump(targetVersion.config);
    fs.writeFileSync(configPath, yamlStr, 'utf8');

    await logActivity(null, "User", "Rolled Back Schema", "Schema", customer, { to_version: versionToRollback, new_version: version });

    res.json({ message: "Rolled back successfully" });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to rollback" });
  }
});

module.exports = router;
