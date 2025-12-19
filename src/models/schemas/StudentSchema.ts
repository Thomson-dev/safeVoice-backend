import mongoose, { Schema, Document } from 'mongoose';
import { Student as StudentType } from '../../types';

interface StudentDocument extends StudentType, Document {}

const StudentSchema = new Schema<StudentDocument>(
  {
    anonymousId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    email: {
      type: String,
      unique: true,
      sparse: true,
      default: null,
      index: true
    },
    password: {
      type: String,
      required: true
    },
    role: {
      type: String,
      enum: ['student'],
      default: 'student'
    },
    lastLogin: Date
  },
  { timestamps: true }
);

export { StudentSchema };
export const Student = mongoose.model<StudentDocument>('Student', StudentSchema);
