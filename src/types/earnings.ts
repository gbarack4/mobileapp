export type EarningEntryStatus = 'paid' | 'pending';

export type WeeklyEarningDay = {
  dayLabel: string;
  dateLabel: string;
  amountCents: number;
  lessonCount: number;
};

export type WeeklyEarningEntry = {
  id: string;
  studentName: string;
  studentInitials: string;
  dateLabel: string;
  time: string;
  amountCents: number;
  status: EarningEntryStatus;
};

export type WeeklyEarnings = {
  weekLabel: string;
  totalCents: number;
  lessonCount: number;
  hoursTaught: number;
  pendingCents: number;
  days: WeeklyEarningDay[];
  entries: WeeklyEarningEntry[];
};

export type SchoolWeeklyEarnings = {
  schoolId: string;
  name: string;
  initials: string;
  avatarColor: string;
  amountCents: number;
  lessonCount: number;
  pendingCents: number;
};

export type SchoolWeeklyEarningsSummary = {
  weekLabel: string;
  totalCents: number;
  schools: SchoolWeeklyEarnings[];
};
