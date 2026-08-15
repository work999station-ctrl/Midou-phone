const fs = require('fs');
const path = require('path');
const Product = require('../../models/Product');
const { Jimp } = require('jimp');

const UPLOAD_DIR = path.join(__dirname, '../../public/uploads');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Helper to optimize and store base64 image directly in MongoDB
async function processImagesArray(images) {
  if (!Array.isArray(images) || images.length === 0) return images || [];
  const processed = [];
  for (let i = 0; i < images.length; i++) {
    const img = images[i];
    if (typeof img === 'string' && img.startsWith('data:image')) {
      try {
        const matches = img.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          const buffer = Buffer.from(matches[2], 'base64');
          const image = await Jimp.read(buffer);
          image.scaleToFit({ w: 500, h: 500 });
          const compressedBuffer = await image.getBuffer('image/jpeg');
          const base64Data = `data:image/jpeg;base64,${compressedBuffer.toString('base64')}`;
          processed.push(base64Data);
          continue;
        }
      } catch (err) {
        console.error('Image processing error in product controller:', err.message);
      }
    }
    processed.push(img);
  }
  return processed;
}

// In-memory cache for ultra-fast (0-2ms) responses
let productsCache = null;
let lastFetchTime = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes TTL

const invalidateProductCache = () => {
  productsCache = null;
  lastFetchTime = 0;
};
exports.invalidateProductCache = invalidateProductCache;

const setProductCache = (items) => {
  productsCache = items;
  lastFetchTime = Date.now();
};
exports.setProductCache = setProductCache;

// Get all products with optional filters
exports.getProducts = async (req, res) => {
  try {
    const { category, condition, search } = req.query;
    const isDefaultQuery = (!category || category === 'all') && !condition && !search;

    // Serve directly from RAM if available and fresh
    if (isDefaultQuery && productsCache && (Date.now() - lastFetchTime < CACHE_TTL)) {
      return res.status(200).json(productsCache);
    }

    const filter = {};
    if (category && category !== 'all') {
      filter.category = category;
    }
    if (condition) {
      filter.condition = condition;
    }
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const products = await Product.find(filter).sort({ createdAt: -1 }).lean();

    if (isDefaultQuery) {
      productsCache = products;
      lastFetchTime = Date.now();
    }

    res.status(200).json(products);
  } catch (error) {
    console.error('Error retrieving products:', error.message);
    if (productsCache && productsCache.length > 0) {
      return res.status(200).json(productsCache);
    }
    res.status(500).json({ message: 'Error retrieving products', error: error.message });
  }
};

// Get single product by ID
exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).lean();
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.status(200).json(product);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving product', error: error.message });
  }
};

// Create a new product
exports.createProduct = async (req, res) => {
  try {
    const body = { ...req.body };
    if (body.images) {
      body.images = await processImagesArray(body.images);
    }
    const product = new Product(body);
    await product.save();
    invalidateProductCache();
    res.status(201).json(product);
  } catch (error) {
    res.status(400).json({ message: 'Error creating product', error: error.message });
  }
};

// Update an existing product
exports.updateProduct = async (req, res) => {
  try {
    const update = { ...req.body };

    // Fetch the current product before updating to check previous stock
    const existingProduct = await Product.findById(req.params.id);
    if (!existingProduct) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Keep soldAt in sync with stock so the TTL index can auto-delete
    // sold products 14 hours after they go out of stock.
    if (update.stock !== undefined) {
      const newStock = Number(update.stock);
      update.soldAt = newStock === 0 ? new Date() : null;
    }

    if (update.images) {
      update.images = await processImagesArray(update.images);
    }

    const product = await Product.findByIdAndUpdate(req.params.id, update, {
      returnDocument: 'after',
      runValidators: true
    }).lean();

    invalidateProductCache();
    res.status(200).json(product);
  } catch (error) {
    res.status(400).json({ message: 'Error updating product', error: error.message });
  }
};

// Delete a product
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    invalidateProductCache();
    res.status(200).json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting product', error: error.message });
  }
};
