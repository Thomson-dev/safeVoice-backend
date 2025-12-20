import mongoose from 'mongoose';
import { StudentSchema } from './schemas/StudentSchema';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';


const Student = mongoose.model('Student', StudentSchema);

export const studentModel = {
  register: async (email: string, password: string) => {
    try {
      // Check if email already exists
      if (email) {
        const existing = await Student.findOne({ email });
        if (existing) {
          throw new Error('Email already registered');
        }
      }

      // Generate unique anonymousId using UUID
      const anonymousId = `ANON-${uuidv4().split('-')[0]}`;

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const student = new Student({
        email,
        password: hashedPassword,
        anonymousId,
        role: 'student'
      });

      await student.save();

      return {
        id: student._id.toString(),
        anonymousId: student.anonymousId,
        email: student.email,
        role: student.role,
        createdAt: student.createdAt
      };
    } catch (error) {
      console.error('Student register error:', error);
      throw error;
    }
  },

  getById: async (id: string) => {
    try {
      const student = await Student.findById(id);
      if (!student) return null;
      return {
        id: student._id.toString(),
        anonymousId: student.anonymousId,
        email: student.email,
        role: student.role,
        createdAt: student.createdAt,
        lastLogin: student.lastLogin
      };
    } catch (error) {
      console.error('Student getById error:', error);
      throw error;
    }
  },

  getByEmail: async (email: string) => {
    try {
      const student = await Student.findOne({ email });
      if (!student) return null;
      return {
        id: student._id.toString(),
        anonymousId: student.anonymousId,
        email: student.email,
        password: student.password,
        role: student.role,
        createdAt: student.createdAt,
        lastLogin: student.lastLogin
      };
    } catch (error) {
      console.error('Student getByEmail error:', error);
      throw error;
    }
  },

  verifyLogin: async (email: string, password: string) => {
    try {
      const student = await Student.findOne({ email });
      if (!student) {
        throw new Error('Invalid credentials');
      }

      const isValidPassword = await bcrypt.compare(password, student.password);
      if (!isValidPassword) {
        throw new Error('Invalid credentials');
      }

      return {
        id: student._id.toString(),
        anonymousId: student.anonymousId,
        email: student.email,
        role: student.role
      };
    } catch (error) {
      console.error('Student verifyLogin error:', error);
      throw error;
    }
  },

  updateLastLogin: async (id: string) => {
    try {
      const student = await Student.findByIdAndUpdate(
        id,
        { lastLogin: new Date() },
        { new: true }
      );
      if (!student) return null;
      return {
        id: student._id.toString(),
        anonymousId: student.anonymousId,
        email: student.email,
        role: student.role,
        lastLogin: student.lastLogin
      };
    } catch (error) {
      console.error('Student updateLastLogin error:', error);
      throw error;
    }
  }
};
