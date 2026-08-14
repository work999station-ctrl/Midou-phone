const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');

// POST /api/ai/specs — text-only spec generation
router.post('/specs', aiController.generateSpecs);

// POST /api/ai/analyze-image — vision: identify product from photo + generate specs
router.post('/analyze-image', aiController.analyzeProductImage);

module.exports = router;

