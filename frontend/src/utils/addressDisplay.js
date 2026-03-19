/**
 * Ghép địa điểm từ bản đồ (locationName) + ghi chú chi tiết (addressText) giống backend AddressFormat.
 */
export function formatPickupDisplayLine(locationName, addressText) {
  const loc = (locationName ?? '').trim();
  const det = (addressText ?? '').trim();
  if (loc && det) return `${loc} — ${det}`;
  return loc || det || '';
}
