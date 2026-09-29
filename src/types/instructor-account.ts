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
  | "active"
  | "deletion_requested"
  | "recovery_expired"
  | "inactive";

export type InstructorAccountStatusResult = {
  status: InstructorAccountStatus;
  recoveryExpiresAt: string | null;
  canRestore: boolean;
};

export type InstructorAccountRestoreResult = {
  success: true;
  status: "restored";
};
