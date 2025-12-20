import mongoose from 'mongoose';
import { CaseSchema } from './schemas/CaseSchema';
import { v4 as uuidv4 } from 'uuid';

const Case = mongoose.model('Case', CaseSchema);

export const caseModel = {
  create: async (reportId: string, studentId: string) => {
    try {
      const caseId = `CASE-${uuidv4().slice(0, 8).toUpperCase()}`;
      const caseDoc = new Case({
        caseId,
        reportId,
        studentId,
        status: 'new',
        riskLevel: 'low'
      });
      await caseDoc.save();
      return {
        id: caseDoc._id.toString(),
        caseId: caseDoc.caseId,
        reportId: caseDoc.reportId.toString(),
        studentId: caseDoc.studentId.toString(),
        counselorId: caseDoc.counselorId?.toString(),
        status: caseDoc.status,
        riskLevel: caseDoc.riskLevel,
        notes: caseDoc.notes,
        assignedAt: caseDoc.assignedAt,
        closedAt: caseDoc.closedAt,
        createdAt: caseDoc.createdAt,
        updatedAt: caseDoc.updatedAt
      };
    } catch (error) {
      console.error('Case create error:', error);
      throw error;
    }
  },

  getById: async (id: string) => {
    try {
      const caseDoc = await Case.findById(id);
      if (!caseDoc) return null;
      return {
        id: caseDoc._id.toString(),
        caseId: caseDoc.caseId,
        reportId: caseDoc.reportId.toString(),
        studentId: caseDoc.studentId.toString(),
        counselorId: caseDoc.counselorId?.toString(),
        status: caseDoc.status,
        riskLevel: caseDoc.riskLevel,
        notes: caseDoc.notes,
        assignedAt: caseDoc.assignedAt,
        closedAt: caseDoc.closedAt,
        createdAt: caseDoc.createdAt,
        updatedAt: caseDoc.updatedAt
      };
    } catch (error) {
      console.error('Case getById error:', error);
      throw error;
    }
  },

  getByCaseId: async (caseId: string) => {
    try {
      const caseDoc = await Case.findOne({ caseId });
      if (!caseDoc) return null;
      return {
        id: caseDoc._id.toString(),
        caseId: caseDoc.caseId,
        reportId: caseDoc.reportId.toString(),
        studentId: caseDoc.studentId.toString(),
        counselorId: caseDoc.counselorId?.toString(),
        status: caseDoc.status,
        riskLevel: caseDoc.riskLevel,
        notes: caseDoc.notes,
        assignedAt: caseDoc.assignedAt,
        closedAt: caseDoc.closedAt,
        createdAt: caseDoc.createdAt,
        updatedAt: caseDoc.updatedAt
      };
    } catch (error) {
      console.error('Case getByCaseId error:', error);
      throw error;
    }
  },

  getByReportId: async (reportId: string) => {
    try {
      const caseDoc = await Case.findOne({ reportId });
      if (!caseDoc) return null;
      return {
        id: caseDoc._id.toString(),
        caseId: caseDoc.caseId,
        reportId: caseDoc.reportId.toString(),
        studentId: caseDoc.studentId.toString(),
        counselorId: caseDoc.counselorId?.toString(),
        status: caseDoc.status,
        riskLevel: caseDoc.riskLevel,
        notes: caseDoc.notes,
        assignedAt: caseDoc.assignedAt,
        closedAt: caseDoc.closedAt,
        createdAt: caseDoc.createdAt,
        updatedAt: caseDoc.updatedAt
      };
    } catch (error) {
      console.error('Case getByReportId error:', error);
      throw error;
    }
  },

  getUnassigned: async () => {
    try {
      const cases = await Case.find({ counselorId: null }).sort({ createdAt: 1 });
      return cases.map((caseDoc: any) => ({
        id: caseDoc._id.toString(),
        caseId: caseDoc.caseId,
        reportId: caseDoc.reportId.toString(),
        studentId: caseDoc.studentId.toString(),
        counselorId: caseDoc.counselorId?.toString(),
        status: caseDoc.status,
        riskLevel: caseDoc.riskLevel,
        notes: caseDoc.notes,
        assignedAt: caseDoc.assignedAt,
        closedAt: caseDoc.closedAt,
        createdAt: caseDoc.createdAt,
        updatedAt: caseDoc.updatedAt
      }));
    } catch (error) {
      console.error('Case getUnassigned error:', error);
      throw error;
    }
  },

  getByCounselorId: async (counselorId: string) => {
    try {
      const cases = await Case.find({ counselorId, status: { $ne: 'closed' } }).sort({ updatedAt: -1 });
      return cases.map((caseDoc: any) => ({
        id: caseDoc._id.toString(),
        caseId: caseDoc.caseId,
        reportId: caseDoc.reportId.toString(),
        studentId: caseDoc.studentId.toString(),
        counselorId: caseDoc.counselorId?.toString(),
        status: caseDoc.status,
        riskLevel: caseDoc.riskLevel,
        notes: caseDoc.notes,
        assignedAt: caseDoc.assignedAt,
        closedAt: caseDoc.closedAt,
        createdAt: caseDoc.createdAt,
        updatedAt: caseDoc.updatedAt
      }));
    } catch (error) {
      console.error('Case getByCounselorId error:', error);
      throw error;
    }
  },

  assignCounselor: async (id: string, counselorId: string) => {
    try {
      console.log('Assigning counselor:', { id, counselorId });
      const caseDoc = await Case.findByIdAndUpdate(
        id,
        { counselorId, status: 'active', assignedAt: new Date() },
        { new: true }
      );
      if (!caseDoc) {
        console.error('Case not found during assignment:', id);
        return null;
      }
      return {
        id: caseDoc._id.toString(),
        caseId: caseDoc.caseId,
        reportId: caseDoc.reportId.toString(),
        studentId: caseDoc.studentId.toString(),
        counselorId: caseDoc.counselorId?.toString(),
        status: caseDoc.status,
        riskLevel: caseDoc.riskLevel,
        notes: caseDoc.notes,
        assignedAt: caseDoc.assignedAt,
        closedAt: caseDoc.closedAt,
        createdAt: caseDoc.createdAt,
        updatedAt: caseDoc.updatedAt
      };
    } catch (error) {
      console.error('Case assignCounselor error:', error);
      throw error;
    }
  },

  updateStatus: async (id: string, status: string) => {
    try {
      const updateData: any = { status };
      if (status === 'closed') {
        updateData.closedAt = new Date();
      }
      const caseDoc = await Case.findByIdAndUpdate(id, updateData, { new: true });
      if (!caseDoc) return null;
      return {
        id: caseDoc._id.toString(),
        caseId: caseDoc.caseId,
        reportId: caseDoc.reportId.toString(),
        studentId: caseDoc.studentId.toString(),
        counselorId: caseDoc.counselorId?.toString(),
        status: caseDoc.status,
        riskLevel: caseDoc.riskLevel,
        notes: caseDoc.notes,
        assignedAt: caseDoc.assignedAt,
        closedAt: caseDoc.closedAt,
        createdAt: caseDoc.createdAt,
        updatedAt: caseDoc.updatedAt
      };
    } catch (error) {
      console.error('Case updateStatus error:', error);
      throw error;
    }
  },

  updateRiskLevel: async (id: string, riskLevel: string, notes?: string) => {
    try {
      const updateData: any = { riskLevel };
      if (notes) updateData.notes = notes;
      const caseDoc = await Case.findByIdAndUpdate(id, updateData, { new: true });
      if (!caseDoc) return null;
      return {
        id: caseDoc._id.toString(),
        caseId: caseDoc.caseId,
        reportId: caseDoc.reportId.toString(),
        studentId: caseDoc.studentId.toString(),
        counselorId: caseDoc.counselorId?.toString(),
        status: caseDoc.status,
        riskLevel: caseDoc.riskLevel,
        notes: caseDoc.notes,
        assignedAt: caseDoc.assignedAt,
        closedAt: caseDoc.closedAt,
        createdAt: caseDoc.createdAt,
        updatedAt: caseDoc.updatedAt
      };
    } catch (error) {
      console.error('Case updateRiskLevel error:', error);
      throw error;
    }
  },

  getAll: async () => {
    try {
      const cases = await Case.find().sort({ createdAt: -1 });
      return cases.map((caseDoc: any) => ({
        id: caseDoc._id.toString(),
        caseId: caseDoc.caseId,
        reportId: caseDoc.reportId.toString(),
        studentId: caseDoc.studentId.toString(),
        counselorId: caseDoc.counselorId?.toString(),
        status: caseDoc.status,
        riskLevel: caseDoc.riskLevel,
        notes: caseDoc.notes,
        assignedAt: caseDoc.assignedAt,
        closedAt: caseDoc.closedAt,
        createdAt: caseDoc.createdAt,
        updatedAt: caseDoc.updatedAt
      }));
    } catch (error) {
      console.error('Case getAll error:', error);
      throw error;
    }
  },

  // Auto-assign case to least-loaded counselor
  autoAssignToCounselor: async (caseId: string, counselors: Array<{ id: string; name: string }>) => {
    try {
      if (!counselors || counselors.length === 0) {
        console.warn('No counselors available for auto-assignment');
        return null;
      }

      // Count active cases (non-closed) for each counselor
      const counselorCaseCounts = await Promise.all(
        counselors.map(async (counselor) => {
          const count = await Case.countDocuments({
            counselorId: counselor.id,
            status: { $ne: 'closed' }
          });
          return { counselor, count };
        })
      );

      // Find counselor with least active cases
      const leastLoadedCounselor = counselorCaseCounts.reduce((prev, current) =>
        current.count < prev.count ? current : prev
      );

      const assignedCounselorId = leastLoadedCounselor.counselor.id;

      // Assign case
      const caseDoc = await Case.findByIdAndUpdate(
        caseId,
        {
          counselorId: assignedCounselorId,
          assignedAt: new Date()
        },
        { new: true }
      );

      if (!caseDoc) return null;

      console.log(`✅ Auto-assigned case ${caseDoc.caseId} to counselor ${assignedCounselorId} (${leastLoadedCounselor.count} existing cases)`);

      return {
        id: caseDoc._id.toString(),
        caseId: caseDoc.caseId,
        reportId: caseDoc.reportId.toString(),
        studentId: caseDoc.studentId.toString(),
        counselorId: caseDoc.counselorId?.toString(),
        status: caseDoc.status,
        riskLevel: caseDoc.riskLevel,
        notes: caseDoc.notes,
        assignedAt: caseDoc.assignedAt,
        closedAt: caseDoc.closedAt,
        createdAt: caseDoc.createdAt,
        updatedAt: caseDoc.updatedAt
      };
    } catch (error) {
      console.error('Case auto-assign error:', error);
      throw error;
    }
  },

  // Get counselor workload summary
  getCounselorWorkload: async (counselorId: string) => {
    try {
      const activeCases = await Case.countDocuments({
        counselorId,
        status: { $ne: 'closed' }
      });

      const highRiskCases = await Case.countDocuments({
        counselorId,
        status: { $ne: 'closed' },
        riskLevel: { $in: ['high', 'critical'] }
      });

      return {
        counselorId,
        activeCases,
        highRiskCases,
        totalWorkload: activeCases,
        isOverloaded: activeCases > 10 // Threshold: more than 10 active cases
      };
    } catch (error) {
      console.error('Case get workload error:', error);
      throw error;
    }
  },

  // Get all counselor workload summary
  getAllCounselorWorkload: async () => {
    try {
      const allCases = await Case.find({ status: { $ne: 'closed' } });
      
      // Group by counselor
      const workloadByCouncelor: Record<string, { activeCases: number; highRiskCases: number }> = {};
      
      allCases.forEach((caseDoc: any) => {
        if (caseDoc.counselorId) {
          const counselorId = caseDoc.counselorId.toString();
          if (!workloadByCouncelor[counselorId]) {
            workloadByCouncelor[counselorId] = { activeCases: 0, highRiskCases: 0 };
          }
          workloadByCouncelor[counselorId].activeCases++;
          if (caseDoc.riskLevel === 'high' || caseDoc.riskLevel === 'critical') {
            workloadByCouncelor[counselorId].highRiskCases++;
          }
        }
      });

      return workloadByCouncelor;
    } catch (error) {
      console.error('Case get all workload error:', error);
      throw error;
    }
  }
};
