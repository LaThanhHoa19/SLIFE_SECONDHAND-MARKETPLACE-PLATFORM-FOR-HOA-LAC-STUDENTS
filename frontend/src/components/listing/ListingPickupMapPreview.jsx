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
    <div style={{ 
        background: '#0a0a12', 
        color: '#e5e7eb', 
        position: 'relative',
        overflow: 'hidden', // Để bo góc hoạt động tốt cho content bên trong
        borderRadius: '0 0 12px 12px' // Chú ý: Bo góc dưới cho đồng bộ
    }}>
      {/* Map canvas - no tile key fallback */}
      {vietmapTileKey ? (
        <>
          {!mapReady && (
            <div
              style={{
                position: 'absolute', inset: 0, zIndex: 1,
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                background: 'rgba(14,14,24,0.95)',
                gap: 12,
              }}
            >
              <div style={{
                width: 36, height: 36,
                border: '3px solid rgba(157,110,237,0.1)',
                borderTopColor: '#9D6EED',
                borderRadius: '50%',
                animation: 'spin 1s cubic-bezier(0.4, 0, 0.2, 1) infinite',
                boxShadow: '0 0 15px rgba(157,110,237,0.2)',
              }} />
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', fontWeight: 500, letterSpacing: '0.02em' }}>
                Đang chuẩn bị bản đồ...
              </span>
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          )}
          <div
            ref={containerRef}
            style={{
              width: '100%',
              height: 320,
              display: 'block',
              filter: 'none', // Trở lại trắng nguyên bản
              opacity: mapReady ? 1 : 0,
              transition: 'opacity 0.4s ease',
            }}
          />
          {/* Status bar - Clear & Standard */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '10px 16px',
            background: 'rgba(0,0,0,0.7)',
            borderTop: '1px solid rgba(255,255,255,0.06)',
          }}>
            <span style={{
              display: 'inline-flex', width: 7, height: 7,
              borderRadius: '50%',
              background: mapReady ? '#2ED573' : '#FFA502',
              boxShadow: mapReady ? '0 0 8px #2ED573' : '0 0 8px #FFA502',
              flexShrink: 0,
            }} />
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', letterSpacing: 0.2 }}>
              {mapReady ? 'Vietmap · Bản đồ số Việt Nam' : 'Đang kết nối bản đồ Vietmap...'}
            </span>
          </div>
        </>
      ) : (
        <div style={{
          height: 200,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: 10,
          padding: 24,
          background: 'rgba(157,110,237,0.04)',
          border: '1px dashed rgba(157,110,237,0.2)',
          borderRadius: 8, margin: 16,
        }}>
          <span style={{ fontSize: 32 }}>🗺️</span>
          <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', textAlign: 'center' }}>
            Bản đồ không khả dụng.<br />Vui lòng kiểm tra cấu hình Vietmap API key.
          </span>
        </div>
      )}
    </div>
  );
}
