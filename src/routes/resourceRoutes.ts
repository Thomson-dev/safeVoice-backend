import { Router } from 'express';
import { resourceController } from '../controllers/resourceController';

const router = Router();

// Resource routes (public, no auth required)
router.get('/resources', resourceController.getAllResources);
router.get('/resources/category/:category', resourceController.getResourcesByCategory);
router.get('/resources/24h/available', resourceController.get24hResources);

export default router;
