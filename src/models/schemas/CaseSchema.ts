import mongoose from 'mongoose';

export const CaseSchema = new mongoose.Schema(
  {
    caseId: {
      type: String,
      unique: true,
      required: true
    },
    reportId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Report',
      required: true,
      unique: true,
      index: true
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
      index: true
    },
    counselorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Counselor',
      default: null
    },
    status: {
      type: String,
      enum: ['new', 'active', 'escalated', 'closed'],
      default: 'new'
    },
    riskLevel: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'low'
    },
    notes: {
      type: String,
      default: ''
    },
    assignedAt: {
      type: Date,
      default: null
    },
    closedAt: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
);

// Index for finding cases by counselor and status
CaseSchema.index({ counselorId: 1, status: 1 });
