import express from 'express';
import { auth, errorHandler } from '../middleware/auth';
import deviceTokenController from '../controllers/deviceTokenController';

const router = express.Router();

/**
 * Device Token Routes
 * 
 * For mobile apps to register Firebase tokens
 * Used to send push notifications
 * 
 * Base path: /api/devices
 */

// Public endpoints (for non-authenticated requests)
router.post('/register', (req, res, next) => {
  // Allow any authenticated user (student or counselor)
  auth(req, res, () =>
    deviceTokenController.registerToken(req, res).catch(next)
  );
});

router.post('/unregister', (req, res, next) => {
  auth(req, res, () =>
    deviceTokenController.unregisterToken(req, res).catch(next)
  );
});

// Authenticated endpoints
router.get(
  '/my-devices',
  (req, res, next) => {
    auth(req, res, () => {
      deviceTokenController.getMyDevices(req, res).catch(next);
    });
  }
);

router.post(
  '/heartbeat',
  (req, res, next) => {
    auth(req, res, () => {
      deviceTokenController.heartbeat(req, res).catch(next);
    });
  }
);

router.post(
  '/test-push',
  (req, res, next) => {
    auth(req, res, () => {
      deviceTokenController.sendTestPush(req, res).catch(next);
    });
  }
);

router.delete(
  '/:deviceId',
  (req, res, next) => {
    auth(req, res, () => {
      deviceTokenController.removeDevice(req, res).catch(next);
    });
  }
);

// Admin endpoint
router.get('/stats', (req, res, next) => {
  // TODO: Add admin auth check
  deviceTokenController.getStats(req, res).catch(next);
});

router.use(errorHandler);

export default router;
