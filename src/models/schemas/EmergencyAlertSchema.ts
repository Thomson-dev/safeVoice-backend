import mongoose from 'mongoose';

export const EmergencyAlertSchema = new mongoose.Schema(
  {
    caseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Case',
      required: false,
      index: true
    },
    reportId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Report',
      required: false,
      index: true
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true
    },
    counselorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Counselor'
    },
    triggerType: {
      type: String,
      enum: ['sos_button', 'risk_escalation', 'manual_escalation'],
      required: true
    },
    riskLevel: {
      type: String,
      enum: ['high', 'critical'],
      required: true
    },
    description: {
      type: String,
      required: true
    },
    studentLocation: {
      latitude: Number,
      longitude: Number,
      accuracy: Number,
      timestamp: Date
    },
    guardianPhoneNumbers: [String],
    guardianEmailAddresses: [String],
    alertsSent: {
      push_notification: {
        sent: { type: Boolean, default: false },
        sentAt: Date,
        recipient: String
      },
      sms: {
        sent: { type: Boolean, default: false },
        sentAt: Date,
        recipients: [String],
        messageId: String
      },
      email: {
        sent: { type: Boolean, default: false },
        sentAt: Date,
        recipients: [String]
      }
    },
    counselorNotified: {
      type: Boolean,
      default: false
    },
    counselorNotifiedAt: Date,
    status: {
      type: String,
      enum: ['triggered', 'in_progress', 'resolved', 'cancelled'],
      default: 'triggered'
    },
    resolutionNotes: String,
    resolvedAt: Date,
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

EmergencyAlertSchema.index({ caseId: 1, createdAt: -1 });
EmergencyAlertSchema.index({ studentId: 1, status: 1 });
EmergencyAlertSchema.index({ createdAt: -1 });
