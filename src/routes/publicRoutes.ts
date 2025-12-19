import { Router } from 'express';
import { reportController } from '../controllers/reportController';
import { studentAuth } from '../middleware/auth';

const router = Router();

// Public route - check report status by tracking code
router.get('/reports/:trackingCode', reportController.getReportStatus);

// Student routes (requires authentication)
router.post('/reports', studentAuth, reportController.createReport);
router.get('/my-reports', studentAuth, reportController.getMyReports);
router.get('/reports/:id/details', studentAuth, reportController.getReportDetails);

export default router;
