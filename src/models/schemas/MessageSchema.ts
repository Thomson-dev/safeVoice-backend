import mongoose from 'mongoose';

export const MessageSchema = new mongoose.Schema(
  {
    reportId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Report',
      required: true,
      index: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true
    },
    counselorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Counselor',
      default: null
    },
    fromCounselor: {
      type: Boolean,
      default: false,
      index: true
    },
    content: {
      type: String,
      required: true
    },
    readAt: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
);

MessageSchema.index({ reportId: 1, createdAt: -1 });
MessageSchema.index({ userId: 1, readAt: 1 });
MessageSchema.index({ counselorId: 1, createdAt: -1 });
