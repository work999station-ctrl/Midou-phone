const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['sale', 'purchase', 'canceled'],
    required: true
  },
  description: {
    type: String,
    required: true
  },
  totalPrice: {
    type: Number,
    required: true,
    min: 0
  },
  quantity: {
    type: Number,
    default: 1
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'InternalStorage',
    required: false
  },
  updateStock: {
    type: Boolean,
    default: false
  },
  supplierName: {
    type: String
  },
  clientName: {
    type: String
  },
  notes: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Transaction', transactionSchema);
