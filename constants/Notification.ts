// constants/Notification.ts

export type NotificationT = {
  id: string;
  title: string;
  body: string;
  datetime: string; // ISO or simple date string
  type: "product" | "services" | "bookings" | "pay";
  unread?: boolean;
};

export const SAMPLE_NOTIFICATIONS: NotificationT[] = [
  {
    id: "n1",
    title: "Event Booked Successfully",
    body: "Lorem ipsum dolor sit amet...",
    datetime: "2025-10-25T11:31:00Z",
    type: "bookings",
    unread: true,
  },
  {
    id: "n2",
    title: "3 more days until WJNC #9 starts!",
    body: "Reminder for your upcoming event",
    datetime: "2024-10-15T09:30:00Z",
    type: "bookings",
  },
  {
    id: "n3",
    title: "New product launched",
    body: "Check out the new limited edition",
    datetime: "2025-10-10T09:43:00Z",
    type: "product",
  },
  {
    id: "n4",
    title: "Service Request Received",
    body: "We'll contact you soon",
    datetime: "2024-10-09T10:10:00Z",
    type: "services",
  },
  {
    id: "n5",
    title: "Payment processed",
    body: "Your payment was successful",
    datetime: "2024-10-08T08:00:00Z",
    type: "pay",
  },
  {
    id: "n6",
    title: "Event Booked Successfully",
    body: "Lorem ipsum dolor sit amet...",
    datetime: "2024-10-25T11:31:00Z",
    type: "bookings",
    unread: true,
  },
  {
    id: "n7",
    title: "3 more days until WJNC #9 starts!",
    body: "Reminder for your upcoming event",
    datetime: "2024-10-15T09:30:00Z",
    type: "bookings",
  },
  {
    id: "n8",
    title: "Iphone 17 launched",
    body: "Check out the new limited edition",
    datetime: "2024-10-10T09:43:00Z",
    type: "product",
  },
  {
    id: "n9",
    title: "Service Request Received",
    body: "We'll contact you soon",
    datetime: "2024-10-09T10:10:00Z",
    type: "services",
  },
  {
    id: "n10",
    title: "Payment processed",
    body: "Your payment was successful",
    datetime: "2024-10-08T08:00:00Z",
    type: "pay",
  },
];
