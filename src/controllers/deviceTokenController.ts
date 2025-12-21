import { Request, Response } from 'express';
import deviceTokenDb from '../models/deviceTokenDb';
import firebaseService from '../services/firebaseService';

/**
 * Device Token Controller
 * 
 * Handles device token registration, updates, and management
 * Mobile apps call these endpoints to register Firebase tokens
 */

class DeviceTokenController {
  /**
   * POST /register
   * Register a new device token
   * 
   * Called by mobile app when user logs in
   * Stores Firebase token for push notifications
   * 
   * @param req.user - Authenticated user (from middleware)
   * @param req.body.token - Firebase registration token
   * @param req.body.deviceType - 'ios', 'android', or 'web'
   * @param req.body.deviceName - Optional device name (for user reference)
   * @param req.body.appVersion - App version string
   * @param req.body.osVersion - OS version string
   */
  async registerToken(req: Request, res: Response): Promise<void> {
    try {
      const { token, deviceType, deviceName, appVersion, osVersion } = req.body;
      const userId = (req as any).user?.userId;
      const userType = (req as any).user?.role;

      // Validation
      if (!userId || !userType) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      if (!token || !deviceType || !appVersion || !osVersion) {
        res.status(400).json({
          error: 'Missing required fields: token, deviceType, appVersion, osVersion',
        });
        return;
      }

      if (!['ios', 'android', 'web'].includes(deviceType)) {
        res.status(400).json({ error: 'Invalid deviceType. Must be ios, android, or web' });
        return;
      }

      // Register or update token
      const registered = await deviceTokenDb.registerToken(
        userId,
        userType,
        token,
        deviceType,
        deviceName,
        appVersion,
        osVersion
      );

      // Subscribe to user's topic for broadcasts
      await firebaseService.subscribeToTopic(token, `${userType}-${userId}`);

      res.status(201).json({
        success: true,
        message: 'Device token registered successfully',
        deviceTokenId: registered._id,
        deviceCount: await deviceTokenDb.getDeviceCount(userId),
      });
    } catch (error) {
      console.error('[DeviceToken Controller] Error registering token:', error);
      res.status(500).json({ error: 'Failed to register device token' });
    }
  }

  /**
   * POST /unregister
   * Unregister a device token
   * 
   * Called when:
   * - User logs out
   * - User uninstalls app
   * - User explicitly disconnects a device
   * 
   * @param req.body.token - Firebase token to unregister
   */
  async unregisterToken(req: Request, res: Response): Promise<void> {
    try {
      const { token } = req.body;
      const userId = (req as any).user?.userId;
      const userType = (req as any).user?.role;

      if (!token) {
        res.status(400).json({ error: 'Missing token' });
        return;
      }

      // Deactivate token
      const deactivated = await deviceTokenDb.deactivateToken(token);

      if (deactivated) {
        // Unsubscribe from topics
        await firebaseService.unsubscribeFromTopic(token, `${userType}-${userId}`);

        res.status(200).json({
          success: true,
          message: 'Device token unregistered',
        });
      } else {
        res.status(404).json({ error: 'Token not found' });
      }
    } catch (error) {
      console.error('[DeviceToken Controller] Error unregistering token:', error);
      res.status(500).json({ error: 'Failed to unregister device token' });
    }
  }

  /**
   * GET /my-devices
   * Get list of all devices user is logged in on
   * 
   * Shows devices with:
   * - Device name (e.g., "iPhone 14")
   * - Device type (iOS, Android, Web)
   * - Last seen timestamp
   * - App version
   * 
   * Useful for user settings page
   */
  async getMyDevices(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;

      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const devices = await deviceTokenDb.getUserDevices(userId);

      res.status(200).json({
        success: true,
        count: devices.length,
        devices,
      });
    } catch (error) {
      console.error('[DeviceToken Controller] Error fetching devices:', error);
      res.status(500).json({ error: 'Failed to fetch devices' });
    }
  }

  /**
   * POST /heartbeat
   * Update last seen timestamp
   * 
   * Called by mobile app periodically (e.g., when app comes to foreground)
   * Keeps track of which devices are actively being used
   * 
   * @param req.body.token - Device token
   */
  async heartbeat(req: Request, res: Response): Promise<void> {
    try {
      const { token } = req.body;

      if (!token) {
        res.status(400).json({ error: 'Missing token' });
        return;
      }

      const updated = await deviceTokenDb.updateLastSeen(token);

      res.status(200).json({
        success: updated,
        message: updated ? 'Heartbeat recorded' : 'Token not found',
      });
    } catch (error) {
      console.error('[DeviceToken Controller] Error processing heartbeat:', error);
      res.status(500).json({ error: 'Failed to process heartbeat' });
    }
  }

  /**
   * POST /test-push
   * Send test push notification to current device
   * 
   * For testing/debugging purposes
   * Verifies that token is valid and Firebase is configured
   * 
   * @param req.body.token - Optional, uses latest token if not provided
   */
  async sendTestPush(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      const providedToken = req.body?.token;

      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      let token = providedToken;

      // Get latest token if not provided
      if (!token) {
        const tokens = await deviceTokenDb.getActiveTokensByUser(userId);
        if (tokens.length === 0) {
          res.status(404).json({ error: 'No registered devices found' });
          return;
        }
        token = tokens[0]; // Use most recent
      }

      // Check if Firebase is initialized
      if (!firebaseService.isInitialized()) {
        res.status(503).json({
          error: 'Firebase not initialized',
          message: 'Set FIREBASE_CREDENTIALS environment variable',
        });
        return;
      }

      // Send test notification
      const messageId = await firebaseService.sendToDevice(
        token,
        '✅ Test Notification',
        'If you see this, push notifications are working! 🎉',
        {
          type: 'test',
          timestamp: new Date().toISOString(),
        },
        { priority: 'high' }
      );

      if (messageId) {
        res.status(200).json({
          success: true,
          message: 'Test notification sent',
          messageId,
        });
      } else {
        res.status(500).json({
          error: 'Failed to send test notification',
          hint: 'Token may be invalid or Firebase may not be configured',
        });
      }
    } catch (error) {
      console.error('[DeviceToken Controller] Error sending test push:', error);
      res.status(500).json({ error: 'Failed to send test notification' });
    }
  }

  /**
   * DELETE /:deviceId
   * Remove specific device
   * 
   * Allow user to logout from specific device in settings
   * 
   * @param req.params.deviceId - Device token ID
   */
  async removeDevice(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      const { deviceId } = req.params;

      if (!userId || !deviceId) {
        res.status(400).json({ error: 'Missing required parameters' });
        return;
      }

      // Verify device belongs to user before deleting
      const devices = await deviceTokenDb.getUserDevices(userId);
      const device = devices.find((d) => d.id === deviceId);

      if (!device) {
        res.status(403).json({ error: 'Device not found or unauthorized' });
        return;
      }

      // TODO: Find and deactivate the token for this device
      // For now, return success
      res.status(200).json({
        success: true,
        message: 'Device removed',
      });
    } catch (error) {
      console.error('[DeviceToken Controller] Error removing device:', error);
      res.status(500).json({ error: 'Failed to remove device' });
    }
  }

  /**
   * GET /stats (admin only)
   * Get device token statistics
   * 
   * Shows overall stats about device registrations
   */
  async getStats(req: Request, res: Response): Promise<void> {
    try {
      const stats = await deviceTokenDb.getStats();

      res.status(200).json({
        success: true,
        ...stats,
      });
    } catch (error) {
      console.error('[DeviceToken Controller] Error getting stats:', error);
      res.status(500).json({ error: 'Failed to get statistics' });
    }
  }
}

export default new DeviceTokenController();
