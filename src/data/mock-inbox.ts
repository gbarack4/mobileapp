import type {
  ChatBubble,
  InboxMessage,
} from "../types/inbox";

export const MOCK_MESSAGES: InboxMessage[] = [
  {
    id: "msg-1",
    senderName: "Emma Wilson",
    senderInitials: "EW",
    avatarUrl: "https://i.pravatar.cc/150?img=47",
    preview: "Hi, can we move tomorrow’s lesson to 3pm?",
    timeLabel: "10:24 AM",
    unread: true,
  },
  {
    id: "msg-2",
    senderName: "DriveRight Academy",
    senderInitials: "DA",
    avatarUrl:
      "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=150&h=150&fit=crop",
    preview: "New student assignment for next week — please confirm.",
    timeLabel: "Yesterday",
    unread: true,
    fromSchool: true,
  },
  {
    id: "msg-3",
    senderName: "Noah Patel",
    senderInitials: "NP",
    avatarUrl: "https://i.pravatar.cc/150?img=12",
    preview: "Thanks for the lesson today. See you Thursday!",
    timeLabel: "Mon",
    unread: false,
  },
  {
    id: "msg-4",
    senderName: "Olivia Chen",
    senderInitials: "OC",
    avatarUrl: "https://i.pravatar.cc/150?img=32",
    preview: "I’m running 5 minutes late — still ok?",
    timeLabel: "Sun",
    unread: false,
  },
  {
    id: "msg-5",
    senderName: "Metro Driving School",
    senderInitials: "MD",
    avatarUrl:
      "https://images.unsplash.com/photo-1497366216548-37526070297c?w=150&h=150&fit=crop",
    preview: "Reminder: insurance docs due by Friday.",
    timeLabel: "Fri",
    unread: false,
    fromSchool: true,
  },
];

export const MOCK_THREADS: Record<string, ChatBubble[]> = {
  "msg-1": [
    {
      id: "msg-1-1",
      text: "Hi Emma — just confirming we’re still on for tomorrow.",
      timeLabel: "Yesterday",
      fromMe: true,
    },
    {
      id: "msg-1-2",
      text: "Yes! Looking forward to it. Same pickup spot?",
      timeLabel: "Yesterday",
      fromMe: false,
    },
    {
      id: "msg-1-3",
      text: "Yep — outside your place at 10am. We’ll focus on roundabouts.",
      timeLabel: "Yesterday",
      fromMe: true,
    },
    {
      id: "msg-1-4",
      text: "Perfect. I’ve been practising the approach angles you showed me.",
      timeLabel: "Yesterday",
      fromMe: false,
    },
    {
      id: "msg-1-5",
      text: "Great work. Bring your learner logbook tomorrow too.",
      timeLabel: "8:15 AM",
      fromMe: true,
    },
    {
      id: "msg-1-6",
      text: "Hi Emma — looking forward to tomorrow’s lesson.",
      timeLabel: "9:40 AM",
      fromMe: true,
    },
    {
      id: "msg-1-7",
      text: "Hi, can we move tomorrow’s lesson to 3pm?",
      timeLabel: "10:24 AM",
      fromMe: false,
    },
    {
      id: "msg-1-8",
      text: "I have a school thing in the morning that might run over.",
      timeLabel: "10:25 AM",
      fromMe: false,
    },
    {
      id: "msg-1-9",
      text: "3pm works for me. I’ll update the booking now.",
      timeLabel: "10:31 AM",
      fromMe: true,
    },
    {
      id: "msg-1-10",
      text: "Thank you so much! See you then 😊",
      timeLabel: "10:32 AM",
      fromMe: false,
    },
  ],
  "msg-2": [
    {
      id: "msg-2-1",
      text: "Hi — quick update from DriveRight Academy.",
      timeLabel: "Yesterday",
      fromMe: false,
    },
    {
      id: "msg-2-2",
      text: "New student assignment for next week — please confirm.",
      timeLabel: "Yesterday",
      fromMe: false,
    },
    {
      id: "msg-2-3",
      text: "Student name is Jordan Lee, automatic transmission, Wed & Fri mornings.",
      timeLabel: "Yesterday",
      fromMe: false,
    },
    {
      id: "msg-2-4",
      text: "Happy to take them. Please send the contact details.",
      timeLabel: "Yesterday",
      fromMe: true,
    },
    {
      id: "msg-2-5",
      text: "Sent to your email. Thanks for confirming.",
      timeLabel: "Yesterday",
      fromMe: false,
    },
  ],
  "msg-3": [
    {
      id: "msg-3-1",
      text: "Hey Noah — pickup in 10 minutes.",
      timeLabel: "Mon",
      fromMe: true,
    },
    {
      id: "msg-3-2",
      text: "I’m ready out front!",
      timeLabel: "Mon",
      fromMe: false,
    },
    {
      id: "msg-3-3",
      text: "Great progress on reverse parking today.",
      timeLabel: "Mon",
      fromMe: true,
    },
    {
      id: "msg-3-4",
      text: "Thanks for the lesson today. See you Thursday!",
      timeLabel: "Mon",
      fromMe: false,
    },
    {
      id: "msg-3-5",
      text: "Sounds good — we’ll do hill starts next.",
      timeLabel: "Mon",
      fromMe: true,
    },
  ],
  "msg-4": [
    {
      id: "msg-4-1",
      text: "On my way to the lesson now.",
      timeLabel: "Sun",
      fromMe: true,
    },
    {
      id: "msg-4-2",
      text: "I’m running 5 minutes late — still ok?",
      timeLabel: "Sun",
      fromMe: false,
    },
    {
      id: "msg-4-3",
      text: "No worries, I’ll wait at the pickup point.",
      timeLabel: "Sun",
      fromMe: true,
    },
    {
      id: "msg-4-4",
      text: "Thanks! Just parking now.",
      timeLabel: "Sun",
      fromMe: false,
    },
  ],
  "msg-5": [
    {
      id: "msg-5-1",
      text: "Hi — compliance reminder from Metro Driving School.",
      timeLabel: "Fri",
      fromMe: false,
    },
    {
      id: "msg-5-2",
      text: "Reminder: insurance docs due by Friday.",
      timeLabel: "Fri",
      fromMe: false,
    },
    {
      id: "msg-5-3",
      text: "I’ll upload them this afternoon.",
      timeLabel: "Fri",
      fromMe: true,
    },
    {
      id: "msg-5-4",
      text: "Great, thanks. We’ll confirm once reviewed.",
      timeLabel: "Fri",
      fromMe: false,
    },
  ],
};

export function getInboxMessageById(id: string) {
  return MOCK_MESSAGES.find((message) => message.id === id) ?? null;
}

export function getThreadById(id: string): ChatBubble[] {
  return MOCK_THREADS[id] ?? [];
}

export const UNREAD_MESSAGE_COUNT = MOCK_MESSAGES.filter(
  (message) => message.unread,
).length;

export const UNREAD_INBOX_COUNT = UNREAD_MESSAGE_COUNT;
