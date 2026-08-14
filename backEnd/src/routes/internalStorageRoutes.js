const express = require('express');
const router = express.Router();
const internalStorageController = require('../controllers/internalStorageController');

router.route('/')
  .get(internalStorageController.getProducts)
  .post(internalStorageController.createProduct);

router.route('/:id')
  .get(internalStorageController.getProductById)
  .put(internalStorageController.updateProduct)
  .delete(internalStorageController.deleteProduct);

module.exports = router;
