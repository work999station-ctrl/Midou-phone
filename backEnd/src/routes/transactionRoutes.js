const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');

// Record a new transaction (Sale or Purchase)
router.post('/', transactionController.recordTransaction);

// Get all transactions
router.get('/', transactionController.getTransactions);

// Delete a transaction
router.delete('/:id', transactionController.deleteTransaction);

module.exports = router;
