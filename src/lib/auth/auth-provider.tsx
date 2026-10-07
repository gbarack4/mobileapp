import { useRouter } from "expo-router";
import { SessionExpiredDialog } from "@/components/auth/session-expired-dialog";
import { SessionActivityGuard } from "./session-activity-guard";
import { resetSuprSendUser } from "../../services/suprsend";
import { useQueryClient } from "@tanstack/react-query";
import { clearLegacySession } from "../../services/session";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";

import {
  type AuthUser,
  getCognitoAccessToken,
  getCognitoIdToken,
  getSessionSnapshot,
  getSessionExpiredSnapshot,
  getValidCognitoSession,
  setCognitoSession,
  signOutCognitoSession,
  subscribeToSession,
} from "./session-manager";

type InitializationState =
  | { status: "loading"; error: null }
  | { status: "ready"; error: null }
  | { status: "error"; error: Error };

type AuthContextValue = Readonly<{
  user: AuthUser | null;
  userId: string | null;
  signOutError: Error | null;
  isLoaded: boolean;
  isSignedIn: boolean;
  initializationError: Error | null;
  retryInitialization: () => Promise<void>;
  getToken: typeof getCognitoAccessToken;
  getIdToken: typeof getCognitoIdToken;
  completeSignIn: typeof setCognitoSession;
  signOut: () => Promise<void>;
}>;

type AuthProviderProps = Readonly<{
  children: ReactNode;
}>;

const AuthContext = createContext<AuthContextValue | null>(null);

function getServerExpirySnapshot(): boolean {
  return false;
}

function getServerSessionSnapshot(): null {
  return null;
}

function normalizeError(error: unknown): Error {
  if (error instanceof Error) {
    return error;
  }

  return new Error("Failed to restore the authentication session");
}

export function AuthProvider({ children }: AuthProviderProps) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const signOutInFlight = useRef(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState<Error | null>(null);
  const session = useSyncExternalStore(
    subscribeToSession,
    getSessionSnapshot,
    getServerSessionSnapshot,
  );

  const sessionExpired = useSyncExternalStore(
    subscribeToSession,
    getSessionExpiredSnapshot,
    getServerExpirySnapshot,
  );
  const reportSessionError = useCallback(() => {
    setSignOutError(
      new Error("Session cleanup could not finish. Please retry signing in."),
    );
  }, []);

  const [initialization, setInitialization] = useState<InitializationState>({
    status: "loading",
    error: null,
  });

  const mountedRef = useRef(false);
  const initializationVersionRef = useRef(0);

  const retryInitialization = useCallback(async (): Promise<void> => {
    if (!mountedRef.current) {
      return;
    }

    const version = ++initializationVersionRef.current;

    setInitialization({
      status: "loading",
      error: null,
    });

    try {
      await getValidCognitoSession();

      if (!mountedRef.current || version !== initializationVersionRef.current) {
        return;
      }

      setInitialization({
        status: "ready",
        error: null,
      });
    } catch (error: unknown) {
      if (!mountedRef.current || version !== initializationVersionRef.current) {
        return;
      }

      setInitialization({
        status: "error",
        error: normalizeError(error),
      });
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;

    void retryInitialization();

    return () => {
      mountedRef.current = false;
      initializationVersionRef.current += 1;
    };
  }, [retryInitialization]);

  useEffect(() => {
    try {
      clearLegacySession();
    } catch {
      /* Old credentials are never read. */
    }
    let previousUserId = getSessionSnapshot()?.user.id;
    return subscribeToSession(() => {
      const nextUserId = getSessionSnapshot()?.user.id;
      if (nextUserId !== previousUserId) {
        void resetSuprSendUser().catch(() => {
          /* Notifications retry on next identify. */
        });
        void queryClient.cancelQueries();
        queryClient.clear();
        previousUserId = nextUserId;
      }
    });
  }, [queryClient]);

  const signOut = useCallback(async (): Promise<void> => {
    if (signOutInFlight.current) return;
    signOutInFlight.current = true;
    setIsSigningOut(true);
    ++initializationVersionRef.current;
    setSignOutError(null);
    setInitialization({ status: "ready", error: null });
    try {
      await signOutCognitoSession();
    } catch {
      setSignOutError(
        new Error(
          "Sign-out could not finish. Please retry before closing the app.",
        ),
      );
    } finally {
      signOutInFlight.current = false;
      setIsSigningOut(false);
    }
  }, []);

  const returnToSignIn = useCallback(async () => {
    await signOut();
    if (!getSessionExpiredSnapshot()) router.replace("/login");
  }, [router, signOut]);

  const isLoaded = initialization.status === "ready" && !isSigningOut;
  const isSignedIn = isLoaded && session !== null;

  const value = useMemo<AuthContextValue>(
    () => ({
      user: session?.user ?? null,
      userId: session?.user.id ?? null,
      signOutError,
      isLoaded,
      isSignedIn,
      initializationError: initialization.error,
      retryInitialization,
      getToken: getCognitoAccessToken,
      getIdToken: getCognitoIdToken,
      completeSignIn: setCognitoSession,
      signOut,
    }),
    [
      session,
      signOutError,
      signOut,
      isLoaded,
      isSignedIn,
      initialization.error,
      retryInitialization,
    ],
  );

  return (
    <AuthContext.Provider value={value}>
      <SessionActivityGuard enabled={isSignedIn} onError={reportSessionError}>
        {children}
      </SessionActivityGuard>
      <SessionExpiredDialog
        visible={sessionExpired}
        busy={isSigningOut}
        error={signOutError?.message ?? null}
        onSignIn={() => {
          void returnToSignIn();
        }}
      />
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}
