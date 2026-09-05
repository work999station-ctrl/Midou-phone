const Transaction = require('../../models/Transaction');
const InternalStorage = require('../../models/InternalStorage');
const { invalidateCache } = require('./internalStorageController');

// Record a new transaction (Sale or Purchase)
exports.recordTransaction = async (req, res) => {
  try {
    const {
      type,
      description,
      totalPrice,
      quantity = 1,
      productId,
      updateStock = false,
      isNewProduct = false,
      category = 'other', // For new products
      supplierName,
      clientName,
      notes,
      date
    } = req.body;

    if (!['sale', 'purchase', 'canceled'].includes(type)) {
      return res.status(400).json({ message: 'Invalid transaction type.' });
    }

    if (!description || totalPrice == null) {
      return res.status(400).json({ message: 'Description and Total Price are required.' });
    }

    // Optional custom transaction date (YYYY-MM-DD from the New Transaction form).
    // Parsed as a local calendar date, keeping the current time-of-day so the
    // record still sorts naturally among same-day transactions. When omitted,
    // the model default (now) applies. Dashboard and ledger filters use
    // createdAt, so back-dated transactions land in the correct day/week.
    let transactionDate;
    if (date) {
      const raw = String(date).trim();
      let parsed = /^\d{4}-\d{2}-\d{2}$/.test(raw) ? new Date(`${raw}T00:00:00`) : new Date(raw);
      if (!isNaN(parsed.getTime())) {
        const now = new Date();
        parsed.setHours(now.getHours(), now.getMinutes(), now.getSeconds(), 0);
        transactionDate = parsed;
      }
    }

    let finalProductId = productId ? productId : undefined;

    // Handle Stock Updates if requested
    if (updateStock) {
      if (type === 'purchase' || type === 'canceled') {
        if (isNewProduct && type === 'purchase') {
          // Buy NEW product: create it in InternalStorage
          const unitCost = Math.floor(totalPrice / quantity);
          const newItem = await InternalStorage.create({
            name: description,
            category: category,
            price: unitCost, // User requested default selling price to be the buying price
            stock: quantity
          });
          finalProductId = newItem._id;
        } else if (productId) {
          // Buy EXISTING product or CANCEL sale: increment stock
          await InternalStorage.findByIdAndUpdate(productId, {
            $inc: { stock: quantity }
          });
        }
      } else if (type === 'sale' && productId) {
        // Sell EXISTING product: decrement stock (prevent negative stock)
        const product = await InternalStorage.findById(productId);
        if (product) {
          const newStock = Math.max(0, product.stock - quantity);
          await InternalStorage.findByIdAndUpdate(productId, { stock: newStock });
        }
      }
      invalidateCache();
    }

    // Create Transaction Record
    const transaction = await Transaction.create({
      type,
      description,
      totalPrice: Number(totalPrice),
      quantity: Number(quantity),
      productId: finalProductId,
      updateStock,
      supplierName,
      clientName,
      notes,
      createdAt: transactionDate
    });

    res.status(201).json(transaction);
  } catch (error) {
    res.status(400).json({ message: 'Error recording transaction', error: error.message });
  }
};

// Get all transactions
exports.getTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find()
      .populate('productId', 'name') // Optionally populate product details
      .sort({ createdAt: -1 });
    res.status(200).json(transactions);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving transactions', error: error.message });
  }
};

// Delete a transaction (Optional: revert stock? Usually manual adjustment is better for complex systems, but let's just delete the record for now)
exports.deleteTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }
    
    // Reverse stock if it was updated
    if (transaction.updateStock && transaction.productId) {
      if (transaction.type === 'purchase') {
        // Reverse purchase -> decrease stock
        const product = await InternalStorage.findById(transaction.productId);
        if (product) {
           await InternalStorage.findByIdAndUpdate(transaction.productId, { stock: Math.max(0, product.stock - transaction.quantity) });
        }
      } else if (transaction.type === 'sale') {
        // Reverse sale -> increase stock
        await InternalStorage.findByIdAndUpdate(transaction.productId, { $inc: { stock: transaction.quantity } });
      }
      invalidateCache();
    }

    await Transaction.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Transaction deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting transaction', error: error.message });
  }
};
