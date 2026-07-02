import type { Lesson } from '../types/dashboard';

const MONTH_INDEX: Record<string, number> = {
  JAN: 0,
  FEB: 1,
  MAR: 2,
  APR: 3,
  MAY: 4,
  JUN: 5,
  JUL: 6,
  AUG: 7,
  SEP: 8,
  OCT: 9,
  NOV: 10,
  DEC: 11,
};

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export function lessonToDate(lesson: Lesson): Date {
  const month = MONTH_INDEX[lesson.month.toUpperCase()] ?? 0;
  return new Date(Number(lesson.year), month, Number(lesson.day));
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function formatMonthYear(date: Date): string {
  return `${MONTH_NAMES[date.getMonth()]} ${date.getFullYear()}`;
}

export function formatSelectedDayLabel(date: Date): string {
  const month = date.toLocaleString('en-US', { month: 'short' }).toUpperCase();
  return `${month} ${date.getDate()}`;
}

export function getLessonsForDate(lessons: Lesson[], date: Date): Lesson[] {
  return lessons.filter((lesson) => isSameDay(lessonToDate(lesson), date));
}

export function getLessonCountsInMonth(
  lessons: Lesson[],
  year: number,
  month: number,
): Map<number, number> {
  const counts = new Map<number, number>();

  lessons.forEach((lesson) => {
    const lessonDate = lessonToDate(lesson);
    if (lessonDate.getFullYear() === year && lessonDate.getMonth() === month) {
      const day = lessonDate.getDate();
      counts.set(day, (counts.get(day) ?? 0) + 1);
    }
  });

  return counts;
}

export function getLessonDaysInMonth(lessons: Lesson[], year: number, month: number): Set<number> {
  return new Set(getLessonCountsInMonth(lessons, year, month).keys());
}

export function buildCalendarCells(year: number, month: number): (number | null)[] {
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const leadingEmpty = firstDay.getDay();
  const cells: (number | null)[] = Array.from({ length: leadingEmpty }, () => null);

  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(day);
  }

  while (cells.length % 7 !== 0) {
    cells.push(null);
  }

  return cells;
}

export function shiftMonth(date: Date, offset: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + offset, 1);
}
