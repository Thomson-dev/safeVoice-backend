import mongoose from 'mongoose';
import { MessageSchema } from './schemas/MessageSchema';

const Message = mongoose.model('Message', MessageSchema);

export const messageModel = {
  create: async (reportId: string, userId: string, content: string, fromCounselor: boolean, counselorId?: string) => {
    try {
      const message = new Message({
        reportId,
        userId,
        counselorId: fromCounselor ? counselorId : null,
        fromCounselor,
        content
      });
      await message.save();
      return {
        id: message._id.toString(),
        reportId: message.reportId.toString(),
        userId: message.userId.toString(),
        counselorId: message.counselorId?.toString(),
        fromCounselor: message.fromCounselor,
        content: message.content,
        readAt: message.readAt,
        createdAt: message.createdAt
      };
    } catch (error) {
      console.error('Message create error:', error);
      throw error;
    }
  },

  getById: async (id: string) => {
    try {
      const message = await Message.findById(id);
      if (!message) return null;
      return {
        id: message._id.toString(),
        reportId: message.reportId.toString(),
        userId: message.userId.toString(),
        counselorId: message.counselorId?.toString(),
        fromCounselor: message.fromCounselor,
        content: message.content,
        readAt: message.readAt,
        createdAt: message.createdAt
      };
    } catch (error) {
      console.error('Message getById error:', error);
      throw error;
    }
  },

  getByReportId: async (reportId: string) => {
    try {
      const messages = await Message.find({ reportId }).sort({ createdAt: -1 });
      return messages.map((message: any) => ({
        id: message._id.toString(),
        reportId: message.reportId.toString(),
        userId: message.userId.toString(),
        counselorId: message.counselorId?.toString(),
        fromCounselor: message.fromCounselor,
        content: message.content,
        readAt: message.readAt,
        createdAt: message.createdAt
      }));
    } catch (error) {
      console.error('Message getByReportId error:', error);
      throw error;
    }
  },

  getByCaseId: async (reportId: string) => {
    try {
      const messages = await Message.find({ reportId }).sort({ createdAt: 1 });
      return messages.map((message: any) => ({
        id: message._id.toString(),
        reportId: message.reportId.toString(),
        userId: message.userId.toString(),
        counselorId: message.counselorId?.toString(),
        fromCounselor: message.fromCounselor,
        content: message.content,
        readAt: message.readAt,
        createdAt: message.createdAt
      }));
    } catch (error) {
      console.error('Message getByCaseId error:', error);
      throw error;
    }
  },

  getByUserId: async (userId: string) => {
    try {
      const messages = await Message.find({ userId }).sort({ createdAt: -1 });
      return messages.map((message: any) => ({
        id: message._id.toString(),
        reportId: message.reportId.toString(),
        userId: message.userId.toString(),
        counselorId: message.counselorId?.toString(),
        fromCounselor: message.fromCounselor,
        content: message.content,
        readAt: message.readAt,
        createdAt: message.createdAt
      }));
    } catch (error) {
      console.error('Message getByUserId error:', error);
      throw error;
    }
  },

  getUnread: async (userId: string) => {
    try {
      const messages = await Message.find({ userId, readAt: null }).sort({ createdAt: -1 });
      return messages.map((message: any) => ({
        id: message._id.toString(),
        reportId: message.reportId.toString(),
        userId: message.userId.toString(),
        counselorId: message.counselorId?.toString(),
        fromCounselor: message.fromCounselor,
        content: message.content,
        readAt: message.readAt,
        createdAt: message.createdAt
      }));
    } catch (error) {
      console.error('Message getUnread error:', error);
      throw error;
    }
  },

  markAsRead: async (id: string) => {
    try {
      const message = await Message.findByIdAndUpdate(
        id,
        { readAt: new Date() },
        { new: true }
      );
      if (!message) return null;
      return {
        id: message._id.toString(),
        reportId: message.reportId.toString(),
        userId: message.userId.toString(),
        counselorId: message.counselorId?.toString(),
        fromCounselor: message.fromCounselor,
        content: message.content,
        readAt: message.readAt,
        createdAt: message.createdAt
      };
    } catch (error) {
      console.error('Message markAsRead error:', error);
      throw error;
    }
  },

  markMultipleAsRead: async (ids: string[]) => {
    try {
      await Message.updateMany(
        { _id: { $in: ids } },
        { readAt: new Date() }
      );
      return true;
    } catch (error) {
      console.error('Message markMultipleAsRead error:', error);
      throw error;
    }
  }
};
