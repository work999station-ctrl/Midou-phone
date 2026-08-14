const fs = require('fs');
const path = require('path');
const InternalStorage = require('../../models/InternalStorage');
const { Jimp } = require('jimp');

const UPLOAD_DIR = path.join(__dirname, '../../public/uploads');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Helper to save base64 image to disk and return static URL
async function processImagesArray(images, productIdPrefix = 'prod') {
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
          image.scaleToFit({ w: 250, h: 250 });
          const filename = `${productIdPrefix}_${Date.now()}_${i}.jpg`;
          const filePath = path.join(UPLOAD_DIR, filename);
          const compressedBuffer = await image.getBuffer('image/jpeg');
          fs.writeFileSync(filePath, compressedBuffer);
          processed.push(`http://localhost:4000/uploads/${filename}`);
          continue;
        }
      } catch (err) {
        console.error('Image processing error in controller:', err.message);
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

const invalidateCache = () => {
  productsCache = null;
  lastFetchTime = 0;
};
exports.invalidateCache = invalidateCache;

const setCache = (items) => {
  productsCache = items;
  lastFetchTime = Date.now();
};
exports.setCache = setCache;

// Get all internal storage products with optional filtering
exports.getProducts = async (req, res) => {
  try {
    const { category, search } = req.query;
    const isDefaultQuery = (!category || category === 'all') && !search;

    // Serve directly from RAM if available and fresh
    if (isDefaultQuery && productsCache && (Date.now() - lastFetchTime < CACHE_TTL)) {
      return res.status(200).json(productsCache);
    }

    const filter = {};
    if (category && category !== 'all') {
      filter.category = category;
    }
    if (search) {
      filter.name = { $regex: search, $options: 'i' };
    }

    const products = await InternalStorage.find(filter).sort({ createdAt: -1 }).lean();

    if (isDefaultQuery) {
      productsCache = products;
      lastFetchTime = Date.now();
    }

    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving internal storage products', error: error.message });
  }
};

// Get single internal storage product by ID
exports.getProductById = async (req, res) => {
  try {
    const product = await InternalStorage.findById(req.params.id).lean();
    if (!product) {
      return res.status(404).json({ message: 'Product not found in internal storage' });
    }
    res.status(200).json(product);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving product', error: error.message });
  }
};

// Create a new internal storage product
exports.createProduct = async (req, res) => {
  try {
    const body = { ...req.body };
    if (body.images) {
      body.images = await processImagesArray(body.images, 'prod');
    }
    const product = new InternalStorage(body);
    await product.save();
    invalidateCache();
    res.status(201).json(product);
  } catch (error) {
    res.status(400).json({ message: 'Error creating product in internal storage', error: error.message });
  }
};

// Update an existing internal storage product
exports.updateProduct = async (req, res) => {
  try {
    const body = { ...req.body };
    if (body.images) {
      body.images = await processImagesArray(body.images, `prod_${req.params.id}`);
    }
    const product = await InternalStorage.findByIdAndUpdate(req.params.id, body, {
      returnDocument: 'after',
      runValidators: true
    }).lean();
    if (!product) {
      return res.status(404).json({ message: 'Product not found in internal storage' });
    }
    invalidateCache();
    res.status(200).json(product);
  } catch (error) {
    res.status(400).json({ message: 'Error updating product in internal storage', error: error.message });
  }
};

// Delete an internal storage product
exports.deleteProduct = async (req, res) => {
  try {
    const product = await InternalStorage.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found in internal storage' });
    }
    invalidateCache();
    res.status(200).json({ message: 'Product deleted from internal storage' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting product from internal storage', error: error.message });
  }
};
