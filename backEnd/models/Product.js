const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Product description is required']
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
    default: 0
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  images: {
    type: [String],
    default: []
  },
  condition: {
    type: String,
    required: [true, 'Product condition is required'],
    enum: {
      values: ['New', 'Used Like New', 'Used'],
      message: '{VALUE} is not a valid product condition'
    }
  },
  specs: {
    type: Map,
    of: String,
    default: {}
  },
  // Timestamp of when the product was marked as sold.
  // null while available; set to the current time when stock hits 0.
  // A TTL index removes the document 14 hours after this date.
  soldAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// TTL index: MongoDB auto-deletes a product 14 hours (50400s) after `soldAt`.
// Documents where soldAt is null/missing are never expired by TTL.
productSchema.index({ soldAt: 1 }, { expireAfterSeconds: 14 * 60 * 60 });
productSchema.index({ createdAt: -1 });
productSchema.index({ category: 1 });
productSchema.index({ condition: 1 });
productSchema.index({ name: 'text' });

module.exports = mongoose.model('Product', productSchema);
