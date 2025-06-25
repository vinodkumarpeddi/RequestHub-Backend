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
import hackathonRoutes from "./routes/hackathonRoutes.js"
import leaveRoutes from "./routes/leaveRoutes.js"
import idRoutes from './routes/idRoutes.js'
import dashboardRoutes from './routes/dashboardRoutes.js';
import bulkApproveRoute from './routes/bulkApprove.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;
connectDB();

const allowedOrigins = ['http://localhost:5173']

app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));


app.use("/uploads", express.static("uploads"));
app.use("/hackathonuploads", express.static(join(__dirname, "hackathonuploads")));
app.use('/pdfs', express.static(join(__dirname, 'pdfs')));
app.use('/Idpdfs', express.static(join(__dirname, 'Idpdfs')));


app.use('/api/auth', authRouter);
app.use('/api/user', userRouter)

app.use('/api/admin-add', adminAddRouter);

app.use('/api', bulkApproveRoute);
app.use("/api", dashboardRoutes);
app.use("/api", formRoutes);
app.use("/api", hackathonRoutes);
app.use("/api", leaveRoutes);
app.use("/api", idRoutes);

app.listen(PORT, () => {
  console.log(`Server Is Running On Port : ${PORT}`);
});



