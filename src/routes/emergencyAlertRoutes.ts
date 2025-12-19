import { Router } from 'express';
import { emergencyAlertController } from '../controllers/emergencyAlertController';
import { auth } from '../middleware/auth';

const router = Router();

// Student emergency endpoints
router.post('/sos', auth, emergencyAlertController.triggerSOS);

// Counselor escalation endpoints
router.post('/escalate/:caseId', auth, emergencyAlertController.escalateCase);

// Alert details (student or assigned counselor)
router.get('/:alertId', auth, emergencyAlertController.getAlertDetails);

// Resolve alert (counselor only)
router.patch('/:alertId/resolve', auth, emergencyAlertController.resolveAlert);

// Active alerts (admin dashboard)
router.get('/', auth, emergencyAlertController.getActiveAlerts);

export default router;
