import type { CancellationReason } from '../components/dashboard/cancel-lesson-sheet';

export async function cancelLesson(
  lessonId: string,
  _reason: CancellationReason,
): Promise<void> {
  // TODO: connect to NestJS cancellation API
  void lessonId;
}
