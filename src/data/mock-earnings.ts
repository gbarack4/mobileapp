import type { SchoolWeeklyEarningsSummary, WeeklyEarnings } from '../types/earnings';
import { MOCK_ACTIVE_SCHOOLS } from './mock-active-schools';

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

function startOfWeekMonday(date: Date) {
  const copy = new Date(date);
  const day = copy.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  copy.setDate(copy.getDate() + diff);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function formatWeekLabel(weekStart: Date) {
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);

  const startFormatter = new Intl.DateTimeFormat('en-AU', {
    day: 'numeric',
    month: 'short',
  });
  const endFormatter = new Intl.DateTimeFormat('en-AU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return `${startFormatter.format(weekStart)} – ${endFormatter.format(weekEnd)}`;
}

function formatDayDate(date: Date) {
  return new Intl.DateTimeFormat('en-AU', {
    day: 'numeric',
    month: 'short',
  }).format(date);
}

const WEEKLY_AMOUNTS = [18500, 14200, 22800, 19600, 25400, 16800, 7200];
const WEEKLY_LESSONS = [3, 2, 4, 3, 4, 3, 1];

const BASE_ENTRIES = [
  { studentName: 'Mark Thompson', studentInitials: 'MT', time: '10:00 AM', amountCents: 8500 },
  { studentName: 'Rachel Andre', studentInitials: 'RA', time: '11:00 AM', amountCents: 6500 },
  { studentName: 'Sophie Chen', studentInitials: 'SC', time: '2:00 PM', amountCents: 7500 },
  { studentName: 'James Wilson', studentInitials: 'JW', time: '9:00 AM', amountCents: 9000 },
  { studentName: 'Emma Davis', studentInitials: 'ED', time: '3:30 PM', amountCents: 7000 },
  { studentName: 'Liam O’Brien', studentInitials: 'LO', time: '4:00 PM', amountCents: 6500 },
  { studentName: 'Priya Sharma', studentInitials: 'PS', time: '8:30 AM', amountCents: 8000 },
  { studentName: 'Noah Brown', studentInitials: 'NB', time: '1:00 PM', amountCents: 7200 },
  { studentName: 'Ava Martinez', studentInitials: 'AM', time: '5:00 PM', amountCents: 6800 },
  { studentName: 'Ethan Lee', studentInitials: 'EL', time: '12:00 PM', amountCents: 8500 },
  { studentName: 'Chloe Nguyen', studentInitials: 'CN', time: '10:30 AM', amountCents: 7500 },
  { studentName: 'Oliver King', studentInitials: 'OK', time: '2:30 PM', amountCents: 9000 },
  { studentName: 'Mia Taylor', studentInitials: 'MT', time: '11:30 AM', amountCents: 6500 },
  { studentName: 'Jack Harris', studentInitials: 'JH', time: '4:30 PM', amountCents: 7200 },
] as const;

export function getWeeklyEarnings(weekOffset = 0): WeeklyEarnings {
  const today = new Date();
  const weekStart = startOfWeekMonday(today);
  weekStart.setDate(weekStart.getDate() + weekOffset * 7);

  const scale = weekOffset === 0 ? 1 : 0.82 + Math.abs(weekOffset % 3) * 0.08;
  const days = DAY_LABELS.map((dayLabel, index) => {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + index);

    return {
      dayLabel,
      dateLabel: formatDayDate(date),
      amountCents: Math.round(WEEKLY_AMOUNTS[index] * scale),
      lessonCount: WEEKLY_LESSONS[index],
    };
  });

  const totalCents = days.reduce((sum, day) => sum + day.amountCents, 0);
  const lessonCount = days.reduce((sum, day) => sum + day.lessonCount, 0);
  const hoursTaught = lessonCount * 1.25;
  const pendingCents = weekOffset === 0 ? 7200 : 0;

  const entries = BASE_ENTRIES.slice(0, lessonCount).map((entry, index) => {
    const dayIndex = index % 7;
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + dayIndex);

    return {
      id: `${weekOffset}-${index}`,
      studentName: entry.studentName,
      studentInitials: entry.studentInitials,
      dateLabel: `${DAY_LABELS[dayIndex]} ${formatDayDate(date)}`,
      time: entry.time,
      amountCents: entry.amountCents,
      status: weekOffset === 0 && index >= lessonCount - 1 ? 'pending' : 'paid',
    } as const;
  });

  return {
    weekLabel: formatWeekLabel(weekStart),
    totalCents,
    lessonCount,
    hoursTaught,
    pendingCents,
    days,
    entries,
  };
}

const SCHOOL_AMOUNT_SHARES = [0.44, 0.34, 0.22];
const SCHOOL_LESSON_WEIGHTS = [9, 7, 4];

export function getSchoolWeeklyEarnings(weekOffset = 0): SchoolWeeklyEarningsSummary {
  const weekly = getWeeklyEarnings(weekOffset);
  const lessonWeightTotal = SCHOOL_LESSON_WEIGHTS.reduce((sum, weight) => sum + weight, 0);

  const schools = MOCK_ACTIVE_SCHOOLS.map((school, index) => {
    const amountCents = Math.round(weekly.totalCents * (SCHOOL_AMOUNT_SHARES[index] ?? 0));
    const lessonCount = Math.max(
      1,
      Math.round(
        weekly.lessonCount * ((SCHOOL_LESSON_WEIGHTS[index] ?? 1) / lessonWeightTotal),
      ),
    );
    const pendingCents = weekOffset === 0 && index === MOCK_ACTIVE_SCHOOLS.length - 1
      ? weekly.pendingCents
      : 0;

    return {
      schoolId: school.id,
      name: school.name,
      initials: school.initials,
      avatarColor: school.avatarColor,
      amountCents,
      lessonCount,
      pendingCents,
    };
  });

  return {
    weekLabel: weekly.weekLabel,
    totalCents: weekly.totalCents,
    schools,
  };
}
