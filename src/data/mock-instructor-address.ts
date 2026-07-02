export type InstructorAddress = {
  line1: string;
  line2: string;
  suburb: string;
  state: string;
  postcode: string;
};

export const MOCK_INSTRUCTOR_ADDRESS: InstructorAddress = {
  line1: '12 Park Road',
  line2: 'Unit 4',
  suburb: 'Brisbane',
  state: 'QLD',
  postcode: '4000',
};

export function formatInstructorAddress(address: InstructorAddress) {
  const line2 = address.line2.trim() ? `, ${address.line2.trim()}` : '';

  return `${address.line1.trim()}${line2}, ${address.suburb.trim()}, ${address.state.trim()} ${address.postcode.trim()}`;
}

export function cloneInstructorAddress(address: InstructorAddress): InstructorAddress {
  return { ...address };
}
