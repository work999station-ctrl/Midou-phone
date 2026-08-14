const Transaction = require('../../models/Transaction');
const Product = require('../../models/Product');
const InternalStorage = require('../../models/InternalStorage');

// Helper to find a product in InternalStorage first, then Product fallback
async function findProductAnywhere(id) {
  let product = await InternalStorage.findById(id);
  if (!product) {
    product = await Product.findById(id);
  }
  return product;
}

/**
 * GET /api/dashboard/top-selling
 * Returns products sold today, grouped by product name,
 * with quantity sold and total revenue, sorted high to low by total cost.
 */
exports.getTopSelling = async (req, res) => {
  try {
    let start = new Date();
    let end = new Date();
    if (req.query.date) {
      start = new Date(req.query.date);
      end = new Date(req.query.date);
    }
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    const sales = await Transaction.aggregate([
      // Only sales from that date range
      { $match: { type: 'sale', createdAt: { $gte: start, $lte: end } } },

      // Group by productId to avoid duplicate aggregates of the same product
      {
        $group: {
          _id: '$productId',
          productName: { $first: '$description' },
          quantitySold: { $sum: '$quantity' },
          totalRevenue: { $sum: '$totalPrice' }
        }
      },

      // Exclude null product ID transactions (if any)
      { $match: { _id: { $ne: null } } },

      // Lookup product details from internalstorages
      {
        $lookup: {
          from: 'internalstorages',
          localField: '_id',
          foreignField: '_id',
          as: 'productDetails'
        }
      },

      // Unwind details
      {
        $unwind: {
          path: '$productDetails',
          preserveNullAndEmptyArrays: true
        }
      },

      // Project expected fields for the dashboard
      {
        $project: {
          _id: 1,
          productName: { $ifNull: ['$productDetails.name', '$productName'] },
          category: { $ifNull: ['$productDetails.category', 'accessories'] },
          productImage: { 
            $cond: {
              if: { $and: [{ $isArray: '$productDetails.images' }, { $gt: [{ $size: '$productDetails.images' }, 0] }] },
              then: { $arrayElemAt: ['$productDetails.images', 0] },
              else: null
            }
          },
          quantitySold: 1,
          totalRevenue: 1
        }
      },

      // Sort high to low by quantity sold
      { $sort: { quantitySold: -1 } }
    ]);

    res.status(200).json(sales);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving top selling products', error: error.message });
  }
};

/**
 * GET /api/dashboard/revenue
 * Returns total sales revenue for today.
 */
exports.getRevenue = async (req, res) => {
  try {
    let start = new Date();
    let end = new Date();
    if (req.query.date) {
      start = new Date(req.query.date);
      end = new Date(req.query.date);
    }
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    const result = await Transaction.aggregate([
      { $match: { createdAt: { $gte: start, $lte: end } } },
      {
        $group: {
          _id: '$type',
          totalAmount: { $sum: '$totalPrice' },
          totalItems: { $sum: '$quantity' }
        }
      }
    ]);

    let totalSales = 0, totalPurchases = 0, totalCanceled = 0, totalItems = 0;
    result.forEach(r => {
      if (r._id === 'sale') {
        totalSales = r.totalAmount;
        totalItems += r.totalItems;
      } else if (r._id === 'purchase') {
        totalPurchases = r.totalAmount;
      } else if (r._id === 'canceled') {
        totalCanceled = r.totalAmount;
      }
    });

    res.status(200).json({ totalSales, totalPurchases, totalCanceled, totalItems });
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving revenue', error: error.message });
  }
};

/**
 * GET /api/dashboard/revenue-30days
 * Returns sales revenue grouped into 4 weekly buckets over the past 30 days.
 */
exports.getRevenue30Days = async (req, res) => {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(now.getDate() - 30);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    const transactions = await Transaction.find({ createdAt: { $gte: thirtyDaysAgo } });

    // 4 weekly buckets
    let w1Sales = 0, w2Sales = 0, w3Sales = 0, w4Sales = 0;
    let w1Purch = 0, w2Purch = 0, w3Purch = 0, w4Purch = 0;
    let w1Canceled = 0, w2Canceled = 0, w3Canceled = 0, w4Canceled = 0;
    const dayMs = 24 * 60 * 60 * 1000;

    transactions.forEach((t) => {
      const diffMs = now - new Date(t.createdAt);
      const diffDays = Math.floor(diffMs / dayMs);

      if (diffDays <= 7) {
        if (t.type === 'sale') w1Sales += t.totalPrice; 
        else if (t.type === 'canceled') w1Canceled += t.totalPrice;
        else w1Purch += t.totalPrice;
      } else if (diffDays <= 14) {
        if (t.type === 'sale') w2Sales += t.totalPrice;
        else if (t.type === 'canceled') w2Canceled += t.totalPrice;
        else w2Purch += t.totalPrice;
      } else if (diffDays <= 21) {
        if (t.type === 'sale') w3Sales += t.totalPrice;
        else if (t.type === 'canceled') w3Canceled += t.totalPrice;
        else w3Purch += t.totalPrice;
      } else if (diffDays <= 30) {
        if (t.type === 'sale') w4Sales += t.totalPrice;
        else if (t.type === 'canceled') w4Canceled += t.totalPrice;
        else w4Purch += t.totalPrice;
      }
    });

    res.status(200).json({
      weeks: [
        { label: 'W1', sales: w1Sales, purchases: w1Purch, canceled: w1Canceled },
        { label: 'W2', sales: w2Sales, purchases: w2Purch, canceled: w2Canceled },
        { label: 'W3', sales: w3Sales, purchases: w3Purch, canceled: w3Canceled },
        { label: 'W4', sales: w4Sales, purchases: w4Purch, canceled: w4Canceled }
      ]
    });
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving 30 days revenue', error: error.message });
  }
};

