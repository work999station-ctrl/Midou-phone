const mongoose = require('mongoose');

const internalStorageSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true
  },
  category: {
    type: String,
    required: [true, 'Product category is required'],
    enum: {
      values: ['phone', 'tablet', 'charger', 'headphones', 'screen-protector', 'watch', 'feature-phone', 'cable', 'case', 'cover', 'accessories'],
      message: '{VALUE} is not a valid product category'
    }
  },
  price: {
    type: Number,
    required: [true, 'Product price is required'],
    min: [0, 'Price cannot be negative']
  },
  stock: {
    type: Number,
    required: [true, 'Stock quantity is required'],
    min: [0, 'Stock cannot be negative'],
    default: 1
  },
  images: {
    type: [String],
    default: []
  }
}, {
  timestamps: true
});

internalStorageSchema.index({ createdAt: -1 });
internalStorageSchema.index({ category: 1 });
internalStorageSchema.index({ name: 'text' });

module.exports = mongoose.model('InternalStorage', internalStorageSchema);
