const express = require("express");
const router = express.Router();
const Resource = require("../models/Resource");
const { ensureAuth } = require("../middleware/auth");

// Add resource (admin access example)
router.post("/", ensureAuth, async (req, res) => {
  // Add role check if you want only admins!
  const resource = await Resource.create(req.body);
  res.json(resource);
});

// Get all resources
router.get("/", async (req, res) => {
  const resources = await Resource.find();
  res.json(resources);
});

module.exports = router;
