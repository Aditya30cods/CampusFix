import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import authRoutes from './routes/auth.js';
import issueRoutes from './routes/issues.js';
import adminRoutes from './routes/admin.js';
import { errorHandler } from './middleware/errors.js';

const app = express();
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_ORIGIN?.split(',') || true }));
app.use(express.json({ limit: '1mb' }));
app.use(morgan('dev'));
app.use('/api', rateLimit({ windowMs: 15 * 60 * 1000, limit: 300, standardHeaders: true, legacyHeaders: false }));
app.get('/api/health', (_req, res) => res.json({ status: 'ok', service: 'CampusFix API' }));
app.use('/api/auth', authRoutes);
app.use('/api/issues', issueRoutes);
app.use('/api/admin', adminRoutes);
app.use((req, res) => res.status(404).json({ message: `Route not found: ${req.method} ${req.path}` }));
app.use(errorHandler);

const port = process.env.PORT || 5000;
if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET is required');
await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/campusfix');
app.listen(port, () => console.log(`CampusFix API listening on ${port}`));
