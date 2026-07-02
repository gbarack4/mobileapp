export type LessonTab = 'upcoming' | 'completed' | 'cancelled';
export type DashboardTab = 'school' | 'bookings' | 'earnings' | 'profile';

export type LessonStatus = 'upcoming' | 'completed' | 'cancelled';

export type Lesson = {
  id: string;
  dayOfWeek: string;
  day: string;
  month: string;
  year: string;
  time: string;
  title: string;
  duration: string;
  transmission: 'Manual' | 'Automatic';
  status: LessonStatus;
  locationName: string;
  locationAddress: string;
  latitude: number;
  longitude: number;
  studentInitials: string;
  studentName: string;
  studentEmail: string;
  studentPhone: string;
  studentSubtitle: string;
  lessonPrice: string;
};
