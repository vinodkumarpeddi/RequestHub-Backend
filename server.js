import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import cookieParser from 'cookie-parser';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

import connectDB from './config/mongodb.js';

import authRouter from './routes/authRoutes.js';
import userRouter from './routes/userRoutes.js';
import adminAddRouter from './routes/adminAddRoutes.js';
import formRoutes from './routes/formRoutes.js';
import hackathonRoutes from "./routes/hackathonRoutes.js";
import leaveRoutes from "./routes/leaveRoutes.js";
import idRoutes from './routes/idRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import bulkApproveRoute from './routes/bulkApprove.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// 🟢 Connect to MongoDB
connectDB();

// 🟢 CORS Setup (BEFORE routes)
const allowedOrigins = [
  'https://request-hub-services.vercel.app',
  'http://localhost:5173'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// 🟢 Middleware
app.use(express.json());
app.use(cookieParser());

// 🟢 Debugging incoming origin
app.use((req, res, next) => {
  console.log('🛰️ Origin:', req.headers.origin);
  console.log('📨 Body:', req.body);
  next();
});

// 🟢 Static File Serving
app.use("/uploads", express.static("uploads"));
app.use("/hackathonuploads", express.static(join(__dirname, "hackathonuploads")));
app.use("/pdfs", express.static(join(__dirname, "pdfs")));
app.use("/Idpdfs", express.static(join(__dirname, "Idpdfs")));

// 🟢 Routes
app.use('/api/auth', authRouter);
app.use('/api/user', userRouter);
app.use('/api/admin-add', adminAddRouter);
app.use('/api', bulkApproveRoute);
app.use('/api', dashboardRoutes);
app.use('/api', formRoutes);
app.use('/api', hackathonRoutes);
app.use('/api', leaveRoutes);
app.use('/api', idRoutes);

// 🔴 Error handler for CORS and internal errors
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.message);
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({ message: 'CORS Error: Origin not allowed' });
  }
  res.status(500).json({ message: 'Internal Server Error', error: err.message });
});

// 🟢 Start Server
app.listen(PORT, () => {
  console.log(` Server running on port ${PORT}`);
});
