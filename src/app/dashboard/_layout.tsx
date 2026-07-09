import { RoleGuard } from "@/components/auth/role-guard";
import { Stack } from "expo-router";

export default function DashboardLayout() {
  return (
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
        <Stack.Screen name="account/payment" />
        <Stack.Screen name="account/hub" />
      </Stack>
    </RoleGuard>
  );
}
