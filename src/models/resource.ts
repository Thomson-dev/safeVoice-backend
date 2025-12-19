import { Resource } from '../types';

// In-memory storage (replace with database later)
let resources: Map<string, Resource> = new Map();

// Seed with default resources
const initializeResources = () => {
  const defaultResources = [
    {
      id: '1',
      title: 'National Gender-Based Violence Hotline',
      description: '24/7 support for survivors',
      url: 'tel:1800-123-4567',
      category: 'hotline',
      available24h: true,
      createdAt: new Date()
    },
    {
      id: '2',
      title: 'Student Mental Health Support',
      description: 'Free counseling for students',
      url: 'https://example.com/mental-health',
      category: 'mental-health',
      available24h: false,
      createdAt: new Date()
    },
    {
      id: '3',
      title: 'Legal Aid for Students',
      description: 'Free legal guidance',
      url: 'https://example.com/legal-aid',
      category: 'legal',
      available24h: false,
      createdAt: new Date()
    }
  ];

  defaultResources.forEach(resource => {
    resources.set(resource.id, resource);
  });
};

// Initialize on module load
initializeResources();

export const resourceModel = {
  // Get all resources
  getAll: (): Resource[] => {
    return Array.from(resources.values());
  },

  // Get resources by category
  getByCategory: (category: string): Resource[] => {
    return Array.from(resources.values()).filter(
      r => r.category.toLowerCase() === category.toLowerCase()
    );
  },

  // Get 24/7 available resources
  get24hResources: (): Resource[] => {
    return Array.from(resources.values()).filter(r => r.available24h);
  },

  // Add new resource
  create: (data: Omit<Resource, 'id' | 'createdAt'>): Resource => {
    const resource: Resource = {
      id: Date.now().toString(),
      createdAt: new Date(),
      ...data
    };
    resources.set(resource.id, resource);
    return resource;
  }
};
