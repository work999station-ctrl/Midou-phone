const fs = require('fs');
const path = require('path');
const RepairTicket = require('../../models/RepairTicket');
const Transaction = require('../../models/Transaction');
const jwt = require('jsonwebtoken');
const { Jimp } = require('jimp');

const UPLOAD_DIR = path.join(__dirname, '../../public/uploads');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Helper to optimize and store base64 image directly in MongoDB
async function processImage(imageStr) {
  if (!imageStr || typeof imageStr !== 'string') return imageStr || '';
  if (imageStr.startsWith('http://') || imageStr.startsWith('https://')) {
    return imageStr;
  }
  if (!imageStr.startsWith('data:image')) {
    return imageStr;
  }

  try {
    const matches = imageStr.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) return imageStr;

    const buffer = Buffer.from(matches[2], 'base64');
    const image = await Jimp.read(buffer);
    image.scaleToFit({ w: 400, h: 400 });
    const compressedBuffer = await image.getBuffer('image/jpeg');
    return `data:image/jpeg;base64,${compressedBuffer.toString('base64')}`;
  } catch (err) {
    console.error('Image processing error in repair controller:', err.message);
    return imageStr;
  }
}

// In-memory cache for ultra-fast (0-2ms) responses
let repairCache = null;
let lastFetchTime = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes TTL

const invalidateRepairCache = () => {
  repairCache = null;
  lastFetchTime = 0;
};
exports.invalidateRepairCache = invalidateRepairCache;

const setRepairCache = (items) => {
  repairCache = items;
  lastFetchTime = Date.now();
};
exports.setRepairCache = setRepairCache;

// Book a new repair ticket
exports.bookRepair = async (req, res) => {
  try {
    const {
      customerName,
      customerPhone,
      deviceType,
      deviceBrand,
      deviceModel,
      deviceImage,
      issue,
      notes,
      estimatedPrice,
      status,
      screenDisplayPrice
    } = req.body;

    const processedImage = deviceImage ? await processImage(deviceImage) : '';

    const ticket = new RepairTicket({
      customerName,
      customerPhone,
      deviceType,
      deviceBrand,
      deviceModel,
      deviceImage: processedImage,
      issue,
      notes,
      estimatedPrice,
      status: status || 'In Progress',
      screenDisplayPrice: screenDisplayPrice || 0
    });

    await ticket.save();
    invalidateRepairCache();

    res.status(201).json({
      message: 'Repair booked successfully',
      ticket
    });
  } catch (error) {
    console.error('ERROR IN BOOK REPAIR:', error);
    res.status(400).json({ message: 'Error booking repair', error: error.message });
  }
};

// Track repair status by ticketId or customerPhone or unified query
exports.trackRepair = async (req, res) => {
  try {
    const { ticketId, customerPhone, query } = req.query;
    const searchTerm = (ticketId || customerPhone || query || '').trim();

    if (!searchTerm) {
      return res.status(400).json({ message: 'Please provide a ticket ID or customer phone number to track.' });
    }

    const cleanTerm = searchTerm.replace(/\s+/g, ' ');
    const digitsOnly = searchTerm.replace(/\D/g, '');
    const escapedTerm = cleanTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    const orConditions = [
      { ticketId: cleanTerm.toUpperCase() },
      { ticketId: new RegExp(escapedTerm, 'i') },
      { customerPhone: cleanTerm },
      { customerPhone: new RegExp(escapedTerm, 'i') }
    ];

    if (digitsOnly.length >= 3) {
      orConditions.push({ customerPhone: new RegExp(digitsOnly, 'i') });
      if (digitsOnly.startsWith('0')) {
        orConditions.push({ customerPhone: new RegExp(digitsOnly.slice(1), 'i') });
      }
      if (digitsOnly.startsWith('213')) {
        orConditions.push({ customerPhone: new RegExp(digitsOnly.slice(3), 'i') });
      }
      // Also match ticket ID containing digits
      orConditions.push({ ticketId: new RegExp(digitsOnly, 'i') });
    }

    const tickets = await RepairTicket.find({ $or: orConditions }).sort({ createdAt: -1 }).lean();

    res.status(200).json(tickets);
  } catch (error) {
    console.error('Error tracking repair:', error);
    res.status(500).json({ message: 'Error tracking repair', error: error.message });
  }
};

// Get the starting price matrix estimator
exports.getPricingMatrix = async (req, res) => {
  const pricingMatrix = {
    phone: {
      'charging port': 49,
      'buttons': 39,
      'audio output': 49,
      'other': 29,
      'multipel issues': 99,
      'unknown issue': 39,
      'audio input': 49,
      'screen & display': 79
    },
    tablet: {
      'charging port': 59,
      'buttons': 49,
      'audio output': 59,
      'other': 39,
      'multipel issues': 129,
      'unknown issue': 49,
      'audio input': 59,
      'screen & display': 119
    },
    'feature-phone': {
      'charging port': 29,
      'buttons': 25,
      'audio output': 25,
      'other': 19,
      'multipel issues': 49,
      'unknown issue': 25,
      'audio input': 25,
      'screen & display': 39
    }
  };

  res.status(200).json(pricingMatrix);
};

// Admin: Get all tickets
exports.getTickets = async (req, res) => {
  try {
    // Serve directly from RAM if available and fresh
    if (repairCache && (Date.now() - lastFetchTime < CACHE_TTL)) {
      return res.status(200).json(repairCache);
    }

    const tickets = await RepairTicket.find().sort({ createdAt: -1 }).lean();
    repairCache = tickets;
    lastFetchTime = Date.now();

    res.status(200).json(tickets);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving tickets', error: error.message });
  }
};

// Admin: Get a single ticket by id
exports.getTicketById = async (req, res) => {
  try {
    const ticket = await RepairTicket.findById(req.params.id).lean();
    if (!ticket) {
      return res.status(404).json({ message: 'Repair ticket not found' });
    }
    res.status(200).json(ticket);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving ticket', error: error.message });
  }
};

// Admin: Update ticket details/status
exports.updateTicketStatus = async (req, res) => {
  try {
    const { status, notes, estimatedPrice, customerName, customerPhone, deviceBrand, deviceModel, deviceImage, issue, screenDisplayPrice } = req.body;

    const ticket = await RepairTicket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ message: 'Repair ticket not found' });
    }

    const statusChanged = status && ticket.status !== status;

    if (status) ticket.status = status;
    if (notes !== undefined) ticket.notes = notes;
    if (estimatedPrice !== undefined) ticket.estimatedPrice = estimatedPrice;
    if (customerName !== undefined) ticket.customerName = customerName;
    if (customerPhone !== undefined) ticket.customerPhone = customerPhone;
    if (deviceBrand !== undefined) ticket.deviceBrand = deviceBrand;
    if (deviceModel !== undefined) ticket.deviceModel = deviceModel;
    if (deviceImage !== undefined) {
      ticket.deviceImage = deviceImage ? await processImage(deviceImage) : '';
    }
    if (issue !== undefined) ticket.issue = issue;
    if (screenDisplayPrice !== undefined) ticket.screenDisplayPrice = screenDisplayPrice;

    if (statusChanged) {
      ticket.messages.push({
        sender: 'system',
        text: `Status changed to ${status}`
      });
    }

    await ticket.save();
    invalidateRepairCache();

    // Sync repair sale transaction
    if (ticket.status === 'Completed') {
      const existingTx = await Transaction.findOne({ notes: `Repair ticket ID: ${ticket._id}` });
      if (existingTx) {
        existingTx.totalPrice = ticket.estimatedPrice || 0;
        existingTx.description = `Repair: ${ticket.deviceBrand} ${ticket.deviceModel}`;
        await existingTx.save();
      } else {
        await Transaction.create({
          type: 'sale',
          description: `Repair: ${ticket.deviceBrand} ${ticket.deviceModel}`,
          totalPrice: ticket.estimatedPrice || 0,
          quantity: 1,
          clientName: ticket.customerName,
          notes: `Repair ticket ID: ${ticket._id}`
        });
      }
    } else {
      await Transaction.deleteOne({ notes: `Repair ticket ID: ${ticket._id}` });
    }

    res.status(200).json({
      message: 'Ticket updated successfully',
      ticket
    });
  } catch (error) {
    res.status(400).json({ message: 'Error updating ticket', error: error.message });
  }
};

// Admin: Delete a ticket
exports.deleteTicket = async (req, res) => {
  try {
    const ticket = await RepairTicket.findByIdAndDelete(req.params.id);
    if (!ticket) {
      return res.status(404).json({ message: 'Repair ticket not found' });
    }
    invalidateRepairCache();
    res.status(200).json({ message: 'Ticket deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting ticket', error: error.message });
  }
};

// Post a new message on a ticket
exports.postMessage = async (req, res) => {
  try {
    const { sender, text } = req.body;

    if (!sender || !text || !text.trim()) {
      return res.status(400).json({ message: 'Sender and message text are required' });
    }

    if (!['client', 'admin'].includes(sender)) {
      return res.status(400).json({ message: 'Invalid message sender' });
    }

    // Secure 'admin' sender using JWT authorization header validation
    if (sender === 'admin') {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Access denied. Administrator token required.' });
      }
      const token = authHeader.split(' ')[1];
      try {
        jwt.verify(token, process.env.JWT_SECRET || 'hanout_kinetic_cybernetic_secret_2026');
      } catch (err) {
        return res.status(401).json({ message: 'Access denied. Invalid administrator token.' });
      }
    }

    const ticket = await RepairTicket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ message: 'Repair ticket not found' });
    }

    ticket.messages.push({
      sender,
      text: text.trim()
    });

    await ticket.save();
    invalidateRepairCache();

    res.status(200).json({
      message: 'Message posted successfully',
      ticket
    });
  } catch (error) {
    res.status(400).json({ message: 'Error posting message', error: error.message });
  }
};
