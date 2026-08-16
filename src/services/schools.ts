import type { School, SchoolDetail } from "../types/school";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL;

export class SchoolsApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
  ) {
    super(message);
    this.name = "SchoolsApiError";
  }
}

type GetTokenFn = () => Promise<string | null>;

interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
}

async function request<T>(
  path: string,
  options: RequestOptions = {},
  getToken?: GetTokenFn,
): Promise<T> {
  if (!API_BASE_URL) {
    throw new SchoolsApiError("EXPO_PUBLIC_API_URL is not defined", 0);
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (getToken) {
    const token = await getToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method || "GET",
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
    cache: "no-store",
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);

    let message = "Request failed.";

    if (typeof body?.message === "string") {
      message = body.message;
    } else if (Array.isArray(body?.message)) {
      message = body.message.join(", ");
    }

    throw new SchoolsApiError(message, response.status);
  }

  const text = await response.text();
  return text ? (JSON.parse(text) as T) : ({} as T);
}

export interface SearchSchoolsParams {
  q?: string;
  originLat?: number;
  originLng?: number;
  radiusKm?: number;
}

export async function searchSchools(
  params: SearchSchoolsParams | string = "",
  getToken?: GetTokenFn,
): Promise<School[]> {
  const isString = typeof params === "string";
  const q = isString ? params : params.q || "";
  const trimmed = q.trim();

  const searchParams = new URLSearchParams();
  if (trimmed) searchParams.append("q", trimmed);

  if (!isString) {
    if (params.originLat !== undefined)
      searchParams.append("originLat", params.originLat.toString());
    if (params.originLng !== undefined)
      searchParams.append("originLng", params.originLng.toString());
    if (params.radiusKm !== undefined)
      searchParams.append("radiusKm", params.radiusKm.toString());
  }

  const queryString = searchParams.toString();
  const path = queryString
    ? `/schools/search?${queryString}`
    : "/schools/search";
  return request<School[]>(path, {}, getToken);
}

export async function getSchool(
  id: string,
  getToken?: GetTokenFn,
): Promise<SchoolDetail> {
  return request<SchoolDetail>(`/schools/${id}`, {}, getToken);
}

export async function requestSchoolJoin(
  schoolId: string,
  getToken?: GetTokenFn,
): Promise<void> {
  return request<void>(
    `/instructor/requests`,
    {
      method: "POST",
      body: { schoolId },
    },
    getToken,
  );
}

export async function cancelSchoolRequest(
  schoolId: string,
  getToken?: GetTokenFn,
): Promise<void> {
  return request<void>(
    `/instructor/requests/${schoolId}`,
    {
      method: "DELETE",
    },
    getToken,
  );
}

export async function leaveSchool(
  schoolId: string,
  getToken?: GetTokenFn,
): Promise<void> {
  return request<void>(
    `/instructor/schools/${schoolId}/leave`,
    {
      method: "DELETE",
    },
    getToken,
  );
}

export async function toggleSchoolPause(
  schoolId: string,
  pause: boolean,
  getToken?: GetTokenFn,
): Promise<void> {
  const action = pause ? "pause" : "resume";
  return request<void>(
    `/instructor/schools/${schoolId}/${action}`,
    {
      method: "PATCH",
    },
    getToken,
  );
}

export async function getJoinedSchools(
  q: string = "",
  getToken?: GetTokenFn,
): Promise<School[]> {
  const searchParams = new URLSearchParams();
  if (q.trim()) searchParams.append("q", q.trim());

  const queryString = searchParams.toString();
  const path = queryString
    ? `/schools/active?${queryString}`
    : "/schools/active";

  return request<School[]>(path, {}, getToken);
}
