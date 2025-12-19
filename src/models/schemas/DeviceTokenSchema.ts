import mongoose, { Schema, Document } from 'mongoose';

/**
 * Device Token Schema
 * 
 * Stores Firebase Cloud Messaging registration tokens for mobile devices
 * Each user (student/counselor) can have multiple devices (phone, tablet, etc)
 * 
 * Flow:
 * 1. Mobile app initializes Firebase
 * 2. Gets registration token from Firebase
 * 3. Sends token to backend via API
 * 4. Backend stores token linked to user
 * 5. When notification needed, backend sends via Firebase using token
 * 6. When device uninstalls app, mobile app can notify backend
 */

export interface DeviceToken extends Document {
  userId: mongoose.Types.ObjectId;
  userType: 'student' | 'counselor';
  token: string;
  deviceType: 'ios' | 'android' | 'web';
  deviceName?: string; // e.g., "iPhone 14 Pro", "Samsung Galaxy S21"
  appVersion: string; // e.g., "1.0.0"
  osVersion: string; // e.g., "16.1", "12.0.0"
  isActive: boolean; // false if device unregistered
  lastSeenAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const DeviceTokenSchema = new Schema<DeviceToken>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'User',
      index: true,
    },
    userType: {
      type: String,
      enum: ['student', 'counselor'],
      required: true,
      index: true,
    },
    token: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    deviceType: {
      type: String,
      enum: ['ios', 'android', 'web'],
      required: true,
    },
    deviceName: {
      type: String,
      default: null,
    },
    appVersion: {
      type: String,
      required: true,
    },
    osVersion: {
      type: String,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    lastSeenAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for fast lookup of active tokens by user
DeviceTokenSchema.index({ userId: 1, isActive: 1 });

// Index for cleanup: find old inactive tokens
DeviceTokenSchema.index({ isActive: 1, lastSeenAt: 1 });

export default mongoose.model<DeviceToken>('DeviceToken', DeviceTokenSchema);
