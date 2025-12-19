import { Request, Response } from 'express';
import { emergencyAlertModel } from '../models/emergencyAlertDb';
import { caseModel } from '../models/caseDb';
import { reportModel } from '../models/reportDb';
import { studentModel } from '../models/studentDb';
import { alertService } from '../services/alertService';

export const emergencyAlertController = {
  /**
   * Student triggers SOS button - immediate emergency alert
   */
  triggerSOS: async (req: Request, res: Response) => {
    try {
      const studentId = req.user?.userId;
      const { reportId, location } = req.body;

      if (!studentId || !reportId) {
        return res.status(400).json({
          error: 'studentId and reportId are required'
        });
      }

      // Verify student owns this report
      const report = await reportModel.getById(reportId);
      if (!report || report.userId !== studentId) {
        return res.status(403).json({
          error: 'Unauthorized - you do not own this report'
        });
      }

      // Get the case
      const caseDoc = await caseModel.getByReportId(reportId);
      if (!caseDoc) {
        return res.status(404).json({
          error: 'Case not found for this report'
        });
      }

      // Create emergency alert
      const alert = await emergencyAlertModel.create(
        caseDoc.id,
        reportId,
        studentId,
        caseDoc.counselorId,
        'sos_button',
        'critical',
        'Student triggered SOS button - requires immediate assistance',
        location
      );

      // Update case status to escalated
      await caseModel.updateStatus(caseDoc.id, 'escalated');

      // Get student details
      const student = await studentModel.getById(studentId);
      const studentName = student?.anonymousId || 'Student';

      // Get counselor email if assigned
      let counselorEmail = '';
      if (caseDoc.counselorId) {
        // In production, fetch counselor email from counselor model
        // For now, use placeholder
        counselorEmail = 'counselor@safevoice.local';
      }

      // Send alerts to counselor
      if (caseDoc.counselorId) {
        // Push notification
        await alertService.sendPushNotification(
          caseDoc.counselorId,
          '🚨 STUDENT SOS ALERT',
          `${studentName} has triggered an SOS button in case ${caseDoc.caseId}`,
          {
            caseId: caseDoc.id,
            alertId: alert.id,
            alertType: 'sos_button'
          }
        );

        // Mark notification sent
        await emergencyAlertModel.updateAlertsSent(alert.id, 'push_notification', caseDoc.counselorId);
      }

      // Send email alert to counselor
      if (counselorEmail) {
        const emailHtml = alertService.formatAlertEmail(
          'sos',
          studentName,
          caseDoc.caseId,
          'Student triggered SOS button - requires immediate assistance',
          'critical',
          location
        );

        const emailSent = await alertService.sendEmailAlert(
          [counselorEmail],
          '🚨 SafeVoice SOS Alert - Immediate Action Required',
          emailHtml
        );

        if (emailSent) {
          await emergencyAlertModel.updateAlertsSent(alert.id, 'email', [counselorEmail]);
        }
      }

      return res.status(201).json({
        success: true,
        message: 'SOS alert triggered successfully',
        alert: {
          id: alert.id,
          caseId: caseDoc.caseId,
          status: 'triggered',
          alertsSent: {
            push_notification: caseDoc.counselorId ? true : false,
            sms: false,
            email: counselorEmail ? true : false
          },
          createdAt: alert.createdAt
        }
      });
    } catch (error) {
      console.error('SOS trigger error:', error);
      return res.status(500).json({
        error: 'Failed to trigger SOS alert'
      });
    }
  },

  /**
   * Counselor manually escalates a case
   */
  escalateCase: async (req: Request, res: Response) => {
    try {
      const counselorId = req.user?.userId;
      const { caseId, reason, guardianPhones, guardianEmails } = req.body;

      if (!counselorId || !caseId || !reason) {
        return res.status(400).json({
          error: 'caseId and reason are required'
        });
      }

      // Get case
      const caseDoc = await caseModel.getById(caseId);
      if (!caseDoc) {
        return res.status(404).json({
          error: 'Case not found'
        });
      }

      // Verify counselor is assigned
      if (caseDoc.counselorId !== counselorId) {
        return res.status(403).json({
          error: 'You are not assigned to this case'
        });
      }

      // Get report
      const report = await reportModel.getById(caseDoc.reportId);
      if (!report) {
        return res.status(404).json({
          error: 'Report not found'
        });
      }

      // Create emergency alert
      const alert = await emergencyAlertModel.create(
        caseDoc.id,
        caseDoc.reportId,
        caseDoc.studentId,
        counselorId,
        'manual_escalation',
        'high',
        reason
      );

      // Add guardian contacts if provided
      if (guardianPhones || guardianEmails) {
        await emergencyAlertModel.addGuardianContacts(alert.id, guardianPhones, guardianEmails);
      }

      // Update case status
      await caseModel.updateStatus(caseDoc.id, 'escalated');

      // Get student name
      const student = await studentModel.getById(caseDoc.studentId);
      const studentName = student?.anonymousId || 'Student';

      // Send alerts to guardians
      const sentAlerts: any = {
        push_notification: false,
        sms: false,
        email: false
      };

      // Send SMS to guardians
      if (guardianPhones && guardianPhones.length > 0) {
        const message = alertService.formatEscalationMessage(
          studentName,
          caseDoc.caseId,
          reason
        );

        const smsResult = await alertService.sendSMSAlert(guardianPhones, message);
        if (smsResult.success) {
          await emergencyAlertModel.updateAlertsSent(alert.id, 'sms', guardianPhones);
          sentAlerts.sms = true;
        }
      }

      // Send email to guardians
      if (guardianEmails && guardianEmails.length > 0) {
        const emailHtml = alertService.formatAlertEmail(
          'escalation',
          studentName,
          caseDoc.caseId,
          reason
        );

        const emailSent = await alertService.sendEmailAlert(
          guardianEmails,
          '⚠️ SafeVoice Case Escalation Alert',
          emailHtml
        );

        if (emailSent) {
          await emergencyAlertModel.updateAlertsSent(alert.id, 'email', guardianEmails);
          sentAlerts.email = true;
        }
      }

      return res.status(201).json({
        success: true,
        message: 'Case escalated successfully',
        alert: {
          id: alert.id,
          caseId: caseDoc.caseId,
          status: 'triggered',
          triggerType: 'manual_escalation',
          alertsSent: sentAlerts,
          createdAt: alert.createdAt
        }
      });
    } catch (error) {
      console.error('Case escalation error:', error);
      return res.status(500).json({
        error: 'Failed to escalate case'
      });
    }
  },

  /**
   * Get emergency alert details
   */
  getAlertDetails: async (req: Request, res: Response) => {
    try {
      const { alertId } = req.params;
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          error: 'Authentication required'
        });
      }

      const alert = await emergencyAlertModel.getById(alertId);
      if (!alert) {
        return res.status(404).json({
          error: 'Alert not found'
        });
      }

      // Verify access (student or assigned counselor)
      const caseDoc = await caseModel.getById(alert.caseId);
      if (!caseDoc || (caseDoc.studentId !== userId && caseDoc.counselorId !== userId)) {
        return res.status(403).json({
          error: 'Not authorized to view this alert'
        });
      }

      return res.json({
        alert: {
          id: alert.id,
          caseId: alert.caseId,
          triggerType: alert.triggerType,
          riskLevel: alert.riskLevel,
          description: alert.description,
          status: alert.status,
          location: alert.studentLocation,
          alertsSent: alert.alertsSent,
          counselorNotified: alert.counselorNotified,
          createdAt: alert.createdAt
        }
      });
    } catch (error) {
      console.error('Get alert details error:', error);
      return res.status(500).json({
        error: 'Failed to retrieve alert'
      });
    }
  },

  /**
   * Get all active emergency alerts (for admin dashboard)
   */
  getActiveAlerts: async (req: Request, res: Response) => {
    try {
      const alerts = await emergencyAlertModel.getActiveAlerts();

      return res.json({
        total: alerts.length,
        alerts: alerts.map(a => ({
          id: a.id,
          caseId: a.caseId,
          studentId: a.studentId,
          triggerType: a.triggerType,
          riskLevel: a.riskLevel,
          status: a.status,
          createdAt: a.createdAt
        }))
      });
    } catch (error) {
      console.error('Get active alerts error:', error);
      return res.status(500).json({
        error: 'Failed to retrieve alerts'
      });
    }
  },

  /**
   * Resolve an emergency alert
   */
  resolveAlert: async (req: Request, res: Response) => {
    try {
      const { alertId } = req.params;
      const { resolutionNotes } = req.body;
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          error: 'Authentication required'
        });
      }

      const alert = await emergencyAlertModel.getById(alertId);
      if (!alert) {
        return res.status(404).json({
          error: 'Alert not found'
        });
      }

      // Verify authorization (counselor who was notified)
      if (alert.counselorId !== userId) {
        return res.status(403).json({
          error: 'Only the assigned counselor can resolve this alert'
        });
      }

      const updated = await emergencyAlertModel.updateStatus(
        alertId,
        'resolved',
        resolutionNotes
      );

      return res.json({
        success: true,
        message: 'Alert resolved successfully',
        alert: {
          id: updated?.id,
          status: updated?.status,
          resolvedAt: updated?.resolvedAt
        }
      });
    } catch (error) {
      console.error('Resolve alert error:', error);
      return res.status(500).json({
        error: 'Failed to resolve alert'
      });
    }
  }
};
