const express = require("express");
const router = express.Router();

router.get("/", (req, res) => {
  res.json({
    environment: "Development",
    user: {
      initials: "JD",
      name: "John Doe"
    }
  });
});

module.exports = router;
