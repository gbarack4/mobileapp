import type {
  InstructorAccountApiErrorBody,
  InstructorAccountDeletionBlockers,
  InstructorAccountDeletionEligibility,
  InstructorAccountDeletionResult,
  InstructorAccountRestoreResult,
  InstructorAccountStatusResult,
} from "../types/instructor-account";

const API_URL = process.env.EXPO_PUBLIC_API_URL?.replace(/\/+$/, "");

function getApiUrl(): string {
  if (!API_URL) {
    throw new Error("EXPO_PUBLIC_API_URL is not configured.");
  }

  return API_URL;
}

export class InstructorAccountApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly blockers?: InstructorAccountDeletionBlockers,
  ) {
    super(message);
    this.name = "InstructorAccountApiError";
  }
}

async function getErrorBody(
  response: Response,
): Promise<InstructorAccountApiErrorBody> {
  try {
    return (await response.json()) as InstructorAccountApiErrorBody;
  } catch {
    return {};
  }
}

export async function deleteInstructorAccount(
  token: string,
): Promise<InstructorAccountDeletionResult> {
  const response = await fetch(`${getApiUrl()}/instructors/account`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    const body = await getErrorBody(response);

    throw new InstructorAccountApiError(
      body.message ?? `Request failed with status ${response.status}`,
      response.status,
      body.blockers,
    );
  }

  return (await response.json()) as InstructorAccountDeletionResult;
}

export async function getInstructorAccountStatus(
  token: string,
): Promise<InstructorAccountStatusResult> {
  const response = await fetch(`${getApiUrl()}/instructors/account/status`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new InstructorAccountApiError(
      `Failed to get account status: ${response.status}`,
      response.status,
    );
  }

  return (await response.json()) as InstructorAccountStatusResult;
}

export async function restoreInstructorAccount(
  token: string,
): Promise<InstructorAccountRestoreResult> {
  const response = await fetch(`${getApiUrl()}/instructors/account/restore`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    const body = await getErrorBody(response);

    throw new InstructorAccountApiError(
      body.message ?? `Request failed with status ${response.status}`,
      response.status,
    );
  }

  return (await response.json()) as InstructorAccountRestoreResult;
}

export async function getInstructorDeletionEligibility(
  token: string,
): Promise<InstructorAccountDeletionEligibility> {
  const response = await fetch(
    `${getApiUrl()}/instructors/account/deletion-eligibility`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    },
  );

  if (!response.ok) {
    const body = await getErrorBody(response);

    throw new InstructorAccountApiError(
      body.message ?? `Request failed with status ${response.status}`,
      response.status,
    );
  }

  return (await response.json()) as InstructorAccountDeletionEligibility;
}
