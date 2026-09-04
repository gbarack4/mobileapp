export type InstructorBookingTab = "upcoming" | "completed" | "cancelled";

export type InstructorBookingStatus = "confirmed" | "completed" | "cancelled";

export type InstructorBookingSource = "credit" | "package";

export type InstructorBookingCounts = {
  upcoming: number;
  completed: number;
  cancelled: number;
};

export type InstructorBookingStudent = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
};

export type InstructorBookingSchool = {
  id: string;
  name: string;
  logoUrl: string | null;
  timezone: string;
};

export type InstructorBooking = {
  id: string;
  startDatetime: string;
  endDatetime: string;

  status: InstructorBookingStatus;
  bookingSource: InstructorBookingSource;

  pickupAddress: string | null;
  pickupSuburb: string | null;
  pickupPostcode: string | null;

  notes: string | null;

  cancelledAt: string | null;
  cancelledByUserId: string | null;

  student: InstructorBookingStudent;
  school: InstructorBookingSchool;
};

export type InstructorBookingsResponse = {
  counts: InstructorBookingCounts;
  bookings: InstructorBooking[];
};
