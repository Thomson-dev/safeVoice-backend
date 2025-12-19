import mongoose from 'mongoose';
import { EmergencyAlertSchema } from './schemas/EmergencyAlertSchema';

const EmergencyAlert = mongoose.model('EmergencyAlert', EmergencyAlertSchema);

export const emergencyAlertModel = {
  create: async (
    caseId: string,
    reportId: string,
    studentId: string,
    counselorId: string | undefined,
    triggerType: 'sos_button' | 'risk_escalation' | 'manual_escalation',
    riskLevel: 'high' | 'critical',
    description: string,
    location?: { latitude: number; longitude: number; accuracy?: number }
  ) => {
    try {
      const alert = new EmergencyAlert({
        caseId,
        reportId,
        studentId,
        counselorId,
        triggerType,
        riskLevel,
        description,
        studentLocation: location ? {
          latitude: location.latitude,
          longitude: location.longitude,
          accuracy: location.accuracy,
          timestamp: new Date()
        } : undefined
      });
      await alert.save();
      return {
        id: alert._id.toString(),
        caseId: alert.caseId.toString(),
        reportId: alert.reportId.toString(),
        studentId: alert.studentId.toString(),
        triggerType: alert.triggerType,
        riskLevel: alert.riskLevel,
        status: alert.status,
        createdAt: alert.createdAt
      };
    } catch (error) {
      console.error('Emergency alert create error:', error);
      throw error;
    }
  },

  getById: async (id: string) => {
    try {
      const alert = await EmergencyAlert.findById(id);
      if (!alert) return null;
      return {
        id: alert._id.toString(),
        caseId: alert.caseId.toString(),
        reportId: alert.reportId.toString(),
        studentId: alert.studentId.toString(),
        counselorId: alert.counselorId?.toString(),
        triggerType: alert.triggerType,
        riskLevel: alert.riskLevel,
        description: alert.description,
        studentLocation: alert.studentLocation,
        status: alert.status,
        alertsSent: alert.alertsSent,
        counselorNotified: alert.counselorNotified,
        createdAt: alert.createdAt
      };
    } catch (error) {
      console.error('Emergency alert getById error:', error);
      throw error;
    }
  },

  getByCaseId: async (caseId: string) => {
    try {
      const alerts = await EmergencyAlert.find({ caseId }).sort({ createdAt: -1 });
      return alerts.map((alert: any) => ({
        id: alert._id.toString(),
        caseId: alert.caseId.toString(),
        reportId: alert.reportId.toString(),
        studentId: alert.studentId.toString(),
        triggerType: alert.triggerType,
        riskLevel: alert.riskLevel,
        status: alert.status,
        createdAt: alert.createdAt
      }));
    } catch (error) {
      console.error('Emergency alert getByCaseId error:', error);
      throw error;
    }
  },

  getByStudentId: async (studentId: string) => {
    try {
      const alerts = await EmergencyAlert.find({ studentId }).sort({ createdAt: -1 });
      return alerts.map((alert: any) => ({
        id: alert._id.toString(),
        caseId: alert.caseId.toString(),
        reportId: alert.reportId.toString(),
        studentId: alert.studentId.toString(),
        triggerType: alert.triggerType,
        riskLevel: alert.riskLevel,
        status: alert.status,
        createdAt: alert.createdAt
      }));
    } catch (error) {
      console.error('Emergency alert getByStudentId error:', error);
      throw error;
    }
  },

  getActiveAlerts: async () => {
    try {
      const alerts = await EmergencyAlert.find({
        status: { $in: ['triggered', 'in_progress'] }
      }).sort({ createdAt: -1 });
      return alerts.map((alert: any) => ({
        id: alert._id.toString(),
        caseId: alert.caseId.toString(),
        reportId: alert.reportId.toString(),
        studentId: alert.studentId.toString(),
        triggerType: alert.triggerType,
        riskLevel: alert.riskLevel,
        status: alert.status,
        createdAt: alert.createdAt
      }));
    } catch (error) {
      console.error('Emergency alert getActiveAlerts error:', error);
      throw error;
    }
  },

  updateStatus: async (id: string, status: 'triggered' | 'in_progress' | 'resolved' | 'cancelled', notes?: string) => {
    try {
      const alert = await EmergencyAlert.findByIdAndUpdate(
        id,
        {
          status,
          resolutionNotes: notes,
          resolvedAt: status === 'resolved' ? new Date() : undefined
        },
        { new: true }
      );
      if (!alert) return null;
      return {
        id: alert._id.toString(),
        status: alert.status,
        resolutionNotes: alert.resolutionNotes,
        resolvedAt: alert.resolvedAt
      };
    } catch (error) {
      console.error('Emergency alert updateStatus error:', error);
      throw error;
    }
  },

  markCounselorNotified: async (id: string) => {
    try {
      const alert = await EmergencyAlert.findByIdAndUpdate(
        id,
        {
          counselorNotified: true,
          counselorNotifiedAt: new Date()
        },
        { new: true }
      );
      if (!alert) return null;
      return {
        id: alert._id.toString(),
        counselorNotified: alert.counselorNotified,
        counselorNotifiedAt: alert.counselorNotifiedAt
      };
    } catch (error) {
      console.error('Emergency alert markCounselorNotified error:', error);
      throw error;
    }
  },

  updateAlertsSent: async (
    id: string,
    channel: 'push_notification' | 'sms' | 'email',
    recipients?: string | string[]
  ) => {
    try {
      const updateData: any = {
        [`alertsSent.${channel}.sent`]: true,
        [`alertsSent.${channel}.sentAt`]: new Date()
      };

      if (channel === 'sms' && Array.isArray(recipients)) {
        updateData['alertsSent.sms.recipients'] = recipients;
      } else if (channel === 'email' && Array.isArray(recipients)) {
        updateData['alertsSent.email.recipients'] = recipients;
      } else if (channel === 'push_notification' && typeof recipients === 'string') {
        updateData['alertsSent.push_notification.recipient'] = recipients;
      }

      const alert = await EmergencyAlert.findByIdAndUpdate(id, updateData, { new: true });
      if (!alert) return null;
      return {
        id: alert._id.toString(),
        alertsSent: alert.alertsSent
      };
    } catch (error) {
      console.error('Emergency alert updateAlertsSent error:', error);
      throw error;
    }
  },

  addGuardianContacts: async (id: string, phoneNumbers?: string[], emailAddresses?: string[]) => {
    try {
      const updateData: any = {};
      if (phoneNumbers && phoneNumbers.length > 0) {
        updateData['guardianPhoneNumbers'] = phoneNumbers;
      }
      if (emailAddresses && emailAddresses.length > 0) {
        updateData['guardianEmailAddresses'] = emailAddresses;
      }

      const alert = await EmergencyAlert.findByIdAndUpdate(id, updateData, { new: true });
      if (!alert) return null;
      return {
        id: alert._id.toString(),
        guardianPhoneNumbers: alert.guardianPhoneNumbers,
        guardianEmailAddresses: alert.guardianEmailAddresses
      };
    } catch (error) {
      console.error('Emergency alert addGuardianContacts error:', error);
      throw error;
    }
  }
};
