import mongoose from 'mongoose';

export const ReportSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true
    },
    anonymousId: {
      type: String,
      required: true,
      index: true
    },
    trackingCode: {
      type: String,
      unique: true,
      required: true,
      index: true
    },
    incidentType: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    evidenceUrl: {
      type: String,
      default: null
    },
    schoolName: {
      type: String,
      default: null
    },
    status: {
      type: String,
      enum: ['pending', 'acknowledged', 'in_progress', 'resolved', 'closed'],
      default: 'pending',
      index: true
    },
    caseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Case',
      default: null,
      index: true
    },
    adminNotes: {
      type: String,
      default: ''
    }
  },
  { timestamps: true }
);

ReportSchema.index({ userId: 1, createdAt: -1 });
ReportSchema.index({ caseId: 1 });
