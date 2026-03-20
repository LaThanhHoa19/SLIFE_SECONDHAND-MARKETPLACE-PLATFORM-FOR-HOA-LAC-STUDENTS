import { useEffect, useRef, useState } from 'react';
import { getGeoClientConfig } from '../../api/geoApi';

const MAP_DEFAULT_ZOOM = 15;
const VIETMAP_CDN_JS = 'https://unpkg.com/@vietmap/vietmap-gl-js@6.0.1/dist/vietmap-gl.js';
const VIETMAP_CDN_CSS = 'https://unpkg.com/@vietmap/vietmap-gl-js@6.0.1/dist/vietmap-gl.css';

function buildGoogleMapsDirectionsUrl(lat, lng) {
  if (lat == null || lng == null) return null;
  const latNum = Number(lat);
  const lngNum = Number(lng);
  if (!Number.isFinite(latNum) || !Number.isFinite(lngNum)) return null;
  const dest = `${latNum},${lngNum}`;
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(dest)}`;
}

function ensureVietmapCss() {
  if (document.querySelector('link[data-vietmap-css]')) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = VIETMAP_CDN_CSS;
  link.dataset.vietmapCss = 'true';
  document.head.appendChild(link);
}

function loadVietmapScript() {
  return new Promise((resolve) => {
    const existing = document.querySelector('script[data-vietmap-gl]');
    if (existing) {
      if (window.vietmapgl) return resolve(window.vietmapgl);
      existing.addEventListener('load', () => resolve(window.vietmapgl));
      return;
    }
    const script = document.createElement('script');
    script.src = VIETMAP_CDN_JS;
    script.dataset.vietmapGl = 'true';
    script.onload = () => resolve(window.vietmapgl);
    document.body.appendChild(script);
  });
}

/**
 * Xem trước điểm hẹn: Vietmap + nút mở Google Maps.
 */
export default function ListingPickupMapPreview({
  lat,
  lng,
  address,
  vietmapTileKey: propTileKey,
}) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const [mapReady, setMapReady] = useState(false);
  const [vietmapTileKey, setVietmapTileKey] = useState(
    () => (propTileKey || import.meta.env.VITE_VIETMAP_TILE_KEY || '').trim(),
  );

  useEffect(() => {
    if (vietmapTileKey) return;
    let cancelled = false;
    getGeoClientConfig()
      .then((res) => {
        const data = res?.data?.data ?? res?.data;
        const key = typeof data?.tileKey === 'string' ? data.tileKey.trim() : '';
        if (!cancelled && key) setVietmapTileKey(key);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [vietmapTileKey]);

  const gmapsUrl = buildGoogleMapsDirectionsUrl(lat, lng);

  useEffect(() => {
    if (!vietmapTileKey) return;

    const latNum = Number(lat);
    const lngNum = Number(lng);
    if (!Number.isFinite(latNum) || !Number.isFinite(lngNum)) return;

    let cancelled = false;
    const origin = window.location.origin;

    ensureVietmapCss();
    loadVietmapScript().then((vietmapgl) => {
      if (cancelled || !vietmapgl || !containerRef.current) return;
      if (mapRef.current) return;

      // Ensure container has dimensions before initializing
      const container = containerRef.current;
      const rect = container.getBoundingClientRect();
      const hasSize = rect.width > 0 && rect.height > 0;

      const initMap = () => {
        if (cancelled || mapRef.current || !container.getBoundingClientRect().width) return;

        const map = new vietmapgl.Map({
          container,
          style: `${origin}/maps/styles/tm/style.json?apikey=${vietmapTileKey}`,
          center: [lngNum, latNum],
          zoom: MAP_DEFAULT_ZOOM,
          transformRequest: (url) => {
            if (typeof url !== 'string') return { url };
            const prefix = 'https://maps.vietmap.vn';
            if (url.startsWith(prefix + '/')) {
              let rewritten = url.replace(prefix, '');
              if (rewritten.includes('apikey=') && !rewritten.includes(`apikey=${vietmapTileKey}`)) {
                rewritten = rewritten.replace(/apikey=[^&]*/, `apikey=${vietmapTileKey}`);
              }
              return { url: `${origin}${rewritten}` };
            }
            if (url === prefix) return { url: `${origin}/` };
            return { url };
          }
        });

        map.addControl(new vietmapgl.NavigationControl(), 'top-left');

        map.once('load', () => {
          if (cancelled) return;
          try {
            const src = map.getSource('openmaptiles');
            if (src && src.tiles && src.tiles.length > 0) {
              src.tiles = src.tiles.map((t) =>
                t.replace(/apikey=[^&]*/, `apikey=${vietmapTileKey}`)
              );
              map.style.sourceCaches['openmaptiles'].clearTiles();
              map.style.sourceCaches['openmaptiles'].update(map.transform);
            }
          } catch { /* ignore */ }
          setMapReady(true);
          // Force multiple resizes to ensure canvas size is correct
          [0, 100, 300, 600].forEach(delay =>
            setTimeout(() => { try { map.resize(); } catch { /* */ } }, delay)
          );
        });

        new vietmapgl.Marker().setLngLat([lngNum, latNum]).addTo(map);
        mapRef.current = map;
      };

      if (hasSize) {
        initMap();
      } else {
        // Wait for next frame when container renders
        requestAnimationFrame(() => {
          if (!cancelled) initMap();
        });
      }
    });

    return () => {
      cancelled = true;
      setMapReady(false);
      if (mapRef.current) {
        try { mapRef.current.remove(); } catch { /* */ }
        mapRef.current = null;
      }
    };
  }, [lat, lng, vietmapTileKey]);

  return (
    <div
      style={{
        borderRadius: 12,
        border: '1px solid rgba(148,163,184,0.35)',
        padding: 12,
        background: '#020617',
        color: '#e5e7eb',
      }}
    >
      {address && (
        <div style={{ marginBottom: 8, fontSize: 14, fontWeight: 500 }}>
          {address}
        </div>
      )}

      {vietmapTileKey && gmapsUrl && (
        <div
          ref={containerRef}
          style={{
            width: '100%',
            height: 260,
            borderRadius: 8,
            overflow: 'hidden',
            marginBottom: 8,
          }}
        />
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 12, opacity: 0.7 }}>
          {mapReady
            ? 'Bản đồ Vietmap (xem trước vị trí hẹn)'
            : 'Nếu bản đồ không hiển thị hãy kiểm tra key Vietmap.'}
        </span>

        {gmapsUrl && (
          <a
            href={gmapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              padding: '6px 10px',
              fontSize: 12,
              borderRadius: 999,
              border: '1px solid rgba(96,165,250,0.8)',
              color: '#bfdbfe',
              textDecoration: 'none',
              whiteSpace: 'nowrap',
            }}
          >
            Mở Google Maps
          </a>
        )}
      </div>
    </div>
  );
}
