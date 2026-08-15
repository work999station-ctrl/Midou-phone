const mongoose = require('mongoose');

const repairTicketSchema = new mongoose.Schema({
  ticketId: {
    type: String,
    unique: true
  },
  customerName: {
    type: String,
    default: '',
    trim: true
  },
  customerPhone: {
    type: String,
    default: '',
    trim: true
  },
  deviceType: {
    type: String,
    required: [true, 'Device type is required'],
    enum: {
      values: ['phone', 'tablet', 'feature-phone'],
      message: '{VALUE} is not a valid device type'
    }
  },
  deviceBrand: {
    type: String,
    required: [true, 'Device brand is required'],
    trim: true
  },
  deviceModel: {
    type: String,
    required: [true, 'Device model is required'],
    trim: true
  },
  deviceImage: {
    type: String,
    default: ''
  },
  issue: {
    type: [String],
    required: [true, 'Device issue is required'],
    validate: {
      validator: function (v) {
        const validIssues = [
          'charging port',
          'buttons',
          'audio output',
          'other',
          'unknown issue',
          'audio input',
          'screen & display',
          'battery',
          'changing cover',
          'camera'
        ];
        return v && v.length > 0 && v.every(val => validIssues.includes(val));
      },
      message: 'One or more selected issues are invalid.'
    }
  },
  screenDisplayPrice: {
    type: Number,
    default: 0
  },
  notes: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    required: true,
    default: 'In Progress',
    enum: {
      values: ['In Progress', 'Ready for Pickup', 'Completed', 'Cancelled'],
      message: '{VALUE} is not a valid ticket status'
    }
  },
  estimatedPrice: {
    type: Number,
    default: 0,
    min: [0, 'Price estimate cannot be negative']
  },
  messages: [
    {
      sender: {
        type: String,
        enum: {
          values: ['client', 'admin', 'system'],
          message: '{VALUE} is not a valid message sender'
        },
        required: true
      },
      text: {
        type: String,
        required: true
      },
      createdAt: {
        type: Date,
        default: Date.now
      }
    }
  ]
}, {
  timestamps: true
});

// Pre-save hook to generate ticket ID if not present
repairTicketSchema.pre('save', function () {
  if (!this.ticketId) {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD
    const randomSuffix = Math.floor(1000 + Math.random() * 9000); // 4-digit random number
    this.ticketId = `REP-${dateStr}-${randomSuffix}`;
  }

  if (this.deviceModel) {
    this.deviceModel = this.deviceModel
      .replace(/\s*\(?\s*\b\d+\s*(?:GB|TB|gb|tb|Gb|Tb)\b\s*\)?/gi, '')
      .replace(/\s*\(?\s*\b(?:unlocked|verizon|at&t|t-mobile|sprint|carrier)\b\s*\)?/gi, '')
      .replace(/\s*-\s*$/, '')
      .replace(/\s*\(\s*\)\s*/g, '')
      .trim();
  }
});

repairTicketSchema.index({ createdAt: -1 });
repairTicketSchema.index({ status: 1 });
repairTicketSchema.index({ customerPhone: 1 });

module.exports = mongoose.model('RepairTicket', repairTicketSchema);
