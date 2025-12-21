import { Request, Response } from 'express';
import { reportModel } from '../models/reportDb';
import { studentModel } from '../models/studentDb';
import { caseModel } from '../models/caseDb';
import { counselorModel } from '../models/counselorDb';

export const reportController = {
  // Submit anonymous report (authenticated student)
  createReport: async (req: Request, res: Response) => {
    try {
      const { incidentType, description, evidenceUrl, schoolName } = req.body;
      const userId = req.user?.userId;

      // Validation
      if (!userId) {
        return res.status(401).json({
          error: 'Authentication required'
        });
      }

      if (!incidentType || !description) {
        return res.status(400).json({
          error: 'incidentType and description are required'
        });
      }

      // Get student to get anonymousId
      const student = await studentModel.getById(userId);
      if (!student) {
        return res.status(404).json({
          error: 'Student not found'
        });
      }

      const report = await reportModel.create({
        userId,
        anonymousId: student.anonymousId,
        incidentType,
        description,
        evidenceUrl,
        schoolName
      });

      // Create case for this report
      const caseDoc = await caseModel.create(report.id, userId);

      // Link case to report
      await reportModel.linkCase(report.id, caseDoc.id);

      return res.status(201).json({
        success: true,
        message: 'Report submitted successfully',
        trackingCode: report.trackingCode,
        reportId: report.id,
        caseId: caseDoc.caseId,
        report: {
          id: report.id,
          trackingCode: report.trackingCode,
          anonymousId: report.anonymousId,
          status: report.status,
          createdAt: report.createdAt
        }
      });
    } catch (error) {
      console.error('Create report error:', error);
      return res.status(500).json({
        error: 'Failed to create report'
      });
    }
  },

  // Get report status by tracking code (anonymous - no auth needed)
  getReportStatus: async (req: Request, res: Response) => {
    try {
      const { trackingCode } = req.params;

      const report = await reportModel.getByTrackingCode(trackingCode);
      
      if (!report) {
        return res.status(404).json({
          error: 'Report not found'
        });
      }

      // Return public information including report details
      return res.json({
        success: true,
        report: {
          id: report.id,
          trackingCode: report.trackingCode,
          anonymousId: report.anonymousId,
          incidentType: report.incidentType,
          description: report.description,
          status: report.status,
          schoolName: report.schoolName,
          createdAt: report.createdAt,
          updatedAt: report.updatedAt
        }
      });
    } catch (error) {
      console.error('Get report status error:', error);
      return res.status(500).json({
        error: 'Failed to retrieve report'
      });
    }
  },

  // Get all reports for logged-in student
  getMyReports: async (req: Request, res: Response) => {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          error: 'Authentication required'
        });
      }

      const reports = await reportModel.getByUserId(userId);

      return res.json({
        total: reports.length,
        reports: reports.map(r => ({
          id: r.id,
          trackingCode: r.trackingCode,
          incidentType: r.incidentType,
          status: r.status,
          createdAt: r.createdAt,
          updatedAt: r.updatedAt
        }))
      });
    } catch (error) {
      console.error('Get my reports error:', error);
      return res.status(500).json({
        error: 'Failed to retrieve reports'
      });
    }
  },

  // Get single report details (student can only see their own)
  getReportDetails: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          error: 'Authentication required'
        });
      }

      const report = await reportModel.getById(id);

      if (!report) {
        return res.status(404).json({
          error: 'Report not found'
        });
      }

      // Only student who created report can view full details
      if (report.userId !== userId) {
        return res.status(403).json({
          error: 'Unauthorized'
        });
      }

      return res.json(report);
    } catch (error) {
      console.error('Get report details error:', error);
      return res.status(500).json({
        error: 'Failed to retrieve report'
      });
    }
  }
};
