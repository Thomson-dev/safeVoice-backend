import { Router } from 'express';
import { messageController } from '../controllers/messageController';
import { counselorAuth } from '../middleware/auth';

const router = Router();

// All counselor routes require authentication
router.use(counselorAuth);

// Messaging - Counselor side
router.post('/messages', messageController.sendCounselorMessage);
router.get('/cases/:caseId/messages', messageController.getCaseMessages);
router.get('/messages/unread', messageController.getCounselorUnreadCount);
router.delete('/messages/notifications', messageController.clearNotifications);

export default router;
