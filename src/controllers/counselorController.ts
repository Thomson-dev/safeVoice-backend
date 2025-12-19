import { Request, Response } from 'express';
import { reportModel } from '../models/reportDb';
import { messageModel } from '../models/messageDb';

export const counselorController = {
  // Get all reports (counselor can see all)
  getAllReports: async (req: Request, res: Response) => {
    try {
      const reports = await reportModel.getAll();

      // Return reports without revealing real identity (only anonymousId)
      return res.json({
        total: reports.length,
        reports: reports.map(r => ({
          id: r.id,
          anonymousId: r.anonymousId,
          trackingCode: r.trackingCode,
          incidentType: r.incidentType,
          status: r.status,
          createdAt: r.createdAt,
          updatedAt: r.updatedAt
        }))
      });
    } catch (error) {
      console.error('Get all reports error:', error);
      return res.status(500).json({
        error: 'Failed to retrieve reports'
      });
    }
  },

  // Get report details
  getReportDetails: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const report = await reportModel.getById(id);

      if (!report) {
        return res.status(404).json({
          error: 'Report not found'
        });
      }

      // Hide userId, only show anonymousId
      return res.json({
        id: report.id,
        anonymousId: report.anonymousId,
        trackingCode: report.trackingCode,
        incidentType: report.incidentType,
        description: report.description,
        status: report.status,
        createdAt: report.createdAt,
        updatedAt: report.updatedAt,
      });
    } catch (error) {
      console.error('Get report details error:', error);
      return res.status(500).json({
        error: 'Failed to retrieve report'
      });
    }
  },

  // Send message to student
  sendMessage: async (req: Request, res: Response) => {
    try {
      const { reportId, content } = req.body;
      const counselorId = req.user?.userId;

      if (!counselorId) {
        return res.status(401).json({
          error: 'Authentication required'
        });
      }

      if (!reportId || !content) {
        return res.status(400).json({
          error: 'reportId and content are required'
        });
      }

      // Get report to find student
      const report = await reportModel.getById(reportId);
      if (!report) {
        return res.status(404).json({
          error: 'Report not found'
        });
      }

      // Create message from counselor
      const message = await messageModel.create(
        reportId,
        report.userId,
        content,
        true,
        counselorId
      );

      return res.status(201).json({
        success: true,
        message: {
          id: message.id,
          reportId: message.reportId,
          fromCounselor: message.fromCounselor,
          content: message.content,
          createdAt: message.createdAt
        }
      });
    } catch (error) {
      console.error('Send message error:', error);
      return res.status(500).json({
        error: 'Failed to send message'
      });
    }
  },

  // Get messages for a report (counselor view)
  getReportMessages: async (req: Request, res: Response) => {
    try {
      const { reportId } = req.params;

      // Verify report exists
      const report = await reportModel.getById(reportId);
      if (!report) {
        return res.status(404).json({
          error: 'Report not found'
        });
      }

      const messages = await messageModel.getByReportId(reportId);

      return res.json({
        reportId,
        anonymousId: report.anonymousId,
        total: messages.length,
        messages: messages.map(m => ({
          id: m.id,
          fromCounselor: m.fromCounselor,
          content: m.content,
          createdAt: m.createdAt,
          readAt: m.readAt
        }))
      });
    } catch (error) {
      console.error('Get messages error:', error);
      return res.status(500).json({
        error: 'Failed to retrieve messages'
      });
    }
  },

  // Get case history for a report
  getCaseHistory: async (req: Request, res: Response) => {
    try {
      const { reportId } = req.params;

      // Get report
      const report = await reportModel.getById(reportId);
      if (!report) {
        return res.status(404).json({
          error: 'Report not found'
        });
      }

      // Get messages
      const messages = await messageModel.getByReportId(reportId);

      return res.json({
        report: {
          id: report.id,
          anonymousId: report.anonymousId,
          trackingCode: report.trackingCode,
          incidentType: report.incidentType,
          description: report.description,
          status: report.status,
          createdAt: report.createdAt,
          updatedAt: report.updatedAt,
        },
        communications: messages.map(m => ({
          id: m.id,
          fromCounselor: m.fromCounselor,
          content: m.content,
          createdAt: m.createdAt,
          readAt: m.readAt
        })),
        caseTimeline: {
          created: report.createdAt,
          lastUpdated: report.updatedAt,
          totalMessages: messages.length
        }
      });
    } catch (error) {
      console.error('Get case history error:', error);
      return res.status(500).json({
        error: 'Failed to retrieve case history'
      });
    }
  }
};
