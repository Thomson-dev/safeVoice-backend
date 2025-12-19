import dotenv from 'dotenv';
import express, { Express, Request, Response } from 'express';
import { connectDB } from './config/database';

import firebaseService from './services/firebaseService';
import authRoutes from './routes/authRoutes';
import publicRoutes from './routes/publicRoutes';
import studentRoutes from './routes/studentRoutes';
import counselorRoutes from './routes/counselorRoutes';
import caseRoutes from './routes/caseRoutes';
import emergencyAlertRoutes from './routes/emergencyAlertRoutes';
import deviceTokenRoutes from './routes/deviceTokenRoutes';
import resourceRoutes from './routes/resourceRoutes';
import { errorHandler } from './middleware/auth';

// Load environment variables
dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 3001;

// Initialize Firebase for push notifications
firebaseService.initializeFirebase();

// Middleware
app.use(express.json());

// Connect to MongoDB and start server
const startServer = async () => {
  try {
    await connectDB();

    // Health check
    app.get('/api/health', (req: Request, res: Response) => {
      res.json({ status: 'OK', timestamp: new Date().toISOString() });
    });

    // Home route
    app.get('/', (req: Request, res: Response) => {
      res.json({ 
        message: 'SafeVoice Backend API',
        version: '1.0.0',
        endpoints: {
          auth: '/api/auth',
          public: '/api',
          student: '/api/student',
          cases: '/api/cases',
          counselor: '/api/counselor',
          alerts: '/api/alerts',
          devices: '/api/devices'
        }
      });
    });

    // Mount routes
    app.use('/api/auth', authRoutes);
    app.use('/api', publicRoutes);
    app.use('/api/student', studentRoutes);
    app.use('/api/counselor', counselorRoutes);
    app.use('/api/cases', caseRoutes);
    app.use('/api/alerts', emergencyAlertRoutes);
    app.use('/api/devices', deviceTokenRoutes);
    app.use('/api/alerts', emergencyAlertRoutes);
    app.use('/api', resourceRoutes);

    // 404 handler
    app.use((req: Request, res: Response) => {
      res.status(404).json({
        error: 'Endpoint not found'
      });
    });

    // Error handling
    app.use(errorHandler);

    // Start listening
    app.listen(PORT, () => {
      console.log(`✅ SafeVoice Backend running on port ${PORT}`);
      console.log(`\n🔐 Auth Routes:`);
      console.log(`  POST /api/auth/register/student - Register new student`);
      console.log(`  POST /api/auth/login/student - Student login`);
      console.log(`\n📝 Report Routes:`);
      console.log(`  POST /api/reports - Submit anonymous report (auth required)`);
      console.log(`  GET /api/reports/:trackingCode - Check report status (public)`);
      console.log(`  GET /api/my-reports - View all my reports (auth required)`);
      console.log(`\n👥 Trusted Contacts:`);
      console.log(`  POST /api/student/contacts - Save trusted contact`);
      console.log(`  GET /api/student/contacts - View all contacts`);
      console.log(`  PATCH /api/student/contacts/:id - Update contact`);
      console.log(`  DELETE /api/student/contacts/:id - Delete contact`);
      console.log(`\n💬 Messages:`);
      console.log(`  POST /api/student/messages - Send message to counselor`);
      console.log(`  GET /api/student/reports/:reportId/messages - Get report messages`);
      console.log(`  GET /api/student/messages/unread - Get unread messages`);
      console.log(`  PATCH /api/student/messages/:messageId/read - Mark as read`);
      console.log(`\n📚 Resources:`);
      console.log(`  GET /api/resources - Get all help resources`);
      console.log(`\n📋 Case Management:`);
      console.log(`  GET /api/cases/my-cases - Get counselor's assigned cases`);
      console.log(`  GET /api/cases/available - Get unassigned cases to pick from`);
      console.log(`  POST /api/cases/:caseId/claim - Claim an unassigned case`);
      console.log(`  GET /api/cases/:caseId - Get case details`);
      console.log(`  PATCH /api/cases/:caseId/status - Update case status`);
      console.log(`  PATCH /api/cases/:caseId/risk-level - Update risk level`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Start server only if not in serverless environment
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  startServer();
}

// Export for Vercel serverless
export default app;
