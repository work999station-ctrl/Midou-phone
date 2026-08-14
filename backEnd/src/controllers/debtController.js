const Debt = require('../../models/Debt');

// Get all debts with optional search and status filter
exports.getDebts = async (req, res) => {
  try {
    const { search, status } = req.query;
    const filter = {};

    if (status) {
      filter.status = status;
    }
    if (search) {
      filter.$or = [
        { personName: { $regex: search, $options: 'i' } },
        { productName: { $regex: search, $options: 'i' } }
      ];
    }

    const debts = await Debt.find(filter).sort({ date: -1 });
    res.status(200).json(debts);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving debts', error: error.message });
  }
};

// Create a new debt record
exports.createDebt = async (req, res) => {
  try {
    const { personName, productName, price, date, status } = req.body;
    if (!personName || !productName || price === undefined) {
      return res.status(400).json({ message: 'personName, productName, and price are required' });
    }

    const debt = new Debt({
      personName: personName.trim(),
      productName: productName.trim(),
      price: Number(price),
      date: date ? new Date(date) : new Date(),
      status: status || 'Unpaid'
    });

    await debt.save();
    res.status(201).json(debt);
  } catch (error) {
    res.status(400).json({ message: 'Error creating debt record', error: error.message });
  }
};

// Update debt status (e.g. Paid / Unpaid)
exports.updateDebtStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!status || !['Unpaid', 'Paid'].includes(status)) {
      return res.status(400).json({ message: 'Valid status (Unpaid or Paid) is required' });
    }

    const debt = await Debt.findByIdAndUpdate(
      req.params.id,
      { status },
      { returnDocument: 'after', runValidators: true }
    );

    if (!debt) {
      return res.status(404).json({ message: 'Debt record not found' });
    }

    res.status(200).json(debt);
  } catch (error) {
    res.status(400).json({ message: 'Error updating debt status', error: error.message });
  }
};

// Update debt price
exports.updateDebtPrice = async (req, res) => {
  try {
    const { price } = req.body;
    if (price === undefined || isNaN(Number(price))) {
      return res.status(400).json({ message: 'Valid price is required' });
    }

    const debt = await Debt.findByIdAndUpdate(
      req.params.id,
      { price: Number(price) },
      { returnDocument: 'after', runValidators: true }
    );

    if (!debt) {
      return res.status(404).json({ message: 'Debt record not found' });
    }

    res.status(200).json(debt);
  } catch (error) {
    res.status(400).json({ message: 'Error updating debt price', error: error.message });
  }
};

// Delete a debt record
exports.deleteDebt = async (req, res) => {
  try {
    const debt = await Debt.findByIdAndDelete(req.params.id);
    if (!debt) {
      return res.status(404).json({ message: 'Debt record not found' });
    }
    res.status(200).json({ message: 'Debt record deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting debt record', error: error.message });
  }
};

// Get debts summary (total unpaid amount & count)
exports.getDebtsSummary = async (req, res) => {
  try {
    const result = await Debt.aggregate([
      { $match: { status: 'Unpaid' } },
      {
        $group: {
          _id: null,
          totalUnpaid: { $sum: '$price' },
          count: { $sum: 1 }
        }
      }
    ]);

    const data = result[0] || { totalUnpaid: 0, count: 0 };
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving debts summary', error: error.message });
  }
};

