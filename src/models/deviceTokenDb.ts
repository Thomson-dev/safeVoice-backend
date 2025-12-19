import DeviceTokenSchema, { DeviceToken } from './schemas/DeviceTokenSchema';

/**
 * Device Token Database Operations
 * 
 * Manages Firebase registration tokens for push notifications
 */

class DeviceTokenDb {
  /**
   * Register or update a device token
   * 
   * Called when:
   * - User logs in on new device
   * - App is reinstalled
   * - Firebase token refreshes
   * 
   * @param userId - User ID
   * @param userType - 'student' or 'counselor'
   * @param token - Firebase registration token
   * @param deviceType - 'ios', 'android', or 'web'
   * @param deviceName - Optional device name for user reference
   * @param appVersion - App version string
   * @param osVersion - OS version string
   */
  async registerToken(
    userId: string,
    userType: 'student' | 'counselor',
    token: string,
    deviceType: 'ios' | 'android' | 'web',
    deviceName: string | undefined,
    appVersion: string,
    osVersion: string
  ): Promise<DeviceToken> {
    try {
      // Check if token already exists (e.g., from reinstall)
      const existing = await DeviceTokenSchema.findOne({ token });

      if (existing) {
        // Update existing token registration
        existing.userId = userId as any;
        existing.userType = userType;
        existing.isActive = true;
        existing.lastSeenAt = new Date();
        existing.deviceType = deviceType;
        existing.deviceName = deviceName || existing.deviceName;
        existing.appVersion = appVersion;
        existing.osVersion = osVersion;
        
        const updated = await existing.save();
        console.log(`[DeviceToken] ✅ Updated existing token for ${userType}: ${userId}`);
        return updated;
      }

      // Create new token registration
      const newToken = new DeviceTokenSchema({
        userId,
        userType,
        token,
        deviceType,
        deviceName,
        appVersion,
        osVersion,
        isActive: true,
        lastSeenAt: new Date(),
      });

      const saved = await newToken.save();
      console.log(`[DeviceToken] ✅ Registered new token for ${userType}: ${userId}`);
      return saved;
    } catch (error) {
      console.error('[DeviceToken] Error registering token:', error);
      throw error;
    }
  }

  /**
   * Get all active tokens for a user
   * 
   * Used to send notifications to all user's devices
   * 
   * @param userId - User ID
   * @returns Array of device tokens
   */
  async getActiveTokensByUser(userId: string): Promise<string[]> {
    try {
      const tokens = await DeviceTokenSchema.find({
        userId,
        isActive: true,
      }).select('token');

      return tokens.map((t) => t.token);
    } catch (error) {
      console.error('[DeviceToken] Error fetching user tokens:', error);
      return [];
    }
  }

  /**
   * Get all active tokens for multiple users
   * 
   * Used for bulk notifications (e.g., "New student needs help" to all counselors)
   * 
   * @param userIds - Array of user IDs
   * @returns Map of userId -> tokens[]
   */
  async getActiveTokensByUsers(userIds: string[]): Promise<Map<string, string[]>> {
    try {
      const results = await DeviceTokenSchema.find({
        userId: { $in: userIds },
        isActive: true,
      }).select('userId token');

      const map = new Map<string, string[]>();
      results.forEach((doc) => {
        const userId = doc.userId.toString();
        if (!map.has(userId)) {
          map.set(userId, []);
        }
        map.get(userId)!.push(doc.token);
      });

      return map;
    } catch (error) {
      console.error('[DeviceToken] Error fetching multiple user tokens:', error);
      return new Map();
    }
  }

  /**
   * Mark a device token as inactive
   * 
   * Called when:
   * - User logs out
   * - App is uninstalled
   * - Firebase token is invalid
   * 
   * @param token - Device token to deactivate
   */
  async deactivateToken(token: string): Promise<boolean> {
    try {
      const result = await DeviceTokenSchema.findOneAndUpdate(
        { token },
        { isActive: false },
        { new: true }
      );

      if (result) {
        console.log(`[DeviceToken] ✅ Deactivated token: ${token.substring(0, 20)}...`);
        return true;
      }
      return false;
    } catch (error) {
      console.error('[DeviceToken] Error deactivating token:', error);
      return false;
    }
  }

  /**
   * Mark multiple tokens as inactive
   * 
   * Used for cleanup after bulk failures
   * 
   * @param tokens - Array of tokens to deactivate
   */
  async deactivateMultipleTokens(tokens: string[]): Promise<number> {
    try {
      const result = await DeviceTokenSchema.updateMany(
        { token: { $in: tokens } },
        { isActive: false }
      );

      console.log(`[DeviceToken] ✅ Deactivated ${result.modifiedCount} tokens`);
      return result.modifiedCount;
    } catch (error) {
      console.error('[DeviceToken] Error deactivating tokens:', error);
      return 0;
    }
  }

  /**
   * Update last seen time (called with each login or app open)
   * 
   * @param token - Device token
   */
  async updateLastSeen(token: string): Promise<boolean> {
    try {
      const result = await DeviceTokenSchema.findOneAndUpdate(
        { token },
        { lastSeenAt: new Date() },
        { new: true }
      );

      return !!result;
    } catch (error) {
      console.error('[DeviceToken] Error updating last seen:', error);
      return false;
    }
  }

  /**
   * Get user's device count
   * 
   * Useful for tracking how many devices user is logged in on
   * 
   * @param userId - User ID
   * @returns Count of active devices
   */
  async getDeviceCount(userId: string): Promise<number> {
    try {
      const count = await DeviceTokenSchema.countDocuments({
        userId,
        isActive: true,
      });

      return count;
    } catch (error) {
      console.error('[DeviceToken] Error getting device count:', error);
      return 0;
    }
  }

  /**
   * Get all devices for a user (with details)
   * 
   * Used for user settings page to show "devices logged in on"
   * 
   * @param userId - User ID
   */
  async getUserDevices(userId: string): Promise<Array<{
    id: string;
    deviceName?: string;
    deviceType: string;
    osVersion: string;
    appVersion: string;
    lastSeenAt: Date;
  }>> {
    try {
      const devices = await DeviceTokenSchema.find({
        userId,
        isActive: true,
      }).select('deviceName deviceType osVersion appVersion lastSeenAt');

      return devices.map((d) => ({
        id: d._id.toString(),
        deviceName: d.deviceName,
        deviceType: d.deviceType,
        osVersion: d.osVersion,
        appVersion: d.appVersion,
        lastSeenAt: d.lastSeenAt,
      }));
    } catch (error) {
      console.error('[DeviceToken] Error getting user devices:', error);
      return [];
    }
  }

  /**
   * Delete all tokens for a user (used on account deletion)
   * 
   * @param userId - User ID
   */
  async deleteUserTokens(userId: string): Promise<number> {
    try {
      const result = await DeviceTokenSchema.deleteMany({ userId });
      console.log(`[DeviceToken] ✅ Deleted ${result.deletedCount} tokens for user: ${userId}`);
      return result.deletedCount;
    } catch (error) {
      console.error('[DeviceToken] Error deleting user tokens:', error);
      return 0;
    }
  }

  /**
   * Clean up old inactive tokens (older than 30 days)
   * 
   * Run periodically to keep database clean
   */
  async cleanupOldTokens(daysOld: number = 30): Promise<number> {
    try {
      const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);
      const result = await DeviceTokenSchema.deleteMany({
        isActive: false,
        lastSeenAt: { $lt: cutoffDate },
      });

      console.log(`[DeviceToken] ✅ Cleaned up ${result.deletedCount} old tokens`);
      return result.deletedCount;
    } catch (error) {
      console.error('[DeviceToken] Error cleaning up tokens:', error);
      return 0;
    }
  }

  /**
   * Get statistics about device registrations
   * 
   * @returns Object with stats
   */
  async getStats(): Promise<{
    totalTokens: number;
    activeTokens: number;
    inactiveTokens: number;
    byDeviceType: Record<string, number>;
    byUserType: Record<string, number>;
  }> {
    try {
      const total = await DeviceTokenSchema.countDocuments();
      const active = await DeviceTokenSchema.countDocuments({ isActive: true });

      const byDevice = await DeviceTokenSchema.aggregate([
        { $group: { _id: '$deviceType', count: { $sum: 1 } } },
      ]);

      const byUser = await DeviceTokenSchema.aggregate([
        { $group: { _id: '$userType', count: { $sum: 1 } } },
      ]);

      const deviceTypeMap: Record<string, number> = {};
      byDevice.forEach((item: any) => {
        deviceTypeMap[item._id] = item.count;
      });

      const userTypeMap: Record<string, number> = {};
      byUser.forEach((item: any) => {
        userTypeMap[item._id] = item.count;
      });

      return {
        totalTokens: total,
        activeTokens: active,
        inactiveTokens: total - active,
        byDeviceType: deviceTypeMap,
        byUserType: userTypeMap,
      };
    } catch (error) {
      console.error('[DeviceToken] Error getting stats:', error);
      return {
        totalTokens: 0,
        activeTokens: 0,
        inactiveTokens: 0,
        byDeviceType: {},
        byUserType: {},
      };
    }
  }
}

export default new DeviceTokenDb();
