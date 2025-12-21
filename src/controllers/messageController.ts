import { Request, Response } from 'express';
import { messageModel } from '../models/messageDb';
import { reportModel } from '../models/reportDb';
import { caseModel } from '../models/caseDb';
import deviceTokenDb from '../models/deviceTokenDb';
import firebaseService from '../services/firebaseService';

// In-memory notification store (in production, use Redis or database)
const notifications: Map<string, Array<{ id: string; message: string; timestamp: Date }>> = new Map();

export const messageController = {
  // Send message from student to counselor
  sendStudentMessage: async (req: Request, res: Response) => {
    try {
      const { reportId, content } = req.body;
      const userId = req.user?.userId;
      const role = req.user?.role;

      if (!userId) {
        return res.status(401).json({
          error: 'Authentication required'
        });
      }

      if (!reportId || !content) {
        return res.status(400).json({
          error: 'reportId and content are required'
        });
      }

      // Verify student owns this report
      const report = await reportModel.getById(reportId);
      if (!report || report.userId !== userId) {
        return res.status(403).json({
          error: 'Unauthorized - you do not own this report'
        });
      }

      // Get the case for this report
      const caseDoc = await caseModel.getByReportId(reportId);
      if (!caseDoc) {
        return res.status(404).json({
          error: 'No case found for this report'
        });
      }

      // Create message
      const message = await messageModel.create(reportId, userId, content, false);

      // Send notification to assigned counselor if exists
      if (caseDoc.counselorId) {
        // In-memory notification
        const notificationId = `notif-${Date.now()}-${Math.random()}`;
        const notification = {
          id: notificationId,
          message: `New message in case ${caseDoc.caseId}`,
          timestamp: new Date()
        };

        if (!notifications.has(caseDoc.counselorId)) {
          notifications.set(caseDoc.counselorId, []);
        }
        notifications.get(caseDoc.counselorId)!.push(notification);

        // Send Firebase push notification
        const counselorTokens = await deviceTokenDb.getActiveTokensByUser(caseDoc.counselorId);
        if (counselorTokens.length > 0) {
          firebaseService.notifyNewMessage(
            counselorTokens[0],
            'Student',
            content,
            caseDoc.caseId
          ).catch((err: any) => console.error('Failed to send push notification:', err));
        }

        console.log(`📨 Notification sent to counselor ${caseDoc.counselorId}: New message in case ${caseDoc.caseId}`);
      }

      return res.status(201).json({
        success: true,
        message: {
          id: message.id,
          reportId: message.reportId,
          content: message.content,
          fromCounselor: message.fromCounselor,
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

  // Send message from counselor to student
  sendCounselorMessage: async (req: Request, res: Response) => {
    try {
      const { caseId, content } = req.body;
      const counselorId = req.user?.userId;

      if (!counselorId) {
        return res.status(401).json({
          error: 'Authentication required'
        });
      }

      if (!caseId || !content) {
        return res.status(400).json({
          error: 'caseId and content are required'
        });
      }

      // Get case
      const caseDoc = await caseModel.getById(caseId);
      if (!caseDoc) {
        return res.status(404).json({
          error: 'Case not found'
        });
      }

      // Verify counselor is assigned to this case
      if (caseDoc.counselorId !== counselorId) {
        return res.status(403).json({
          error: 'You are not assigned to this case'
        });
      }

      // Get the report linked to this case
      const report = await reportModel.getById(caseDoc.reportId);
      if (!report) {
        return res.status(404).json({
          error: 'Report not found'
        });
      }

      // Create message
      const message = await messageModel.create(caseDoc.reportId, report.userId, content, true, counselorId);

      // Send notification to student
      const notificationId = `notif-${Date.now()}-${Math.random()}`;
      const notification = {
        id: notificationId,
        message: `Reply from counselor in case ${caseDoc.caseId}`,
        timestamp: new Date()
      };

      if (!notifications.has(report.userId)) {
        notifications.set(report.userId, []);
      }
      notifications.get(report.userId)!.push(notification);

      // Send Firebase push notification to student
      const studentTokens = await deviceTokenDb.getActiveTokensByUser(report.userId);
      if (studentTokens.length > 0) {
        firebaseService.notifyNewMessage(
          studentTokens[0],
          'Counselor',
          content,
          caseDoc.caseId
        ).catch((err: any) => console.error('Failed to send push notification:', err));
      }

      console.log(`📨 Notification sent to student ${report.userId}: Reply from counselor in case ${caseDoc.caseId}`);

      return res.status(201).json({
        success: true,
        message: {
          id: message.id,
          caseId: caseDoc.caseId,
          content: message.content,
          fromCounselor: message.fromCounselor,
          createdAt: message.createdAt
        }
      });
    } catch (error) {
      console.error('Send counselor message error:', error);
      return res.status(500).json({
        error: 'Failed to send message'
      });
    }
  },

  // Get all messages for a case (counselor view)
  getCaseMessages: async (req: Request, res: Response) => {
    try {
      const { caseId } = req.params;
      const counselorId = req.user?.userId;

      if (!counselorId) {
        return res.status(401).json({
          error: 'Authentication required'
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

      // Get messages
      const messages = await messageModel.getByCaseId(caseDoc.reportId);

      // Mark unread messages from student as read (counselor viewing)
      const unreadIds = messages
        .filter(m => !m.fromCounselor && !m.readAt)
        .map(m => m.id);

      if (unreadIds.length > 0) {
        await messageModel.markMultipleAsRead(unreadIds);
      }

      return res.json({
        caseId: caseDoc.caseId,
        reportId: caseDoc.reportId,
        totalMessages: messages.length,
        messages: messages.map(m => ({
          id: m.id,
          content: m.content,
          fromCounselor: m.fromCounselor,
          readAt: m.readAt,
          createdAt: m.createdAt
        }))
      });
    } catch (error) {
      console.error('Get case messages error:', error);
      return res.status(500).json({
        error: 'Failed to retrieve messages'
      });
    }
  },

  // Get all messages for a report (student view)
  getReportMessages: async (req: Request, res: Response) => {
    try {
      const { reportId } = req.params;
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          error: 'Authentication required'
        });
      }

      // Verify student owns this report
      const report = await reportModel.getById(reportId);
      if (!report || report.userId !== userId) {
        return res.status(403).json({
          error: 'Unauthorized'
        });
      }

      // Get messages
      const messages = await messageModel.getByReportId(reportId);

      // Mark unread messages from counselor as read (student viewing)
      const unreadIds = messages
        .filter(m => m.fromCounselor && !m.readAt)
        .map(m => m.id);

      if (unreadIds.length > 0) {
        await messageModel.markMultipleAsRead(unreadIds);
      }

      return res.json({
        reportId,
        totalMessages: messages.length,
        messages: messages.map(m => ({
          id: m.id,
          content: m.content,
          fromCounselor: m.fromCounselor,
          readAt: m.readAt,
          createdAt: m.createdAt
        }))
      });
    } catch (error) {
      console.error('Get report messages error:', error);
      return res.status(500).json({
        error: 'Failed to retrieve messages'
      });
    }
  },

  // Get unread messages count (for student)
  getStudentUnreadCount: async (req: Request, res: Response) => {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          error: 'Authentication required'
        });
      }

      const messages = await messageModel.getUnread(userId);
      const counselorMessages = messages.filter(m => m.fromCounselor);

      return res.json({
        unreadCount: counselorMessages.length,
        notifications: notifications.get(userId) || []
      });
    } catch (error) {
      console.error('Get unread count error:', error);
      return res.status(500).json({
        error: 'Failed to retrieve unread count'
      });
    }
  },

  // Get unread messages count (for counselor)
  getCounselorUnreadCount: async (req: Request, res: Response) => {
    try {
      const counselorId = req.user?.userId;

      if (!counselorId) {
        return res.status(401).json({
          error: 'Authentication required'
        });
      }

      // Get all cases assigned to counselor
      const cases = await caseModel.getByCounselorId(counselorId);
      
      let unreadCount = 0;
      for (const caseDoc of cases) {
        const messages = await messageModel.getUnread(caseDoc.studentId);
        const studentMessages = messages.filter(m => !m.fromCounselor && m.reportId === caseDoc.reportId);
        unreadCount += studentMessages.length;
      }

      return res.json({
        unreadCount,
        notifications: notifications.get(counselorId) || [],
        assignedCases: cases.length
      });
    } catch (error) {
      console.error('Get counselor unread count error:', error);
      return res.status(500).json({
        error: 'Failed to retrieve unread count'
      });
    }
  },

  // Clear notifications (mark as read)
  clearNotifications: async (req: Request, res: Response) => {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          error: 'Authentication required'
        });
      }

      notifications.delete(userId);

      return res.json({
        success: true,
        message: 'Notifications cleared'
      });
    } catch (error) {
      console.error('Clear notifications error:', error);
      return res.status(500).json({
        error: 'Failed to clear notifications'
      });
    }
  }
};
