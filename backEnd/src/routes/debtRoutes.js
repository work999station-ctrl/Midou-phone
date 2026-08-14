const express = require('express');
const router = express.Router();
const debtController = require('../controllers/debtController');

router.get('/summary', debtController.getDebtsSummary);

router.route('/')
  .get(debtController.getDebts)
  .post(debtController.createDebt);

router.route('/:id')
  .delete(debtController.deleteDebt);

router.route('/:id/status')
  .patch(debtController.updateDebtStatus);

router.route('/:id/price')
  .patch(debtController.updateDebtPrice);

module.exports = router;
