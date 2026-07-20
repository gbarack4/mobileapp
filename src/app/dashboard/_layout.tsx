import { RoleGuard } from "@/components/auth/role-guard";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 2,
    },
  },
});

export default function DashboardLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <RoleGuard>
        <Stack
          screenOptions={{
            headerShown: false,
            animation: "slide_from_right",
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="calendar" />
          <Stack.Screen name="schools-map" />
          <Stack.Screen name="school/[id]" />
          <Stack.Screen name="lesson/[id]" />
          <Stack.Screen name="account/vehicles" />
          <Stack.Screen name="account/documents" />
          <Stack.Screen name="account/edit-address" />
          <Stack.Screen name="account/work-locations" />
          <Stack.Screen name="account/availability" />
          <Stack.Screen name="account/calendar-settings" />
          <Stack.Screen name="account/app-settings" />
          <Stack.Screen name="account/about" />
          <Stack.Screen name="account/insurance" />
          <Stack.Screen name="account/payment" />
          <Stack.Screen name="account/hub" />
        </Stack>
      </RoleGuard>
    </QueryClientProvider>
  );
}
