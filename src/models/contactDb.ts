import mongoose from 'mongoose';
import { TrustedContactSchema } from './schemas/TrustedContactSchema';

const TrustedContact = mongoose.model('TrustedContact', TrustedContactSchema);

export const contactModel = {
  create: async (userId: string, name: string, phone: string) => {
    try {
      const contact = new TrustedContact({
        userId,
        name,
        phone
      });
      await contact.save();
      return {
        id: contact._id.toString(),
        userId: contact.userId.toString(),
        name: contact.name,
        phone: contact.phone,
        createdAt: (contact as any).createdAt
      };
    } catch (error) {
      console.error('Contact create error:', error);
      throw error;
    }
  },

  getById: async (id: string) => {
    try {
      const contact = await TrustedContact.findById(id);
      if (!contact) return null;
      return {
        id: contact._id.toString(),
        userId: contact.userId.toString(),
        name: contact.name,
        phone: contact.phone,
        createdAt: (contact as any).createdAt
      };
    } catch (error) {
      console.error('Contact getById error:', error);
      throw error;
    }
  },

  getByUserId: async (userId: string) => {
    try {
      const contacts = await TrustedContact.find({ userId }).sort({ createdAt: -1 });
      return contacts.map((contact: any) => ({
        id: contact._id.toString(),
        userId: contact.userId.toString(),
        name: contact.name,
        phone: contact.phone,
        createdAt: contact.createdAt
      }));
    } catch (error) {
      console.error('Contact getByUserId error:', error);
      throw error;
    }
  },

  update: async (id: string, updateData: any) => {
    try {
      const contact = await TrustedContact.findByIdAndUpdate(id, updateData, { new: true });
      if (!contact) return null;
      return {
        id: contact._id.toString(),
        userId: contact.userId.toString(),
        name: contact.name,
        phone: contact.phone,
        createdAt: (contact as any).createdAt
      };
    } catch (error) {
      console.error('Contact update error:', error);
      throw error;
    }
  },

  delete: async (id: string) => {
    try {
      await TrustedContact.findByIdAndDelete(id);
      return true;
    } catch (error) {
      console.error('Contact delete error:', error);
      throw error;
    }
  }
};
