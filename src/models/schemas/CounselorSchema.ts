import mongoose, { Schema, Document } from 'mongoose';
import { Counselor as CounselorType } from '../../types';

interface CounselorDocument extends CounselorType, Document { }

export const CounselorSchema = new Schema<CounselorDocument>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    password: {
      type: String,
      required: true
    },
    fullName: {
      type: String,
      required: true
    },
    license: {
      type: String,
      required: true,
      unique: true
    },
    role: {
      type: String,
      enum: ['counselor'],
      default: 'counselor'
    },
    isVerified: {
      type: Boolean,
      default: false,
      index: true
    },
    phone: {
      type: String,
      required: true
    },
    schoolName: String,
    department: String,
    lastLogin: Date
  },
  { timestamps: true }
);

export const Counselor = mongoose.model<CounselorDocument>('Counselor', CounselorSchema);
