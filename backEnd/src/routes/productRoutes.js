const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');

router.route('/')
  .get(productController.getProducts)
  .post(productController.createProduct);

router.route('/:id')
  .get(productController.getProductById)
  .put(productController.updateProduct)
  .delete(productController.deleteProduct);

module.exports = router;
