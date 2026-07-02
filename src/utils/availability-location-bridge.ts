import { router } from 'expo-router';

type WorkLocationBridge = {
  initialLocations: string[];
  onConfirm: (locations: string[]) => void;
};

let workLocationBridge: WorkLocationBridge | null = null;

export function openWorkLocationPicker(
  initialLocations: string[],
  onConfirm: (locations: string[]) => void,
) {
  workLocationBridge = { initialLocations, onConfirm };
  router.push('/dashboard/account/work-locations');
}

export function getWorkLocationBridge() {
  return workLocationBridge;
}

export function clearWorkLocationBridge() {
  workLocationBridge = null;
}
