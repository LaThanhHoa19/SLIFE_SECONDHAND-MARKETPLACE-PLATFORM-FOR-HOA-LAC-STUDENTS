/** Origin chính thức cho tile/style Vietmap — tránh resolve nhầm theo host S3/localhost. */
export const VIETMAP_MAPS_ORIGIN = 'https://maps.vietmap.vn';

export function buildVietmapStyleUrl(apiKey) {
  return `${VIETMAP_MAPS_ORIGIN}/maps/styles/tm/style.json?apikey=${apiKey}`;
}

/**
 * Ép request sprite/tile/glyph (và style nếu lib trả path tương đối) về maps.vietmap.vn.
 */
export function vietmapTransformRequest(url) {
  if (typeof url !== 'string') return { url };
  if (url.startsWith('/')) {
    return { url: `${VIETMAP_MAPS_ORIGIN}${url}` };
  }
  try {
    const parsed = new URL(url);
    if (parsed.pathname.startsWith('/maps/') && parsed.hostname !== 'maps.vietmap.vn') {
      return { url: `${VIETMAP_MAPS_ORIGIN}${parsed.pathname}${parsed.search}` };
    }
  } catch {
    /* ignore */
  }
  return { url };
}
