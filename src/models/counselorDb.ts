import bcrypt from 'bcryptjs';
import { Counselor as CounselorType } from '../types';
import { Counselor } from './schemas/CounselorSchema';

// Hash password with bcrypt
const hashPassword = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

// Verify password
const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

export const counselorModel = {
  // Create new counselor
  register: async (data: {
    email: string;
    password: string;
    fullName: string;
    license: string;
    phone: string;
    schoolName?: string;
    department?: string;
  }): Promise<CounselorType> => {
    // Check if email already exists
    const existingEmail = await Counselor.findOne({ email: data.email });
    if (existingEmail) {
      throw new Error('Email already registered');
    }

    // Check if license already exists
    const existingLicense = await Counselor.findOne({ license: data.license });
    if (existingLicense) {
      throw new Error('License number already registered');
    }

    const hashedPassword = await hashPassword(data.password);

    const counselor = new Counselor({
      email: data.email,
      password: hashedPassword,
      fullName: data.fullName,
      license: data.license,
      phone: data.phone,
      schoolName: data.schoolName,
      department: data.department,
      role: 'counselor',
      isVerified: false // Must be verified by admin
    });

    await counselor.save();

    return {
      id: counselor._id.toString(),
      email: counselor.email,
      password: counselor.password,
      fullName: counselor.fullName,
      license: counselor.license,
      role: counselor.role,
      isVerified: counselor.isVerified,
      phone: counselor.phone,
      schoolName: counselor.schoolName,
      department: counselor.department,
      createdAt: counselor.createdAt,
      lastLogin: counselor.lastLogin
    };
  },

  // Get counselor by ID
  getById: async (id: string): Promise<CounselorType | null> => {
    const counselor = await Counselor.findById(id);
    if (!counselor) return null;

    return {
      id: counselor._id.toString(),
      email: counselor.email,
      password: counselor.password,
      fullName: counselor.fullName,
      license: counselor.license,
      role: counselor.role,
      isVerified: counselor.isVerified,
      phone: counselor.phone || '',
      schoolName: counselor.schoolName,
      department: counselor.department,
      createdAt: counselor.createdAt,
      lastLogin: counselor.lastLogin
    };
  },

  // Get counselor by email
  getByEmail: async (email: string): Promise<CounselorType | null> => {
    const counselor = await Counselor.findOne({ email });
    if (!counselor) return null;

    return {
      id: counselor._id.toString(),
      email: counselor.email,
      password: counselor.password,
      fullName: counselor.fullName,
      license: counselor.license,
      role: counselor.role,
      isVerified: counselor.isVerified,
      phone: counselor.phone || '',
      schoolName: counselor.schoolName,
      department: counselor.department,
      createdAt: counselor.createdAt,
      lastLogin: counselor.lastLogin
    };
  },

  // Verify login
  verifyLogin: async (email: string, password: string): Promise<CounselorType | null> => {
    const counselor = await Counselor.findOne({ email });
    if (!counselor) return null;

    const isMatch = await verifyPassword(password, counselor.password);
    if (!isMatch) return null;

    // Use findOneAndUpdate to avoid validation errors if legacy documents
    // are missing required fields (like phone)
    await Counselor.findOneAndUpdate(
      { _id: counselor._id },
      { lastLogin: new Date() }
    );

    return {
      id: counselor._id.toString(),
      email: counselor.email,
      password: counselor.password,
      fullName: counselor.fullName,
      license: counselor.license,
      role: counselor.role,
      isVerified: counselor.isVerified,
      phone: counselor.phone || '', // Fallback for legacy data
      schoolName: counselor.schoolName,
      department: counselor.department,
      createdAt: counselor.createdAt,
      lastLogin: new Date()
    };
  },

  // Get all unverified counselors
  getUnverified: async (): Promise<CounselorType[]> => {
    const counselors = await Counselor.find({ isVerified: false });
    return counselors.map(c => ({
      id: c._id.toString(),
      email: c.email,
      password: c.password,
      fullName: c.fullName,
      license: c.license,
      role: c.role,
      isVerified: c.isVerified,
      phone: c.phone || '',
      schoolName: c.schoolName,
      department: c.department,
      createdAt: c.createdAt,
      lastLogin: c.lastLogin
    }));
  },

  // Verify counselor (admin only)
  verify: async (id: string): Promise<CounselorType | null> => {
    const counselor = await Counselor.findByIdAndUpdate(
      id,
      { isVerified: true },
      { new: true }
    );

    if (!counselor) return null;

    return {
      id: counselor._id.toString(),
      email: counselor.email,
      password: counselor.password,
      fullName: counselor.fullName,
      license: counselor.license,
      role: counselor.role,
      isVerified: counselor.isVerified,
      phone: counselor.phone || '',
      schoolName: counselor.schoolName,
      department: counselor.department,
      createdAt: counselor.createdAt,
      lastLogin: counselor.lastLogin
    };
  },

  // Update last login
  updateLastLogin: async (id: string): Promise<void> => {
    await Counselor.findByIdAndUpdate(id, { lastLogin: new Date() });
  },

  // Get all active counselors (auto-assign uses this)
  getActive: async (): Promise<Array<{ id: string; fullName: string; email: string }>> => {
    const counselors = await Counselor.find({ isVerified: true }).select('_id fullName email');
    return counselors.map(c => ({
      id: c._id.toString(),
      fullName: c.fullName,
      email: c.email
    }));
  },

  // Get all verified counselors with workload info
  getVerifiedWithWorkload: async (): Promise<any[]> => {
    const counselors = await Counselor.find({ isVerified: true }).select('_id fullName email');
    return counselors.map(c => ({
      id: c._id.toString(),
      fullName: c.fullName,
      email: c.email,
      name: c.fullName
    }));
  },

  // Get counselors with phone numbers for emergency SMS
  getCounselorsWithPhones: async (): Promise<Array<{ id: string; fullName: string; phone: string }>> => {
    const counselors = await Counselor.find({
      isVerified: true,
      phone: { $exists: true, $nin: [null, ''] }
    }).select('_id fullName phone');

    return counselors.map(c => ({
      id: c._id.toString(),
      fullName: c.fullName,
      phone: (c as any).phone
    }));
  }
};
