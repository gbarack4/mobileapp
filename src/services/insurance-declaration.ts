import { Platform } from 'react-native';

export type InsuranceDeclaration = {
  hasInsurance: boolean;
  hasDualControls: boolean;
  isQualifiedToTeach: boolean;
  confirmedAt: string | null;
};

export const DEFAULT_INSURANCE_DECLARATION: InsuranceDeclaration = {
  hasInsurance: false,
  hasDualControls: false,
  isQualifiedToTeach: false,
  confirmedAt: null,
};

const STORAGE_KEY = 'ih_insurance_declaration';

type Listener = () => void;

let memoryDeclaration: InsuranceDeclaration | null = null;
const listeners = new Set<Listener>();

function canUseLocalStorage() {
  return Platform.OS === 'web' && typeof localStorage !== 'undefined';
}

function notify() {
  listeners.forEach((listener) => listener());
}

function normalizeDeclaration(parsed: Partial<InsuranceDeclaration>): InsuranceDeclaration {
  return {
    hasInsurance:
      typeof parsed.hasInsurance === 'boolean'
        ? parsed.hasInsurance
        : DEFAULT_INSURANCE_DECLARATION.hasInsurance,
    hasDualControls:
      typeof parsed.hasDualControls === 'boolean'
        ? parsed.hasDualControls
        : DEFAULT_INSURANCE_DECLARATION.hasDualControls,
    isQualifiedToTeach:
      typeof parsed.isQualifiedToTeach === 'boolean'
        ? parsed.isQualifiedToTeach
        : DEFAULT_INSURANCE_DECLARATION.isQualifiedToTeach,
    confirmedAt:
      typeof parsed.confirmedAt === 'string' || parsed.confirmedAt === null
        ? parsed.confirmedAt
        : DEFAULT_INSURANCE_DECLARATION.confirmedAt,
  };
}

export function getInsuranceDeclaration(): InsuranceDeclaration {
  if (memoryDeclaration) {
    return { ...memoryDeclaration };
  }

  if (canUseLocalStorage()) {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        memoryDeclaration = normalizeDeclaration(
          JSON.parse(raw) as Partial<InsuranceDeclaration>,
        );
        return { ...memoryDeclaration };
      }
    } catch {
      // fall through to defaults
    }
  }

  memoryDeclaration = { ...DEFAULT_INSURANCE_DECLARATION };
  return { ...memoryDeclaration };
}

export function setInsuranceDeclaration(next: Partial<InsuranceDeclaration>) {
  const current = getInsuranceDeclaration();
  memoryDeclaration = normalizeDeclaration({
    ...current,
    ...next,
  });

  if (canUseLocalStorage()) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(memoryDeclaration));
  }

  notify();
}

export function isInsuranceDeclarationComplete(declaration: InsuranceDeclaration) {
  return (
    declaration.hasInsurance &&
    declaration.hasDualControls &&
    declaration.isQualifiedToTeach &&
    Boolean(declaration.confirmedAt)
  );
}

export function subscribeInsuranceDeclaration(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
