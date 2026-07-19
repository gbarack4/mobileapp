import { useAuth } from "@clerk/clerk-expo";
import { useQuery } from "@tanstack/react-query";
import { getMyProfile } from "../services/profile";

export function useProfileQuery() {
  const { getToken } = useAuth();

  return useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const token = await getToken();
      if (!token) {
        throw new Error("No auth token found");
      }
      return getMyProfile(token);
    },
  });
}
