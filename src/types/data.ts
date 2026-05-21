export interface Student {
  id: string | number;
  name: string;
  parent: string;
  parentId?: string;
  phone: string;
  level: string;
  status: 'active' | 'trial' | 'paused' | 'inactive';
  avatar?: string;
  joinDate?: string;
  birthDate?: string;
  attendance?: number;
  attendanceRate?: number;
  absenceCount?: number;
  balance?: number;
  classes?: string[];
  [key: string]: any;
}

export interface Teacher {
  id: string | number;
  name: string;
  phone: string;
  email: string;
  nationality: string;
  subjects: string[];
  classCount: number;
  status: 'active' | 'on-leave' | 'inactive';
  avatar?: string;
  color?: string;
  branchIds?: string[];
  branches?: string[];
  [key: string]: any;
}

export interface Class {
  id: string | number;
  name: string;
  level: string;
  teacherId: string | number;
  teacher: string;
  assistantIds?: string[];
  assistantNames?: string[];
  room: string;
  roomId?: string;
  schedule: string;
  students: number;
  maxStudents: number;
  status: 'active' | 'paused' | 'inactive';
  ageGroup?: string;
  days?: number[];
  time?: string;
  endTime?: string;
  startDate?: string;
  endDate?: string;
  totalSessions?: number;
  completedSessions?: number;
  fee?: string;
  feeRaw?: number | null;
  [key: string]: any;
}

export interface Notification {
  id: string | number;
  title: string;
  desc: string;
  time: string;
  type: string;
  read: boolean;
  entityType?: string | null;
  entityId?: string | null;
}

export interface Payment {
  id: string | number;
  code?: string;
  student: string;
  amount: string | number;
  date: string;
  status: 'paid' | 'pending' | 'overdue';
  type: string;
}

export interface Room {
  id: string | number;
  name: string;
  floor: string;
  capacity: number;
  type: string;
  status: 'available' | 'in-use' | 'maintenance';
  equipment: string[];
}
