import { Router } from 'express';
import { authController } from '../controllers/authController';

const router = Router();

// Student authentication
router.post('/student/register', authController.registerStudent);
router.post('/student/login', authController.loginStudent);

// Counselor authentication
router.post('/counselor/register', authController.registerCounselor);
router.post('/counselor/login', authController.loginCounselor);

export default router;
