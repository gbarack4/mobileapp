export type InboxMessage = {
  id: string;
  senderName: string;
  senderInitials: string;
  avatarUrl: string;
  preview: string;
  timeLabel: string;
  unread: boolean;
  fromSchool?: boolean;
};

export type ChatBubble = {
  id: string;
  text: string;
  timeLabel: string;
  fromMe: boolean;
};

export type InboxNotificationType =
  | "booking"
  | "payment"
  | "school"
  | "reminder"
  | "system";

export type InboxNotification = {
  id: string;
  type: InboxNotificationType;
  title: string;
  body: string;
  timeLabel: string;
  unread: boolean;
};
