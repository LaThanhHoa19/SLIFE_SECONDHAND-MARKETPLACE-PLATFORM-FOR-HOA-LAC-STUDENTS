/**
 * API đơn vị hành chính Việt Nam (public, không cần key).
 * Source: https://provinces.open-api.vn
 */

const BASE = 'https://provinces.open-api.vn';

async function get(path) {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) throw new Error(`vnAddressApi: ${res.status} ${path}`);
  return res.json();
}

/** Danh sách 63 tỉnh/thành phố */
export const getProvinces = () => get('/api/p/');

/** Huyện/quận trong tỉnh (depth=2 trả về districts) */
export const getDistricts = (provinceCode) => get(`/api/p/${provinceCode}?depth=2`);

/** Xã/phường trong huyện (depth=2 trả về wards) */
export const getWards = (districtCode) => get(`/api/d/${districtCode}?depth=2`);
