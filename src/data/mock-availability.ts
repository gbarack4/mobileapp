export type DayOfWeek =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday';

export type AvailabilitySlot = {
  startTime: string;
  endTime: string;
  locations: string[];
};

export type DayAvailability = {
  dayOfWeek: DayOfWeek;
  slot: AvailabilitySlot | null;
};

export type InstructorAvailability = {
  instructorId: string;
  dynamicScheduling: boolean;
  days: DayAvailability[];
};

export const DAY_OF_WEEK_ORDER: DayOfWeek[] = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
];

export const DAY_SHORT_LABELS: Record<DayOfWeek, string> = {
  monday: 'MON',
  tuesday: 'TUE',
  wednesday: 'WED',
  thursday: 'THU',
  friday: 'FRI',
  saturday: 'SAT',
  sunday: 'SUN',
};

export const DAY_LABELS: Record<DayOfWeek, string> = {
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
  saturday: 'Saturday',
  sunday: 'Sunday',
};

export const MOCK_INSTRUCTOR_AVAILABILITY: InstructorAvailability = {
  instructorId: 'inst-001',
  dynamicScheduling: false,
  days: [
    {
      dayOfWeek: 'monday',
      slot: {
        startTime: '9:00 am',
        endTime: '12:00 pm',
        locations: ['Inala', 'Richlands', 'Forest Lake'],
      },
    },
    {
      dayOfWeek: 'tuesday',
      slot: {
        startTime: '9:00 am',
        endTime: '12:00 pm',
        locations: ['Inala', 'Richlands', 'Forest Lake'],
      },
    },
    { dayOfWeek: 'wednesday', slot: null },
    {
      dayOfWeek: 'thursday',
      slot: {
        startTime: '9:00 am',
        endTime: '12:00 pm',
        locations: ['Inala', 'Springfield'],
      },
    },
    { dayOfWeek: 'friday', slot: null },
    { dayOfWeek: 'saturday', slot: null },
    { dayOfWeek: 'sunday', slot: null },
  ],
};

export function cloneAvailability(availability: InstructorAvailability): InstructorAvailability {
  return {
    instructorId: availability.instructorId,
    dynamicScheduling: availability.dynamicScheduling,
    days: availability.days.map((day) => ({
      dayOfWeek: day.dayOfWeek,
      slot: day.slot
        ? {
            startTime: day.slot.startTime,
            endTime: day.slot.endTime,
            locations: [...day.slot.locations],
          }
        : null,
    })),
  };
}

export const DEFAULT_SLOT: AvailabilitySlot = {
  startTime: '9:00 am',
  endTime: '12:00 pm',
  locations: [],
};
