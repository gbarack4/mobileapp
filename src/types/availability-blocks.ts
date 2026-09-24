export type AvailabilityBlock = {
  id: string;
  startDate: string;
  endDate: string;
  reason: string | null;
};

export type AvailabilityDateRangePayload = {
  startDate: string;
  endDate: string;
};

export type AvailabilityUnblockResponse = {
  success: boolean;
};
