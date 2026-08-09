import { useLocalSearchParams } from "expo-router";

import { MessageThreadScreen } from "../../../components/inbox/message-thread-screen";
import { goBackOr } from "../../../utils/navigation";

export default function InboxMessageRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <MessageThreadScreen
      messageId={id ?? ""}
      onClose={() => goBackOr("/dashboard")}
    />
  );
}
