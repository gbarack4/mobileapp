import { useAuth } from "@clerk/clerk-expo";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getMyProfile,
  updatePersonalInfo,
  UpdatePersonalInfoDto,
  updateVehicle,
  UpdateVehicleDto,
} from "../services/profile";

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

export function useUpdatePersonalInfoMutation() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdatePersonalInfoDto) => {
      const token = await getToken();
      if (!token) throw new Error("No auth token found");
      return updatePersonalInfo(token, data);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
  });
}

export function useUpdateVehicleMutation() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateVehicleDto) => {
      const token = await getToken();
      if (!token) throw new Error("No auth token found");
      return updateVehicle(token, data);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
  });
}
