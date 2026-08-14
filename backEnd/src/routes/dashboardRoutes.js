const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');

router.get('/top-selling', dashboardController.getTopSelling);
router.get('/revenue', dashboardController.getRevenue);
router.get('/revenue-30days', dashboardController.getRevenue30Days);

module.exports = router;
