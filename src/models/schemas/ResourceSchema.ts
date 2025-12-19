import mongoose, { Schema, Document } from 'mongoose';

interface ResourceType {
  title: string;
  description: string;
  url: string;
  category: string;
  available24h?: boolean;
}

interface ResourceDocument extends ResourceType, Document {}

export const ResourceSchema = new Schema<ResourceDocument>(
  {
    title: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    url: {
      type: String,
      required: true
    },
    category: {
      type: String,
      required: true,
      index: true
    },
    available24h: {
      type: Boolean,
      default: false,
      index: true
    }
  },
  { timestamps: true }
);

export const Resource = mongoose.model<ResourceDocument>('Resource', ResourceSchema);
