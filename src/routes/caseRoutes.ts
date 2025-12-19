import { Router } from 'express';
import { caseController } from '../controllers/caseController';
import { messageController } from '../controllers/messageController';
import { auth } from '../middleware/auth';

const router = Router();

// Counselor routes (all auth required)
router.get('/my-cases', auth, caseController.getMyCases);
router.get('/available', auth, caseController.getAvailableCases);
router.post('/:caseId/claim', auth, caseController.claimCase);
router.get('/:caseId', auth, caseController.getCaseDetails);
router.patch('/:caseId/status', auth, caseController.updateCaseStatus);
router.patch('/:caseId/risk-level', auth, caseController.updateRiskLevel);

// Messaging within cases
router.post('/:caseId/messages', auth, messageController.sendCounselorMessage);
router.get('/:caseId/messages', auth, messageController.getCaseMessages);

export default router;
