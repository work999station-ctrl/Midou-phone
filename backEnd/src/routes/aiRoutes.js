const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');

// POST /api/ai/specs — text-only spec generation
router.post('/specs', aiController.generateSpecs);

module.exports = router;

