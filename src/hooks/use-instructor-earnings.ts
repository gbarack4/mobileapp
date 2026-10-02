import { useAuth } from "@/lib/auth/auth-provider";
import { useQuery } from "@tanstack/react-query";

import { fetchInstructorEarnings } from "@/services/instructor-earnings";

export const instructorEarningsQueryKey = (
  userId: string | null | undefined,
  weekOffset: number,
) => ["instructor-earnings", userId, weekOffset] as const;

export function useInstructorEarnings(weekOffset: number) {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const { user } = useAuth();

  return useQuery({
    queryKey: instructorEarningsQueryKey(user?.id, weekOffset),
    enabled: isLoaded && isSignedIn && Boolean(user?.id),
    queryFn: async ({ signal }) => {
      const token = await getToken();

      if (!token) {
        throw new Error("Unable to get authentication token.");
      }

      return fetchInstructorEarnings(token, weekOffset, signal);
    },
    staleTime: 30_000,
  });
}
