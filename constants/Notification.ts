// constants/Notification.ts

export type NotificationT = {
  id: string;
  title: string;
  body: string;
  datetime: string; // ISO
  type: "product" | "services" | "bookings" | "pay";
  unread?: boolean;
};

/* ---------------- date helpers ---------------- */

// Local-date ISO at specific hour:minute (avoids timezone surprises)
const atLocalTime = (d: Date, h = 11, m = 31) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate(), h, m, 0).toISOString();

const TODAY = new Date();
const YESTERDAY = new Date(TODAY);
YESTERDAY.setDate(TODAY.getDate() - 1);

const daysAgo = (n: number) => {
  const d = new Date(TODAY);
  d.setDate(TODAY.getDate() - n);
  return d;
};

/* ---------------- content helpers ---------------- */

type Kind = "product" | "services" | "bookings" | "pay";

function titleFor(kind: Kind, i: number) {
  switch (kind) {
    case "product":
      return [
        "New product launched",
        "Limited edition drop",
        "Price drop alert",
        "Back in stock",
        "Flash sale is live",
        "Bundle offer unlocked",
        "Early access for you",
      ][i % 7];
    case "services":
      return [
        "Service request received",
        "Service scheduled",
        "Service rescheduled",
        "Service completed",
        "Feedback requested",
        "Your ticket was updated",
        "Technician assigned",
      ][i % 7];
    case "bookings":
      return [
        "Booking confirmed",
        "Booking reminder",
        "Booking rescheduled",
        "Event booked successfully",
        "Check-in instructions",
        "Review your experience",
        "Venue details updated",
      ][i % 7];
    case "pay":
      return [
        "Payment processed",
        "Refund issued",
        "Invoice generated",
        "Payment reminder",
        "Payment failed",
        "New invoice available",
        "Payment verified",
      ][i % 7];
  }
}

function bodyFor(kind: Kind) {
  switch (kind) {
    case "product":
      return "Check out the new limited edition";
    case "services":
      return "We’ll contact you soon with the next steps";
    case "bookings":
      return "Thanks! Your booking is confirmed";
    case "pay":
      return "Your payment details are updated";
  }
}

/* ---------------- generator ---------------- */

// 4 today, 5 yesterday, 6 older (total 15) per kind.
// The first `unreadTarget` items are marked unread (today/yesterday first).
function generateForKind(kind: Kind, unreadTarget: number) {
  const out: NotificationT[] = [];

  // Today (4)
  for (let i = 0; i < 4; i++) {
    const dt = atLocalTime(TODAY, 10 + i, 12 + i * 5);
    out.push({
      id: `${kind}-today-${i + 1}`,
      title: titleFor(kind, i),
      body: bodyFor(kind),
      datetime: dt,
      type: kind,
    });
  }

  // Yesterday (5)
  for (let i = 0; i < 5; i++) {
    const dt = atLocalTime(YESTERDAY, 9 + i, 6 + i * 4);
    out.push({
      id: `${kind}-yest-${i + 1}`,
      title: titleFor(kind, 4 + i),
      body: bodyFor(kind),
      datetime: dt,
      type: kind,
    });
  }

  // Older (6): 2..7 days ago
  for (let i = 0; i < 6; i++) {
    const d = daysAgo(2 + i);
    const dt = atLocalTime(d, 8 + (i % 5), 10 + ((i * 7) % 50));
    out.push({
      id: `${kind}-old-${i + 1}`,
      title: titleFor(kind, 9 + i),
      body: bodyFor(kind),
      datetime: dt,
      type: kind,
    });
  }

  // Mark first `unreadTarget` as unread
  for (let i = 0; i < out.length && i < unreadTarget; i++) {
    out[i].unread = true;
  }

  return out;
}

/* ---------------- exported data ---------------- */

// ✅ Requested unread targets
const PRODUCT = generateForKind("product", 8);
const SERVICES = generateForKind("services", 4);
const BOOKINGS = generateForKind("bookings", 6);
const PAY = generateForKind("pay", 10);

export const SAMPLE_NOTIFICATIONS: NotificationT[] = [
  ...PRODUCT,
  ...SERVICES,
  ...BOOKINGS,
  ...PAY,
];
