const express = require("express");
const router = express.Router();

router.get("/", (req, res) => {
  res.json({
    connectedSources: [
      { name: 'Acme SFTP', type: 'SFTP', status: 'Active', icon: '📁' },
      { name: 'Beta PostgreSQL', type: 'Database', status: 'Active', icon: '🗄️' },
      { name: 'Customer API', type: 'REST API', status: 'Active', icon: '🌐' }
    ],
    availableIntegrations: [
      'File Upload', 'SFTP', 'REST API', 'PostgreSQL', 
      'MySQL', 'Snowflake', 'BigQuery', 'AWS S3', 'Google Cloud Storage'
    ]
  });
});

module.exports = router;
