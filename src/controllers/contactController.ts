import { Request, Response } from 'express';
import { contactModel } from '../models/contactDb'
;

export const contactController = {
  // Create trusted contact
  createContact: async (req: Request, res: Response) => {
    try {
      const { name, phone, email, relationship } = req.body;
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          error: 'Authentication required'
        });
      }

      if (!name) {
        return res.status(400).json({
          error: 'Contact name is required'
        });
      }

      const contact = await contactModel.create(
        userId,
        name,
        phone,
        email,
        relationship
      );

      return res.status(201).json({
        success: true,
        contact
      });
    } catch (error) {
      console.error('Create contact error:', error);
      return res.status(500).json({
        error: 'Failed to create contact'
      });
    }
  },

  // Get all trusted contacts for student
  getMyContacts: async (req: Request, res: Response) => {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          error: 'Authentication required'
        });
      }

      const contacts = await contactModel.getByUserId(userId);

      return res.json({
        total: contacts.length,
        contacts
      });
    } catch (error) {
      console.error('Get contacts error:', error);
      return res.status(500).json({
        error: 'Failed to retrieve contacts'
      });
    }
  },

  // Update contact
  updateContact: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const userId = req.user?.userId;
      const { name, phone, email, relationship } = req.body;

      if (!userId) {
        return res.status(401).json({
          error: 'Authentication required'
        });
      }

      const contact = await contactModel.getById(id);
      if (!contact) {
        return res.status(404).json({
          error: 'Contact not found'
        });
      }

      if (contact.userId !== userId) {
        return res.status(403).json({
          error: 'Unauthorized'
        });
      }

      const updated = await contactModel.update(id, {
        name: name || contact.name,
        phone,
        email,
        relationship
      });

      return res.json({
        success: true,
        contact: updated
      });
    } catch (error) {
      console.error('Update contact error:', error);
      return res.status(500).json({
        error: 'Failed to update contact'
      });
    }
  },

  // Delete contact
  deleteContact: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          error: 'Authentication required'
        });
      }

      const contact = await contactModel.getById(id);
      if (!contact) {
        return res.status(404).json({
          error: 'Contact not found'
        });
      }

      if (contact.userId !== userId) {
        return res.status(403).json({
          error: 'Unauthorized'
        });
      }

      await contactModel.delete(id);

      return res.json({
        success: true,
        message: 'Contact deleted'
      });
    } catch (error) {
      console.error('Delete contact error:', error);
      return res.status(500).json({
        error: 'Failed to delete contact'
      });
    }
  }
};
