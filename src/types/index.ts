export enum ReportStatus {
  PENDING = 'pending',
  ACKNOWLEDGED = 'acknowledged',
  IN_PROGRESS = 'in_progress',
  RESOLVED = 'resolved',
  CLOSED = 'closed'
}

export enum CaseStatus {
  NEW = 'new',
  ACTIVE = 'active',
  ESCALATED = 'escalated',
  CLOSED = 'closed'
}

export enum RiskLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export interface Report {
  id: string;
  userId: string; // Internal link to student
  anonymousId: string; // Public-facing ID
  trackingCode: string;
  incidentType: string; // harassment, threat, stalking, etc.
  description: string;
  evidenceUrl?: string;
  schoolName?: string;
  status: ReportStatus;
  caseId?: string; // Link to case
  createdAt: Date;
  updatedAt: Date;
  adminNotes?: string;
}

export interface Case {
  id: string;
  caseId: string;
  reportId: string;
  studentId: string;
  counselorId?: string; // Hidden from student
  status: CaseStatus;
  riskLevel: RiskLevel;
  notes: string;
  assignedAt?: Date;
  closedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface TrustedContact {
  id: string;
  userId: string;
  name: string; // Can be anonymous (e.g., "Friend 1", "Counselor")
  phone?: string;
  email?: string;
  relationship?: string; // friend, family, counselor, etc.
  createdAt: Date;
}

export interface Message {
  id: string;
  reportId: string;
  userId: string;
  fromCounselor: boolean;
  content: string;
  createdAt: Date;
  readAt?: Date;
}

export interface Admin {
  id: string;
  email: string;
  password: string; // hashed
  name: string;
  school?: string;
  role: 'admin' | 'superadmin';
  createdAt: Date;
  lastLogin?: Date;
}

export interface Resource {
  id: string;
  title: string;
  description: string;
  url: string;
  category: string; // mental-health, legal, hotline, etc.
  available24h: boolean;
  createdAt: Date;
}

export interface Student {
  id: string;
  anonymousId: string;
  email?: string;
  password: string; // hashed
  role: 'student';
  createdAt: Date;
  lastLogin?: Date;
}

export interface Counselor {
  id: string;
  email: string;
  password: string; // hashed
  fullName: string;
  license: string;
  role: 'counselor';
  isVerified: boolean;
  schoolName?: string;
  department?: string;
  createdAt: Date;
  lastLogin?: Date;
}

export interface AuthToken {
  accessToken: string;
  expiresIn: number;
}

export interface AuthResponse {
  userId: string;
  anonymousId?: string;
  role: string;
  token: string;
  fullName?: string;
  isVerified?: boolean;
}
