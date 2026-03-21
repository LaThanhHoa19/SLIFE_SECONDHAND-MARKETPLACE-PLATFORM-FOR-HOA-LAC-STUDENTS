import { useEffect, useRef, useState } from 'react';
import { getGeoClientConfig } from '../../api/geoApi';

const MAP_DEFAULT_ZOOM = 15;

function buildGoogleMapsDirectionsUrl(lat, lng) {
  if (lat == null || lng == null) return null;
  const latNum = Number(lat);
  const lngNum = Number(lng);
  if (!Number.isFinite(latNum) || !Number.isFinite(lngNum)) return null;
  const dest = `${latNum},${lngNum}`;
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(dest)}`;
}

/**
 * Xem trước điểm hẹn: Vietmap + nút mở Google Maps.
 *
 * Props:
 *  - lat, lng: toạ độ điểm hẹn (bắt buộc để hiện map/route có ý nghĩa)
 *  - address: chuỗi địa chỉ hiển thị (optional)
 *  - vietmapTileKey: key Vietmap tile (nếu null thì không render map, chỉ hiện nút Google Maps)
 *
 * Component này độc lập, chưa được gắn vào UI hiện tại.
 */
export default function ListingPickupMapPreview({
  lat,
  lng,
  address,
  vietmapTileKey: propTileKey,
}) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const [mapReady, setMapReady] = useState(false);
  const [vietmapTileKey, setVietmapTileKey] = useState(
    () => (propTileKey || import.meta.env.VITE_VIETMAP_TILE_KEY || '').trim(),
  );

  // Fallback: nếu không có env/key truyền vào, gọi BE /api/geo/client-config giống form đăng tin
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
    return () => {
      cancelled = true;
    };
  }, [vietmapTileKey]);

  const gmapsUrl = buildGoogleMapsDirectionsUrl(lat, lng);

  // Khởi tạo Vietmap GL (nếu có tileKey + toạ độ)
  useEffect(() => {
    if (!vietmapTileKey || typeof window === 'undefined') return;

    const latNum = Number(lat);
    const lngNum = Number(lng);
    if (!Number.isFinite(latNum) || !Number.isFinite(lngNum)) return;

    let cancelled = false;

    const initMap = () => {
      if (cancelled || mapRef.current || !window.vietmapgl || !containerRef.current) return;

      const map = new window.vietmapgl.Map({
        container: containerRef.current,
        style: `https://maps.vietmap.vn/maps/styles/tm/style.json?apikey=${vietmapTileKey}`,
        center: [lngNum, latNum],
        zoom: MAP_DEFAULT_ZOOM,
      });

      map.addControl(new window.vietmapgl.NavigationControl(), 'top-left');

      map.once('load', () => {
        if (!cancelled) setMapReady(true);
      });

      const marker = new window.vietmapgl.Marker().setLngLat([lngNum, latNum]).addTo(map);

      mapRef.current = map;
      markerRef.current = marker;
    };

    const ensureCss = () => {
      if (document.querySelector('link[data-vietmap-gl-css]')) return;
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/@vietmap/vietmap-gl-js@6.0.1/dist/vietmap-gl.css';
      link.dataset.vietmapGlCss = 'true';
      document.head.appendChild(link);
    };

    ensureCss();

    let script = document.querySelector('script[data-vietmap-gl]');
    if (!script) {
      script = document.createElement('script');
      script.src = 'https://unpkg.com/@vietmap/vietmap-gl-js@6.0.1/dist/vietmap-gl.js';
      script.async = true;
      script.defer = true;
      script.dataset.vietmapGl = 'true';
      script.addEventListener('load', initMap);
      document.body.appendChild(script);
    } else if (window.vietmapgl) {
      initMap();
    } else {
      script.addEventListener('load', initMap);
    }

    return () => {
      cancelled = true;
      setMapReady(false);
      if (mapRef.current) {
        try {
          mapRef.current.remove();
        } catch {
          // ignore
        }
        mapRef.current = null;
      }
      markerRef.current = null;
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

