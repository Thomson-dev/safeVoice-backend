import mongoose, { Schema, Document } from 'mongoose';

interface TrustedContactType {
  userId: string;
  name: string;
  phone?: string;
  email?: string;
  relationship?: string;
}

interface TrustedContactDocument extends TrustedContactType, Document {
  userId: string;
}

export const TrustedContactSchema = new Schema<TrustedContactDocument>(
  {
    userId: {
      type: String,
      required: true,
      ref: 'Student',
      index: true
    },
    name: {
      type: String,
      required: true
    },
    phone: String,
    email: String,
    relationship: String
  },
  { timestamps: true }
);

export const TrustedContact = mongoose.model<TrustedContactDocument>(
  'TrustedContact',
  TrustedContactSchema
);
