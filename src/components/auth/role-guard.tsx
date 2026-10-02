import { DEV_BYPASS_AUTH } from "@/constants/dev";
import { useAuth } from "@/lib/auth/auth-provider";
import { useEffect, useState, type ReactNode } from "react";
import { AuthStatus } from "./auth-status";
import { InstructorAccessDenied } from "./instructor-access-denied";

type Access = { userId: string; status: "allowed" | "denied" | "error" } | null;
export function RoleGuard({ children }: Readonly<{ children: ReactNode }>) {
  const { isLoaded, isSignedIn, userId, getToken, signOut } = useAuth();
  const [access, setAccess] = useState<Access>(null);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (DEV_BYPASS_AUTH || !isLoaded || !isSignedIn || !userId) return;
    const controller = new AbortController();
    setAccess(null);
    void (async () => {
      try {
        const token = await getToken();
        if (!token || controller.signal.aborted) return;
        const apiUrl = process.env.EXPO_PUBLIC_API_URL?.replace(/\/+$/, "");
        if (!apiUrl) throw new Error("API URL is not configured");
        const response = await fetch(
          `${apiUrl}/auth/verify-access?app=instructor_app`,
          {
            headers: { Authorization: `Bearer ${token}` },
            signal: controller.signal,
          },
        );
        if (controller.signal.aborted) return;
        setAccess({
          userId,
          status: response.ok
            ? "allowed"
            : response.status === 403
              ? "denied"
              : "error",
        });
      } catch {
        if (!controller.signal.aborted) setAccess({ userId, status: "error" });
      }
    })();
    return () => controller.abort();
  }, [isLoaded, isSignedIn, userId, getToken, attempt]);
  if (DEV_BYPASS_AUTH) return <>{children}</>;
  if (!isLoaded || !isSignedIn || !access || access.userId !== userId)
    return <AuthStatus />;
  if (access.status === "denied") return <InstructorAccessDenied />;
  if (access.status === "error")
    return (
      <AuthStatus
        message="Unable to check instructor access."
        onRetry={() => setAttempt((value) => value + 1)}
        onSignOut={() => {
          void signOut();
        }}
      />
    );
  return <>{children}</>;
}
