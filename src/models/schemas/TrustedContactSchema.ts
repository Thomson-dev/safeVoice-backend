import mongoose, { Schema, Document } from 'mongoose';

interface TrustedContactType {
  userId: string;
  name: string;
  phone: string;
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
    phone: {
      type: String,
      required: true
    }
  },
  { timestamps: true }
);

export const TrustedContact = mongoose.model<TrustedContactDocument>(
  'TrustedContact',
  TrustedContactSchema
);
