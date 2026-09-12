export function formatAddressWithoutCountry(address?: string | null): string {
  if (!address) {
    return "";
  }

  return address.replace(/,\s*Australia\s*$/i, "").trim();
}
