import STUDENTS_DATA_JSON from './students.json';
import TEACHERS_DATA_JSON from './teachers.json';
import CLASSES_DATA_JSON from './classes.json';
import ROOMS_DATA_JSON from './rooms.json';
import RECENT_PAYMENTS_JSON from './payments.json';
import NOTIFICATIONS_DATA_JSON from './notifications.json';
import { Student, Teacher, Class, Room, Payment, Notification } from '../types/data';

const STUDENTS_DATA = STUDENTS_DATA_JSON as Student[];
const TEACHERS_DATA = TEACHERS_DATA_JSON as Teacher[];
const CLASSES_DATA = CLASSES_DATA_JSON as Class[];
const ROOMS_DATA = ROOMS_DATA_JSON as Room[];
const RECENT_PAYMENTS = RECENT_PAYMENTS_JSON as Payment[];
const NOTIFICATIONS_DATA = NOTIFICATIONS_DATA_JSON as Notification[];

interface RevenueDataPoint {
  month: string;
  value: number;
}

const REVENUE_MONTHLY: RevenueDataPoint[] = [
  { month: "T10", value: 132 }, { month: "T11", value: 145 }, { month: "T12", value: 128 },
  { month: "T1", value: 158 }, { month: "T2", value: 142 }, { month: "T3", value: 167 },
  { month: "T4", value: 172 }, { month: "T5", value: 156.8 },
];

export {
  STUDENTS_DATA,
  TEACHERS_DATA,
  CLASSES_DATA,
  ROOMS_DATA,
  RECENT_PAYMENTS,
  NOTIFICATIONS_DATA,
  REVENUE_MONTHLY,
};
