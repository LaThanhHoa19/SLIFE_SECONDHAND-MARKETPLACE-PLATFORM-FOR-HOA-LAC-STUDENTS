import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Component giúp tự động cuộn trang lên đầu mỗi khi chuyển router.
 */
export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      // behavior: 'smooth' - Tắt smooth để tránh cảm giác bị trễ khi nhảy trang
    });
  }, [pathname]);

  return null;
}
