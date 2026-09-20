export type InstructorEarningStatus =
  | "available"
  | "processing"
  | "paid"
  | "failed"
  | "reversed";

export type InstructorEarningEntry = {
  id: string;
  bookingId: string;
  schoolId: string;
  schoolName: string;
  studentName: string;
  studentInitials: string;
  studentAvatarUrl: string | null;
  durationMinutes: number;
  amountCents: number;
  currency: string;
  status: InstructorEarningStatus;
  completedAt: string;
};

export type InstructorEarningDay = {
  date: string;
  amountCents: number;
  lessonCount: number;
  durationMinutes: number;
  entries: InstructorEarningEntry[];
};

export type InstructorEarningSchool = {
  schoolId: string;
  name: string;
  timezone: string;
  weekStartDate: string;
  weekEndDate: string;
  amountCents: number;
  lessonCount: number;
  durationMinutes: number;
};

export type InstructorWeeklyEarningsResponse = {
  weekOffset: number;
  totalCents: number;
  lessonCount: number;
  durationMinutes: number;
  averagePerLessonCents: number;
  currency: string;
  activeSchoolCount: number;
  days: InstructorEarningDay[];
  schools: InstructorEarningSchool[];
};

export type InstructorSchoolEarningsItem = {
  schoolId: string;
  name: string;
  initials: string;
  avatarColor: string;
  lessonCount: number;
  amountCents: number;
};

export type InstructorSchoolEarningsSummary = {
  weekLabel: string;
  totalCents: number;
  schools: InstructorSchoolEarningsItem[];
};
