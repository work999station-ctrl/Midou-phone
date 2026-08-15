const express = require("express");
const dotenv = require('dotenv');
const compression = require('compression');
const db = require('./config/db');
const { connection } = require('./config/db');
const productRoutes = require('./routes/productRoutes');
const repairRoutes = require('./routes/repairRoutes');
const adminRoutes = require('./routes/adminRoutes');
const aiRoutes = require('./routes/aiRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const internalStorageRoutes = require('./routes/internalStorageRoutes');
const debtRoutes = require('./routes/debtRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const Admin = require('../models/Admin');

const path = require('path');

dotenv.config();
const PORT = Number(process.env.PORT) || 4000;
const app = express();

app.use(compression());
app.use(express.json({ limit: '5mb' }));

// Serve uploaded product images statically with 30-day browser cache
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads'), {
  maxAge: '30d',
  immutable: true
}));

// Enable CORS
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// API Routes
app.use('/api/products', productRoutes);
app.use('/api/repairs', repairRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/internal-storage', internalStorageRoutes);
app.use('/api/debts', debtRoutes);
app.use('/api/transactions', transactionRoutes);


// Seeding admin user and syncing with .env credentials
async function seedAdmin() {
  try {
    const adminUsername = process.env.ADMIN_USERNAME || 'admin';
    const adminPassword = process.env.ADMIN_PASSWORD || 'adminPassword123';

    let admin = await Admin.findOne();
    if (!admin) {
      admin = new Admin({
        username: adminUsername,
        password: adminPassword
      });
      await admin.save();
      console.log(`Admin user created with username: ${adminUsername}`);
    } else if (admin.username !== adminUsername || process.env.ADMIN_PASSWORD) {
      admin.username = adminUsername;
      admin.password = adminPassword;
      await admin.save();
      console.log(`Admin user synced from .env with username: ${adminUsername}`);
    }
  } catch (err) {
    console.error('Failed to sync admin user:', err.message);
  }
}

async function warmupCache() {
  try {
    const InternalStorage = require('../models/InternalStorage');
    const Product = require('../models/Product');
    const RepairTicket = require('../models/RepairTicket');
    const { setCache } = require('./controllers/internalStorageController');
    const { setProductCache } = require('./controllers/productController');
    const { setRepairCache } = require('./controllers/repairController');

    const [internalItems, shopItems, repairTickets] = await Promise.all([
      InternalStorage.find({}).sort({ createdAt: -1 }).lean(),
      Product.find({}).sort({ createdAt: -1 }).lean(),
      RepairTicket.find({}).sort({ createdAt: -1 }).lean()
    ]);

    setCache(internalItems);
    setProductCache(shopItems);
    setRepairCache(repairTickets);
    console.log(`Cache warmed up: ${internalItems.length} internal products, ${shopItems.length} shop products, ${repairTickets.length} repair tickets.`);
  } catch (err) {
    console.error('Cache warm-up error:', err.message);
  }
}

app.get('/health', (req, res) => res.status(200).send('OK'));

app.listen(PORT, () => {
  console.log("server started on port " + PORT);
  connection()
    .then(async () => {
      await seedAdmin();
      await warmupCache();
    })
    .catch((err) => {
      console.error("Database connection error:", err.message);
    });
});