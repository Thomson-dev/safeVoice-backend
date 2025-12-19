import { Request, Response } from 'express';
import { resourceModel } from '../models/resource';

export const resourceController = {
  // Get all resources
  getAllResources: async (req: Request, res: Response) => {
    try {
      const resources = await resourceModel.getAll();
      return res.json({
        total: resources.length,
        resources
      });
    } catch (error) {
      console.error('Get all resources error:', error);
      return res.status(500).json({
        error: 'Failed to retrieve resources'
      });
    }
  },

  // Get resources by category
  getResourcesByCategory: async (req: Request, res: Response) => {
    try {
      const { category } = req.params;
      const resources = await resourceModel.getByCategory(category);
      
      return res.json({
        category,
        total: resources.length,
        resources
      });
    } catch (error) {
      console.error('Get resources by category error:', error);
      return res.status(500).json({
        error: 'Failed to retrieve resources'
      });
    }
  },

  // Get 24/7 available resources
  get24hResources: async (req: Request, res: Response) => {
    try {
      const resources = await resourceModel.get24hResources();
      return res.json({
        total: resources.length,
        resources
      });
    } catch (error) {
      console.error('Get 24h resources error:', error);
      return res.status(500).json({
        error: 'Failed to retrieve resources'
      });
    }
  }
};
