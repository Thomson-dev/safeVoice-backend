/**
 * Emergency Alert Service
 * Handles sending alerts through multiple channels:
 * - Push notifications (Firebase)
 * - SMS (via Africa's Talking)
 * - Email
 * - In-app notifications
 */

import firebaseService from './firebaseService';
import deviceTokenDb from '../models/deviceTokenDb';

// Mock implementations - Replace with real services in production
class AlertService {
  /**
   * Send push notification to user via Firebase
   * 
   * In production: Uses Firebase Cloud Messaging (already integrated)
   */
  async sendPushNotification(
    userId: string,
    title: string,
    body: string,
    data?: Record<string, string>
  ): Promise<boolean> {
    try {
      // Get user's device tokens
      const tokens = await deviceTokenDb.getActiveTokensByUser(userId);

      if (tokens.length === 0) {
        console.warn(`⚠️ No device tokens found for user ${userId}`);
        return false;
      }

      // Send to all user's devices
      const result = await firebaseService.sendToMultipleDevices(
        tokens,
        title,
        body,
        data,
        { priority: 'high' } // High priority for alerts
      );

      console.log(`📱 Push Notification sent to ${userId} (${result.successCount} devices)`);
      console.log(`   Title: ${title}`);
      console.log(`   Body: ${body}`);

      // Mark failed tokens for deletion
      if (result.failedTokens.length > 0) {
        await deviceTokenDb.deactivateMultipleTokens(result.failedTokens);
      }

      return result.successCount > 0;
    } catch (error) {
      console.error('Push notification error:', error);
      return false;
    }
  }

  /**
   * Send SMS alert via Africa's Talking
   * Requires: AFRICAS_TALKING_API_KEY, AFRICAS_TALKING_USERNAME
   * 
   * In production:
   * npm install africastalking
   */
  async sendSMSAlert(
    phoneNumbers: string[],
    message: string
  ): Promise<{ success: boolean; messageIds?: string[] }> {
    try {
      // Production implementation:
      // const AfricasTalking = require('africastalking');
      // const AT = new AfricasTalking({
      //   apiKey: process.env.AFRICAS_TALKING_API_KEY,
      //   username: process.env.AFRICAS_TALKING_USERNAME
      // });
      // const { SMS } = AT;
      // const response = await SMS.send({
      //   to: phoneNumbers,
      //   message: message
      // });
      // return { success: true, messageIds: response.data.SMSMessageData.Recipients.map(r => r.messageId) };

      // Development mock:
      console.log(`📞 SMS Alert would be sent to: ${phoneNumbers.join(', ')}`);
      console.log(`   Message: ${message}`);
      
      return {
        success: true,
        messageIds: phoneNumbers.map((_, i) => `mock-msg-${Date.now()}-${i}`)
      };
    } catch (error) {
      console.error('SMS send error:', error);
      return { success: false };
    }
  }

  /**
   * Send email alert
   * In production: Use Sendgrid, AWS SES, Mailgun, etc.
   */
  async sendEmailAlert(
    emailAddresses: string[],
    subject: string,
    htmlBody: string
  ): Promise<boolean> {
    try {
      // Production implementation:
      // const sgMail = require('@sendgrid/mail');
      // sgMail.setApiKey(process.env.SENDGRID_API_KEY);
      // await sgMail.sendMultiple({
      //   to: emailAddresses,
      //   from: process.env.SAFEVOICE_EMAIL,
      //   subject,
      //   html: htmlBody
      // });

      // Development mock:
      console.log(`📧 Email Alert would be sent to: ${emailAddresses.join(', ')}`);
      console.log(`   Subject: ${subject}`);
      console.log(`   Body: ${htmlBody.substring(0, 100)}...`);
      
      return true;
    } catch (error) {
      console.error('Email send error:', error);
      return false;
    }
  }

  /**
   * Format SOS alert message for SMS
   */
  formatSOSMessage(
    studentName: string,
    caseId: string,
    riskLevel: string,
    location?: { latitude: number; longitude: number }
  ): string {
    let message = `🚨 SAFEVOICE ALERT 🚨\n\n`;
    message += `Student: ${studentName}\n`;
    message += `Case ID: ${caseId}\n`;
    message += `Risk Level: ${riskLevel.toUpperCase()}\n`;
    
    if (location) {
      message += `Location: https://maps.google.com/?q=${location.latitude},${location.longitude}\n`;
    }
    
    message += `\nPlease respond immediately.`;
    
    return message;
  }

  /**
   * Format escalation alert message
   */
  formatEscalationMessage(
    studentName: string,
    caseId: string,
    reason: string,
    location?: { latitude: number; longitude: number }
  ): string {
    let message = `⚠️ CASE ESCALATION ALERT ⚠️\n\n`;
    message += `Student: ${studentName}\n`;
    message += `Case ID: ${caseId}\n`;
    message += `Reason: ${reason}\n`;
    
    if (location) {
      message += `Location: https://maps.google.com/?q=${location.latitude},${location.longitude}\n`;
    }
    
    message += `\nImmediate action may be required.`;
    
    return message;
  }

  /**
   * Format email alert HTML
   */
  formatAlertEmail(
    alertType: 'sos' | 'escalation',
    studentName: string,
    caseId: string,
    description: string,
    riskLevel?: string,
    location?: { latitude: number; longitude: number }
  ): string {
    const isUrgent = alertType === 'sos' || riskLevel === 'critical';
    const bgColor = isUrgent ? '#ff4444' : '#ff9900';
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; }
          .container { max-width: 600px; margin: 0 auto; }
          .header { background-color: ${bgColor}; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; border: 1px solid #ddd; }
          .details { background-color: #f5f5f5; padding: 15px; margin: 15px 0; border-left: 4px solid ${bgColor}; }
          .actions { margin-top: 20px; }
          .button { background-color: ${bgColor}; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; }
          .map-link { color: ${bgColor}; text-decoration: underline; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${isUrgent ? '🚨 URGENT ALERT 🚨' : '⚠️ CASE ESCALATION'}</h1>
          </div>
          <div class="content">
            <h2>Emergency Notification from SafeVoice</h2>
            <p>A student has triggered an emergency alert or their case has been escalated.</p>
            
            <div class="details">
              <p><strong>Student:</strong> ${studentName}</p>
              <p><strong>Case ID:</strong> ${caseId}</p>
              <p><strong>Alert Type:</strong> ${alertType.toUpperCase()}</p>
              ${riskLevel ? `<p><strong>Risk Level:</strong> ${riskLevel.toUpperCase()}</p>` : ''}
              <p><strong>Description:</strong> ${description}</p>
              ${location ? `<p><strong>Location:</strong> <a href="https://maps.google.com/?q=${location.latitude},${location.longitude}" class="map-link">View on Map</a></p>` : ''}
            </div>
            
            <div class="actions">
              <p><strong>Immediate Action Required:</strong></p>
              <ol>
                <li>Log into SafeVoice Dashboard</li>
                <li>Review the case details and contact history</li>
                <li>Reach out to the student or relevant authorities</li>
                <li>Update the case status once action is taken</li>
              </ol>
            </div>
            
            <p style="margin-top: 30px; color: #666; font-size: 12px;">
              This is an automated emergency alert from SafeVoice. Do not reply to this email.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}

export const alertService = new AlertService();
