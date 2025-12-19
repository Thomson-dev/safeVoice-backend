import * as admin from 'firebase-admin';
import path from 'path';

/**
 * Firebase Push Notification Service
 * 
 * Handles all push notification delivery via Firebase Cloud Messaging (FCM)
 * Used for:
 * - Message notifications (counselor replied, new message)
 * - Emergency alerts (SOS, escalation)
 * - Case updates (assigned, status change)
 * - General notifications
 */

class FirebaseService {
  private initialized = false;

  /**
   * Initialize Firebase Admin SDK
   * Call this once during app startup
   * 
   * Credentials priority:
   * 1. FIREBASE_CREDENTIALS environment variable (path to JSON file)
   * 2. GOOGLE_APPLICATION_CREDENTIALS environment variable (system-wide)
   * 3. Default service account (if running on Google Cloud)
   */
  initializeFirebase() {
    if (this.initialized) {
      console.log('[Firebase] Already initialized');
      return;
    }

    try {
      let options: admin.ServiceAccount | undefined;

      // Method 1: Check for FIREBASE_CREDENTIALS env var (path to JSON file)
      const credentialsPath = process.env.FIREBASE_CREDENTIALS;
      if (credentialsPath) {
        const resolvedPath = path.resolve(credentialsPath);
        console.log(`[Firebase] Loading credentials from: ${resolvedPath}`);
        // ServiceAccount will be loaded from path
        options = require(resolvedPath);
      }

      // Initialize Firebase Admin
      admin.initializeApp({
        credential: options
          ? admin.credential.cert(options)
          : admin.credential.applicationDefault(),
        projectId: process.env.FIREBASE_PROJECT_ID,
      });

      this.initialized = true;
      console.log('[Firebase] ✅ Initialized successfully');
    } catch (error) {
      console.error('[Firebase] ❌ Initialization failed:', error);
      console.log('[Firebase] Push notifications will be unavailable');
      console.log('[Firebase] Set up: https://firebase.google.com/docs/admin/setup');
      this.initialized = false;
    }
  }

  /**
   * Check if Firebase is properly initialized
   */
  isInitialized(): boolean {
    return this.initialized && admin.apps.length > 0;
  }

  /**
   * Send push notification to a single device
   * 
   * @param deviceToken - Firebase registration token from mobile app
   * @param title - Notification title (25 chars max for best display)
   * @param body - Notification body (150 chars max)
   * @param data - Additional data payload (custom data for app)
   * @param options - Additional FCM options (TTL, priority, etc)
   * 
   * @returns Promise with message ID if sent, null if failed
   */
  async sendToDevice(
    deviceToken: string,
    title: string,
    body: string,
    data?: Record<string, string>,
    options?: {
      ttl?: number; // Time to live in seconds (default: 86400 = 1 day)
      priority?: 'high' | 'normal'; // high for time-sensitive, normal otherwise
      clickAction?: string; // Action to perform when user taps notification
    }
  ): Promise<string | null> {
    if (!this.isInitialized()) {
      console.warn('[Firebase] Not initialized, cannot send push notification');
      return null;
    }

    try {
      const message: admin.messaging.Message = {
        token: deviceToken,
        notification: {
          title,
          body,
        },
        data: data || {},
        android: {
          priority: options?.priority === 'high' ? 'high' : 'normal',
          ttl: (options?.ttl || 86400) * 1000, // Convert to milliseconds
          notification: {
            clickAction: options?.clickAction,
          },
        },
        apns: {
          headers: {
            'apns-priority': options?.priority === 'high' ? '10' : '5',
            'apns-ttl': String(options?.ttl || 86400),
          },
          payload: {
            aps: {
              alert: {
                title,
                body,
              },
              sound: 'default',
              badge: 1,
            },
          },
        },
        webpush: {
          headers: {
            TTL: String(options?.ttl || 86400),
          },
          notification: {
            title,
            body,
            icon: '/icon-192x192.png',
            badge: '/badge-72x72.png',
          },
        },
      };

      const messageId = await admin.messaging().send(message);
      console.log(`[Firebase] ✅ Push sent to device: ${deviceToken.substring(0, 20)}...`);
      return messageId;
    } catch (error: any) {
      // Handle specific Firebase errors
      if (error.code === 'messaging/invalid-registration-token') {
        console.warn(`[Firebase] Invalid token (device uninstalled?): ${deviceToken.substring(0, 20)}...`);
        return null; // Token should be marked for deletion
      } else if (error.code === 'messaging/mismatched-credential') {
        console.error('[Firebase] Credentials don\'t match project ID');
        return null;
      } else if (error.code === 'messaging/message-rate-exceeded') {
        console.warn('[Firebase] Rate limited - try again later');
        return null;
      }
      console.error('[Firebase] Error sending push:', error.message);
      return null;
    }
  }

  /**
   * Send push notification to multiple devices
   * 
   * Uses multicast for efficiency (up to 500 tokens per request)
   * 
   * @param deviceTokens - Array of Firebase registration tokens
   * @param title - Notification title
   * @param body - Notification body
   * @param data - Additional data payload
   * @param options - FCM options
   * 
   * @returns Object with success count and failed tokens
   */
  async sendToMultipleDevices(
    deviceTokens: string[],
    title: string,
    body: string,
    data?: Record<string, string>,
    options?: {
      ttl?: number;
      priority?: 'high' | 'normal';
      clickAction?: string;
    }
  ): Promise<{
    successCount: number;
    failureCount: number;
    failedTokens: string[];
  }> {
    if (!this.isInitialized()) {
      console.warn('[Firebase] Not initialized, cannot send push notifications');
      return {
        successCount: 0,
        failureCount: deviceTokens.length,
        failedTokens: deviceTokens,
      };
    }

    if (deviceTokens.length === 0) {
      return {
        successCount: 0,
        failureCount: 0,
        failedTokens: [],
      };
    }

    try {
      const message: admin.messaging.MulticastMessage = {
        tokens: deviceTokens,
        notification: {
          title,
          body,
        },
        data: data || {},
        android: {
          priority: options?.priority === 'high' ? 'high' : 'normal',
          ttl: (options?.ttl || 86400) * 1000,
        },
        apns: {
          headers: {
            'apns-priority': options?.priority === 'high' ? '10' : '5',
          },
          payload: {
            aps: {
              alert: { title, body },
              sound: 'default',
            },
          },
        },
      };

      const response = await admin.messaging().sendEachForMulticast(message);



      const failedTokens: string[] = [];
    response.responses.forEach((resp: admin.messaging.SendResponse, idx: number) => {
      if (!resp.success) {
        failedTokens.push(deviceTokens[idx]);
      }
    });

      console.log(`[Firebase] ✅ Sent to ${response.successCount}/${deviceTokens.length} devices`);
      if (failedTokens.length > 0) {
        console.warn(`[Firebase] ⚠️ Failed for ${failedTokens.length} devices`);
      }

      return {
        successCount: response.successCount,
        failureCount: response.failureCount,
        failedTokens,
      };
    } catch (error) {
      console.error('[Firebase] Error in multicast send:', error);
      return {
        successCount: 0,
        failureCount: deviceTokens.length,
        failedTokens: deviceTokens,
      };
    }
  }

  /**
   * Send topic-based notification
   * 
   * Use topics to send to groups without maintaining token lists:
   * - "case-{caseId}" - All devices assigned to this case
   * - "student-{studentId}" - All devices for this student
   * - "counselor-{counselorId}" - All devices for this counselor
   * - "emergency" - All devices subscribed to emergency alerts
   * 
   * @param topic - Topic name (max 256 chars)
   * @param title - Notification title
   * @param body - Notification body
   * @param data - Additional data
   */
  async sendToTopic(
    topic: string,
    title: string,
    body: string,
    data?: Record<string, string>
  ): Promise<string | null> {
    if (!this.isInitialized()) {
      console.warn('[Firebase] Not initialized, cannot send to topic');
      return null;
    }

    try {
      const message: admin.messaging.Message = {
        topic,
        notification: {
          title,
          body,
        },
        data: data || {},
      };

      const messageId = await admin.messaging().send(message);
      console.log(`[Firebase] ✅ Topic message sent to "${topic}"`);
      return messageId;
    } catch (error) {
      console.error(`[Firebase] Error sending to topic "${topic}":`, error);
      return null;
    }
  }

  /**
   * Subscribe device token to a topic
   * 
   * @param tokens - Single token or array of tokens
   * @param topic - Topic name
   */
  async subscribeToTopic(
    tokens: string | string[],
    topic: string
  ): Promise<boolean> {
    if (!this.isInitialized()) {
      return false;
    }

    try {
      const tokenArray = Array.isArray(tokens) ? tokens : [tokens];
      await admin.messaging().subscribeToTopic(tokenArray, topic);
      console.log(`[Firebase] ✅ Subscribed ${tokenArray.length} device(s) to topic: ${topic}`);
      return true;
    } catch (error) {
      console.error(`[Firebase] Error subscribing to topic:`, error);
      return false;
    }
  }

  /**
   * Unsubscribe device token from a topic
   * 
   * @param tokens - Single token or array of tokens
   * @param topic - Topic name
   */
  async unsubscribeFromTopic(
    tokens: string | string[],
    topic: string
  ): Promise<boolean> {
    if (!this.isInitialized()) {
      return false;
    }

    try {
      const tokenArray = Array.isArray(tokens) ? tokens : [tokens];
      await admin.messaging().unsubscribeFromTopic(tokenArray, topic);
      console.log(`[Firebase] ✅ Unsubscribed ${tokenArray.length} device(s) from topic: ${topic}`);
      return true;
    } catch (error) {
      console.error(`[Firebase] Error unsubscribing from topic:`, error);
      return false;
    }
  }

  /**
   * Send notification for new message
   * 
   * @param recipientToken - Device token of message recipient
   * @param senderName - Name of person sending message
   * @param messagePreview - First 50 chars of message
   * @param caseId - Case ID (for routing when tap notification)
   */
  async notifyNewMessage(
    recipientToken: string,
    senderName: string,
    messagePreview: string,
    caseId: string
  ): Promise<string | null> {
    return this.sendToDevice(
      recipientToken,
      '💬 New Message',
      `${senderName}: ${messagePreview.substring(0, 50)}${messagePreview.length > 50 ? '...' : ''}`,
      {
        type: 'message',
        caseId,
        sender: senderName,
      },
      {
        priority: 'high',
        clickAction: 'FLUTTER_NOTIFICATION_CLICK', // Standard Flutter action
      }
    );
  }

  /**
   * Send notification for emergency alert
   * 
   * @param recipientToken - Device token
   * @param studentName - Name of student in emergency
   * @param alertType - Type of alert (sos_button, escalation, etc)
   * @param caseId - Case ID
   */
  async notifyEmergencyAlert(
    recipientToken: string,
    studentName: string,
    alertType: string,
    caseId: string
  ): Promise<string | null> {
    return this.sendToDevice(
      recipientToken,
      '🚨 EMERGENCY ALERT',
      `${studentName} - ${alertType === 'sos_button' ? 'SOS Button Pressed' : 'Case Escalated'}`,
      {
        type: 'emergency_alert',
        caseId,
        alertType,
        student: studentName,
      },
      {
        priority: 'high', // High priority for time-sensitive alerts
        ttl: 3600, // 1 hour expiration (emergency shouldn't wait)
      }
    );
  }

  /**
   * Send notification for case update
   * 
   * @param recipientToken - Device token
   * @param caseId - Case ID
   * @param updateType - Type of update (assigned, status_change, etc)
   * @param message - Update message
   */
  async notifyCaseUpdate(
    recipientToken: string,
    caseId: string,
    updateType: string,
    message: string
  ): Promise<string | null> {
    return this.sendToDevice(
      recipientToken,
      `📋 Case Update`,
      message,
      {
        type: 'case_update',
        caseId,
        updateType,
      },
      {
        priority: 'normal',
      }
    );
  }
}

// Export singleton instance
export const firebaseService = new FirebaseService();

export default firebaseService;
