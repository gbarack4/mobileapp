export function formatAddressWithoutCountry(address: string): string {
  return address.replace(/,\s*Australia\s*$/i, "").trim();
}
