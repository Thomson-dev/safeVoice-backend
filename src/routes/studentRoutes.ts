import { Router } from 'express';
import { contactController } from '../controllers/contactController';
import { messageController } from '../controllers/messageController';
import { studentAuth } from '../middleware/auth';

const router = Router();

// All student routes require authentication
router.use(studentAuth);

// Trusted contacts
router.post('/contacts', contactController.createContact);
router.get('/contacts', contactController.getMyContacts);
router.patch('/contacts/:id', contactController.updateContact);
router.delete('/contacts/:id', contactController.deleteContact);

// Messaging - Student side
router.post('/messages', messageController.sendStudentMessage);
router.get('/reports/:reportId/messages', messageController.getReportMessages);
router.get('/messages/unread', messageController.getStudentUnreadCount);
router.delete('/messages/notifications', messageController.clearNotifications);

export default router;
