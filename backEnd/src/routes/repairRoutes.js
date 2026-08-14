const express = require('express');
const router = express.Router();
const repairController = require('../controllers/repairController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/book', repairController.bookRepair);
router.get('/track', repairController.trackRepair);
router.get('/prices', repairController.getPricingMatrix);

router.route('/tickets')
  .get(authMiddleware, repairController.getTickets);

router.route('/tickets/:id')
  .get(authMiddleware, repairController.getTicketById)
  .put(authMiddleware, repairController.updateTicketStatus)
  .delete(authMiddleware, repairController.deleteTicket);

router.post('/tickets/:id/messages', repairController.postMessage);

module.exports = router;
