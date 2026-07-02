import type { TransmissionType, YesNo } from '../types/onboarding';

export type InstructorVehicle = {
  make: string;
  model: string;
  year: string;
  registration: string;
  transmission: TransmissionType;
  dualControl: YesNo;
};

export const MOCK_INSTRUCTOR_VEHICLE: InstructorVehicle = {
  make: 'Ford',
  model: 'Focus',
  year: '2021',
  registration: 'AB21 XYZ',
  transmission: 'automatic',
  dualControl: 'yes',
};

export function formatVehicleSummary(vehicle: InstructorVehicle) {
  return `${vehicle.make} ${vehicle.model} · ${vehicle.registration}`;
}

export function cloneInstructorVehicle(vehicle: InstructorVehicle): InstructorVehicle {
  return { ...vehicle };
}

export const VEHICLE_TRANSMISSION_OPTIONS: { value: TransmissionType; label: string }[] = [
  { value: 'automatic', label: 'Automatic' },
  { value: 'manual', label: 'Manual' },
  { value: 'both', label: 'Both' },
];

export const VEHICLE_DUAL_CONTROL_OPTIONS: { value: YesNo; label: string }[] = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
];
