export type ActiveSchool = {
  id: string;
  name: string;
  initials: string;
  avatarColor: string;
};

export const MOCK_ACTIVE_SCHOOLS: ActiveSchool[] = [
  {
    id: '1',
    name: 'Precision Driving School',
    initials: 'PD',
    avatarColor: '#f97316',
  },
  {
    id: '2',
    name: 'City Drive Academy',
    initials: 'CD',
    avatarColor: '#005eff',
  },
  {
    id: '3',
    name: 'Northside Learners',
    initials: 'NL',
    avatarColor: '#16a34a',
  },
];

export const ACTIVE_SCHOOL_COUNT = MOCK_ACTIVE_SCHOOLS.length;
