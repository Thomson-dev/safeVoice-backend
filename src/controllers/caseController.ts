import { Request, Response } from 'express';
import { caseModel } from '../models/caseDb';
import { reportModel } from '../models/reportDb';
import { messageModel } from '../models/messageDb';

export const caseController = {
  // Get my cases (counselor)
  getMyCases: async (req: Request, res: Response) => {
    try {
      const counselorId = req.user?.userId;

      if (!counselorId) {
        return res.status(401).json({
          error: 'Authentication required'
        });
      }

      const cases = await caseModel.getByCounselorId(counselorId);

      return res.json({
        total: cases.length,
        cases: cases.map(c => ({
          id: c.id,
          caseId: c.caseId,
          reportId: c.reportId,
          status: c.status,
          riskLevel: c.riskLevel,
          notes: c.notes,
          assignedAt: c.assignedAt,
          createdAt: c.createdAt,
          updatedAt: c.updatedAt
        }))
      });
    } catch (error) {
      console.error('Get my cases error:', error);
      return res.status(500).json({
        error: 'Failed to retrieve cases'
      });
    }
  },

  // Get available unassigned cases (counselor can pick from)
  getAvailableCases: async (req: Request, res: Response) => {
    try {
      const cases = await caseModel.getUnassigned();
      
      return res.json({
        total: cases.length,
        cases: cases.map(c => ({
          id: c.id,
          caseId: c.caseId,
          reportId: c.reportId,
          status: c.status,
          riskLevel: c.riskLevel,
          createdAt: c.createdAt
        }))
      });
    } catch (error) {
      console.error('Get available cases error:', error);
      return res.status(500).json({
        error: 'Failed to retrieve available cases'
      });
    }
  },

  // Claim an unassigned case (counselor self-assignment)
  claimCase: async (req: Request, res: Response) => {
    try {
      const { caseId: caseDocId } = req.params;
      const counselorId = req.user?.userId;

      if (!counselorId) {
        return res.status(401).json({
          error: 'Authentication required'
        });
      }

      const caseDoc = await caseModel.getById(caseDocId);

      if (!caseDoc) {
        return res.status(404).json({
          error: 'Case not found'
        });
      }

      if (caseDoc.counselorId) {
        return res.status(400).json({
          error: 'Case already assigned to another counselor'
        });
      }

      const updatedCase = await caseModel.assignCounselor(caseDocId, counselorId);

      if (!updatedCase) {
        return res.status(500).json({
          error: 'Failed to claim case'
        });
      }

      return res.json({
        success: true,
        message: 'You have successfully claimed this case',
        case: {
          id: updatedCase.id,
          caseId: updatedCase.caseId,
          status: updatedCase.status,
          riskLevel: updatedCase.riskLevel,
          assignedAt: updatedCase.assignedAt
        }
      });
    } catch (error) {
      console.error('Claim case error:', error);
      return res.status(500).json({
        error: 'Failed to claim case'
      });
    }
  },

  // Get case details (counselor - can only see assigned cases)
  getCaseDetails: async (req: Request, res: Response) => {
    try {
      const { caseId } = req.params;
      const counselorId = req.user?.userId;

      const caseDoc = await caseModel.getByCaseId(caseId);

      if (!caseDoc) {
        return res.status(404).json({
          error: 'Case not found'
        });
      }

      // Verify counselor owns this case
      if (caseDoc.counselorId !== counselorId) {
        return res.status(403).json({
          error: 'Not authorized to view this case'
        });
      }

      // Get report details (without userId, only anonymousId)
      const report = await reportModel.getById(caseDoc.reportId);

      if (!report) {
        return res.status(404).json({
          error: 'Report not found'
        });
      }

      // Get messages for this case
      const messages = await messageModel.getByCaseId(caseDoc.reportId);

      return res.json({
        case: {
          id: caseDoc.id,
          caseId: caseDoc.caseId,
          status: caseDoc.status,
          riskLevel: caseDoc.riskLevel,
          notes: caseDoc.notes,
          assignedAt: caseDoc.assignedAt,
          createdAt: caseDoc.createdAt,
          updatedAt: caseDoc.updatedAt
        },
        report: {
          id: report.id,
          trackingCode: report.trackingCode,
          anonymousId: report.anonymousId,
          incidentType: report.incidentType,
          description: report.description,
          status: report.status,
          createdAt: report.createdAt,
          evidenceUrl: report.evidenceUrl || null
        },
        messageCount: messages.length,
        lastMessage: messages.length > 0 ? messages[messages.length - 1] : null
      });
    } catch (error) {
      console.error('Get case details error:', error);
      return res.status(500).json({
        error: 'Failed to retrieve case details'
      });
    }
  },

  // Update case status (counselor only, own cases)
  updateCaseStatus: async (req: Request, res: Response) => {
    try {
      const { caseId: caseDocId } = req.params;
      const { status } = req.body;
      const counselorId = req.user?.userId;

      if (!['new', 'active', 'escalated', 'closed'].includes(status)) {
        return res.status(400).json({
          error: 'Invalid status'
        });
      }

      const caseDoc = await caseModel.getById(caseDocId);

      if (!caseDoc) {
        return res.status(404).json({
          error: 'Case not found'
        });
      }

      // Verify ownership (counselor can only update own cases)
      if (caseDoc.counselorId !== counselorId) {
        return res.status(403).json({
          error: 'Not authorized to update this case'
        });
      }

      const updatedCase = await caseModel.updateStatus(caseDocId, status);

      if (!updatedCase) {
        return res.status(500).json({
          error: 'Failed to update case status'
        });
      }

      return res.json({
        success: true,
        message: 'Case status updated successfully',
        case: {
          id: updatedCase.id,
          caseId: updatedCase.caseId,
          status: updatedCase.status,
          closedAt: updatedCase.closedAt
        }
      });
    } catch (error) {
      console.error('Update case status error:', error);
      return res.status(500).json({
        error: 'Failed to update case status'
      });
    }
  },

  // Update risk level (counselor only, own cases)
  updateRiskLevel: async (req: Request, res: Response) => {
    try {
      const { caseId: caseDocId } = req.params;
      const { riskLevel, notes } = req.body;
      const counselorId = req.user?.userId;

      if (!['low', 'medium', 'high', 'critical'].includes(riskLevel)) {
        return res.status(400).json({
          error: 'Invalid risk level'
        });
      }

      const caseDoc = await caseModel.getById(caseDocId);

      if (!caseDoc) {
        return res.status(404).json({
          error: 'Case not found'
        });
      }

      // Verify ownership (counselor can only update own cases)
      if (caseDoc.counselorId !== counselorId) {
        return res.status(403).json({
          error: 'Not authorized to update this case'
        });
      }

      const updatedCase = await caseModel.updateRiskLevel(caseDocId, riskLevel, notes);

      if (!updatedCase) {
        return res.status(500).json({
          error: 'Failed to update risk level'
        });
      }

      return res.json({
        success: true,
        message: 'Risk level updated successfully',
        case: {
          id: updatedCase.id,
          caseId: updatedCase.caseId,
          riskLevel: updatedCase.riskLevel,
          notes: updatedCase.notes
        }
      });
    } catch (error) {
      console.error('Update risk level error:', error);
      return res.status(500).json({
        error: 'Failed to update risk level'
      });
    }
  }
};
