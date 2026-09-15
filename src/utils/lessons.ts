import type { Lesson } from '../types/dashboard';

function formatShortDuration(duration: string) {
  return duration.replace(/\s*hours?\b/gi, ' hrs').trim();
}

function formatShortTransmission(transmission: Lesson['transmission']) {
  return transmission === 'Automatic' ? 'auto' : 'manual';
}

export function formatLessonMeta(lesson: Pick<Lesson, 'duration' | 'transmission'>) {
  return `${formatShortDuration(lesson.duration)}, ${formatShortTransmission(lesson.transmission)}`;
}
