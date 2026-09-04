import { useAuth } from "@clerk/clerk-expo";
import { useQuery } from "@tanstack/react-query";

import { fetchInstructorBookings } from "@/services/instructor-bookings";
import type { InstructorBookingCounts } from "@/types/instructor-bookings";

const EMPTY_COUNTS: InstructorBookingCounts = {
  upcoming: 0,
  completed: 0,
  cancelled: 0,
};

export const instructorBookingsQueryKey = (userId: string | null | undefined) =>
  ["instructor-bookings", userId] as const;

export function useInstructorBookings() {
  const { getToken, isLoaded, isSignedIn, userId } = useAuth();

  const enabled = Boolean(isLoaded && isSignedIn && userId);

  const query = useQuery({
    queryKey: instructorBookingsQueryKey(userId),
    enabled,
    staleTime: 60_000,
    gcTime: 5 * 60_000,
    retry: false,
    refetchOnMount: false,
    refetchOnWindowFocus: true,
    queryFn: async ({ signal }) => {
      const token = await getToken();

      if (!token) {
        throw new Error("Please sign in to view your bookings.");
      }

      return fetchInstructorBookings(token, signal);
    },
  });

  let error = query.error?.message ?? "";

  if (isLoaded && !isSignedIn) {
    error = "Please sign in to view your bookings.";
  }

  return {
    bookings: enabled && !error ? (query.data?.bookings ?? []) : [],
    counts:
      enabled && !error ? (query.data?.counts ?? EMPTY_COUNTS) : EMPTY_COUNTS,
    loading: !isLoaded || (enabled && query.isPending),
    error,
    refetch: query.refetch,
  };
}
