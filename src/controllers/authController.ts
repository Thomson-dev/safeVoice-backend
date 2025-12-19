import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { studentModel } from '../models/studentDb';
import { counselorModel } from '../models/counselorDb';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRE = '24h';

// Generate JWT token
const generateToken = (userId: string, anonymousId: string | undefined, role: string): string => {
  return jwt.sign(
    {
      sub: userId,
      anonymousId,
      role
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRE }
  );
};

export const authController = {
  // Student registration
  registerStudent: async (req: Request, res: Response) => {
    try {
      const { email, password, role } = req.body;

      // Validation
      if (!password) {
        return res.status(400).json({
          error: 'Password is required'
        });
      }

      if (role && role !== 'student') {
        return res.status(400).json({
          error: 'Invalid role'
        });
      }

      // Check if email already exists (if provided)
      if (email) {
        const existingStudent = await studentModel.getByEmail(email);
        if (existingStudent) {
          return res.status(409).json({
            error: 'Email already registered'
          });
        }
      }

      // Create student
      const student = await studentModel.register(email, password);

      // Generate token
      const token = generateToken(student.id, student.anonymousId, 'student');

      return res.status(201).json({
        success: true,
        userId: student.id,
        anonymousId: student.anonymousId,
        role: student.role,
        token
      });
    } catch (error) {
      console.error('Registration error:', error);
      return res.status(500).json({
        error: 'Registration failed'
      });
    }
  },

  // Student login
  loginStudent: async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;

      // Validation
      if (!email || !password) {
        return res.status(400).json({
          error: 'Email and password are required'
        });
      }

      // Verify credentials
      const student = await studentModel.verifyLogin(email, password);

      if (!student) {
        return res.status(401).json({
          error: 'Invalid email or password'
        });
      }

      // Generate token
      const token = generateToken(student.id, student.anonymousId, 'student');

      return res.json({
        success: true,
        userId: student.id,
        anonymousId: student.anonymousId,
        role: student.role,
        token
      });
    } catch (error) {
      console.error('Login error:', error);
      return res.status(500).json({
        error: 'Login failed'
      });
    }
  },

  // Counselor registration
  registerCounselor: async (req: Request, res: Response) => {
    try {
      const { email, password, fullName, license, schoolName, department, role } = req.body;

      // Validation
      if (!email || !password || !fullName || !license) {
        return res.status(400).json({
          error: 'email, password, fullName, and license are required'
        });
      }

      if (role && role !== 'counselor') {
        return res.status(400).json({
          error: 'Invalid role'
        });
      }

      // Create counselor
      const counselor = await counselorModel.register({
        email,
        password,
        fullName,
        license,
        schoolName,
        department
      });

      // Generate token
      const token = generateToken(counselor.id, undefined, 'counselor');

      return res.status(201).json({
        success: true,
        userId: counselor.id,
        fullName: counselor.fullName,
        role: counselor.role,
        isVerified: counselor.isVerified,
        token,
        message: 'Counselor registration pending admin verification'
      });
    } catch (error: any) {
      console.error('Counselor registration error:', error);
      return res.status(400).json({
        error: error.message || 'Registration failed'
      });
    }
  },

  // Counselor login
  loginCounselor: async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;

      // Validation
      if (!email || !password) {
        return res.status(400).json({
          error: 'Email and password are required'
        });
      }

      // Verify credentials
      const counselor = await counselorModel.verifyLogin(email, password);

      if (!counselor) {
        return res.status(401).json({
          error: 'Invalid email or password'
        });
      }

      // Check if verified
      if (!counselor.isVerified) {
        return res.status(403).json({
          error: 'Counselor account not verified by admin'
        });
      }

      // Generate token
      const token = generateToken(counselor.id, undefined, 'counselor');

      return res.json({
        success: true,
        userId: counselor.id,
        fullName: counselor.fullName,
        role: counselor.role,
        isVerified: counselor.isVerified,
        token
      });
    } catch (error) {
      console.error('Login error:', error);
      return res.status(500).json({
        error: 'Login failed'
      });
    }
  }
};
