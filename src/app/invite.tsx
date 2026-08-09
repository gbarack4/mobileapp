import { useRouter } from "expo-router";

import { SchoolInviteAcceptScreen } from "@/components/invite/school-invite-accept-screen";

/**
 * Preview route for the school invite UI.
 * Not linked from the main app flow.
 */
export default function InvitePreviewScreen() {
  const router = useRouter();

  return (
    <SchoolInviteAcceptScreen
      onAccept={() => {
        console.log("invite accepted");
      }}
      onDecline={() => {
        console.log("invite declined");
      }}
      onClose={() => {
        if (router.canGoBack()) {
          router.back();
          return;
        }
        router.replace("/dashboard");
      }}
    />
  );
}
