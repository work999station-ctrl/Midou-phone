const mongoose = require('mongoose');

const debtSchema = new mongoose.Schema({
  personName: {
    type: String,
    required: [true, 'Person name is required'],
    trim: true
  },
  productName: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  date: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['Unpaid', 'Paid'],
    default: 'Unpaid'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Debt', debtSchema);
