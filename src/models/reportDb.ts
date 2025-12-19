import mongoose from 'mongoose';
import { ReportSchema } from './schemas/ReportSchema';
import { v4 as uuidv4 } from 'uuid';

const Report = mongoose.model('Report', ReportSchema);

export const reportModel = {
  create: async (data: any) => {
    try {
      const trackingCode = `TRACK-${uuidv4().slice(0, 8).toUpperCase()}`;
      const report = new Report({
        ...data,
        trackingCode
      });
      await report.save();
      return {
        id: report._id.toString(),
        userId: report.userId.toString(),
        anonymousId: report.anonymousId,
        trackingCode: report.trackingCode,
        incidentType: report.incidentType,
        description: report.description,
        evidenceUrl: report.evidenceUrl,
        schoolName: report.schoolName,
        status: report.status,
        caseId: report.caseId?.toString(),
        createdAt: report.createdAt,
        updatedAt: report.updatedAt
      };
    } catch (error) {
      console.error('Report create error:', error);
      throw error;
    }
  },

  getById: async (id: string) => {
    try {
      const report = await Report.findById(id);
      if (!report) return null;
      return {
        id: report._id.toString(),
        userId: report.userId.toString(),
        anonymousId: report.anonymousId,
        trackingCode: report.trackingCode,
        incidentType: report.incidentType,
        description: report.description,
        evidenceUrl: report.evidenceUrl,
        schoolName: report.schoolName,
        status: report.status,
        caseId: report.caseId?.toString(),
        createdAt: report.createdAt,
        updatedAt: report.updatedAt
      };
    } catch (error) {
      console.error('Report getById error:', error);
      throw error;
    }
  },

  getByTrackingCode: async (trackingCode: string) => {
    try {
      const report = await Report.findOne({ trackingCode });
      if (!report) return null;
      return {
        id: report._id.toString(),
        userId: report.userId.toString(),
        anonymousId: report.anonymousId,
        trackingCode: report.trackingCode,
        incidentType: report.incidentType,
        description: report.description,
        evidenceUrl: report.evidenceUrl,
        schoolName: report.schoolName,
        status: report.status,
        caseId: report.caseId?.toString(),
        createdAt: report.createdAt,
        updatedAt: report.updatedAt
      };
    } catch (error) {
      console.error('Report getByTrackingCode error:', error);
      throw error;
    }
  },

  getByUserId: async (userId: string) => {
    try {
      const reports = await Report.find({ userId }).sort({ createdAt: -1 });
      return reports.map((report: any) => ({
        id: report._id.toString(),
        userId: report.userId.toString(),
        anonymousId: report.anonymousId,
        trackingCode: report.trackingCode,
        incidentType: report.incidentType,
        description: report.description,
        evidenceUrl: report.evidenceUrl,
        schoolName: report.schoolName,
        status: report.status,
        caseId: report.caseId?.toString(),
        createdAt: report.createdAt,
        updatedAt: report.updatedAt
      }));
    } catch (error) {
      console.error('Report getByUserId error:', error);
      throw error;
    }
  },

  getAll: async () => {
    try {
      const reports = await Report.find().sort({ createdAt: -1 });
      return reports.map((report: any) => ({
        id: report._id.toString(),
        userId: report.userId.toString(),
        anonymousId: report.anonymousId,
        trackingCode: report.trackingCode,
        incidentType: report.incidentType,
        description: report.description,
        evidenceUrl: report.evidenceUrl,
        schoolName: report.schoolName,
        status: report.status,
        caseId: report.caseId?.toString(),
        createdAt: report.createdAt,
        updatedAt: report.updatedAt
      }));
    } catch (error) {
      console.error('Report getAll error:', error);
      throw error;
    }
  },

  updateStatus: async (id: string, status: string, adminNotes?: string) => {
    try {
      const report = await Report.findByIdAndUpdate(
        id,
        { status, adminNotes: adminNotes || '' },
        { new: true }
      );
      if (!report) return null;
      return {
        id: report._id.toString(),
        userId: report.userId.toString(),
        anonymousId: report.anonymousId,
        trackingCode: report.trackingCode,
        incidentType: report.incidentType,
        description: report.description,
        evidenceUrl: report.evidenceUrl,
        schoolName: report.schoolName,
        status: report.status,
        caseId: report.caseId?.toString(),
        createdAt: report.createdAt,
        updatedAt: report.updatedAt
      };
    } catch (error) {
      console.error('Report updateStatus error:', error);
      throw error;
    }
  },

  linkCase: async (reportId: string, caseId: string) => {
    try {
      const report = await Report.findByIdAndUpdate(
        reportId,
        { caseId },
        { new: true }
      );
      if (!report) return null;
      return {
        id: report._id.toString(),
        userId: report.userId.toString(),
        anonymousId: report.anonymousId,
        trackingCode: report.trackingCode,
        incidentType: report.incidentType,
        description: report.description,
        evidenceUrl: report.evidenceUrl,
        schoolName: report.schoolName,
        status: report.status,
        caseId: report.caseId?.toString(),
        createdAt: report.createdAt,
        updatedAt: report.updatedAt
      };
    } catch (error) {
      console.error('Report linkCase error:', error);
      throw error;
    }
  }
};
