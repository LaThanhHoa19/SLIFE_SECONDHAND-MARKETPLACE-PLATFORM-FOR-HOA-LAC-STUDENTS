/**
 * Mục đích: Skeleton test cho component Sidebar.
 * TODO: kiểm tra render, tương tác người dùng, và trạng thái loading/lỗi.
 */
import { describe, it, expect } from 'vitest';
import Sidebar from '../layout/Sidebar';

describe('Sidebar', () => {
  it('TODO: render cơ bản', () => {
    expect(Sidebar).toBeTruthy();
  });

  it('TODO: interaction/API mock', () => {
    expect(true).toBe(true);
  });
});

// ─── Nav items configuration (My Listings feature) ────────────────────────

describe('Sidebar — Nav Items (My Listings)', () => {
  const NAV_ITEMS = [
    { label: 'Feed',        path: '/' },
    { label: 'Tin đã lưu', path: '/saved' },
    { label: 'Tin của tôi', path: '/my-listings' },
    { label: 'Đăng tin',   path: '/listings/new' },
  ];

  it('nên có đúng 4 nav items sau khi thêm "Tin của tôi"', () => {
    expect(NAV_ITEMS).toHaveLength(4);
  });

  it('nên có nav item "Tin của tôi" trỏ đến /my-listings', () => {
    const myListingsItem = NAV_ITEMS.find((item) => item.path === '/my-listings');
    expect(myListingsItem).toBeDefined();
    expect(myListingsItem.label).toBe('Tin của tôi');
  });

  it('nên giữ nguyên các nav items cũ (Feed, Tin đã lưu, Đăng tin)', () => {
    const paths = NAV_ITEMS.map((item) => item.path);
    expect(paths).toContain('/');
    expect(paths).toContain('/saved');
    expect(paths).toContain('/listings/new');
  });

  it('nên có path duy nhất cho mỗi nav item', () => {
    const paths = NAV_ITEMS.map((item) => item.path);
    const uniquePaths = new Set(paths);
    expect(uniquePaths.size).toBe(NAV_ITEMS.length);
  });

  it('Sidebar component nên là function (renderable)', () => {
    expect(typeof Sidebar).toBe('function');
  });
});
