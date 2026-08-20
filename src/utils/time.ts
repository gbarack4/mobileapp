import { DayOfWeek } from "@/data/mock-availability";

export function convertTo24Hour(time12h: string): string {
  const [time, modifier] = time12h.split(" ");
  let [hours, minutes] = time.split(":");

  if (hours === "12") {
    hours = "00";
  }
  if (modifier?.toLowerCase() === "pm") {
    hours = String(Number.parseInt(hours, 10) + 12);
  }

  return `${hours.padStart(2, "0")}:${minutes}`;
}

export function addMinutesToTime(
  time24h: string,
  minutesToAdd: number,
): string {
  const [hours, minutes] = time24h.split(":").map(Number);
  const date = new Date();
  date.setHours(hours, minutes + minutesToAdd, 0, 0);

  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

export function formatTo12h(time24: string): string {
  const [hStr, mStr] = time24.split(":");
  let h = Number.parseInt(hStr, 10);
  const m = mStr || "00";
  const ampm = h >= 12 ? "pm" : "am";
  h = h % 12;
  h = h || 12;
  return `${h}:${m} ${ampm}`;
}

export const numberToDayMap: Record<number, DayOfWeek> = {
  0: "sunday",
  1: "monday",
  2: "tuesday",
  3: "wednesday",
  4: "thursday",
  5: "friday",
  6: "saturday",
};
