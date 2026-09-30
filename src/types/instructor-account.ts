export type InstructorAccountDeletionBlockers = {
  upcomingBookings: boolean;
  unpaidEarnings: boolean;
};

export type InstructorAccountDeletionResult = {
  success: true;
  status: "deletion_requested";
  deletionRequestedAt: string;
  recoveryExpiresAt: string;
};

export type InstructorAccountApiErrorBody = {
  message?: string;
  blockers?: InstructorAccountDeletionBlockers;
};

export type InstructorAccountStatus =
  | "onboarding_required"
  | "active"
  | "inactive"
  | "deletion_requested"
  | "recovery_expired";

export type InstructorAccountStatusResult = {
  status: InstructorAccountStatus;
  recoveryExpiresAt: string | null;
  canRestore: boolean;
};

export type InstructorAccountRestoreResult = {
  success: true;
  status: "restored";
};

export type InstructorAccountDeletionEligibility = {
  canDelete: boolean;
  blockers: InstructorAccountDeletionBlockers;
  deletionRequestedAt: string | null;
  recoveryExpiresAt: string | null;
};
