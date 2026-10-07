import {
  useGlobalSearchParams,
  useLocalSearchParams,
  usePathname,
} from "expo-router";

import { MessageThreadScreen } from "../../../components/inbox/message-thread-screen";
import { goBackOr, routeParamId } from "../../../utils/navigation";

export default function InboxMessageRoute() {
  const { id } = useLocalSearchParams<{ id: string | string[] }>();
  const globalParams = useGlobalSearchParams<{ id: string | string[] }>();
  const pathname = usePathname();

  return (
    <MessageThreadScreen
      messageId={routeParamId(id, globalParams.id, pathname, "inbox")}
      onClose={() => goBackOr("/dashboard")}
    />
  );
}
