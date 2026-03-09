/**
 * Mục đích: Cấu hình Vite cho frontend skeleton của SLIFE.
 * API dùng: Không gọi API trực tiếp.
 * Request/Response: N/A.
 * Props: N/A.
 * Validation: N/A.
 * Accessibility: N/A.
 * Tests cần viết: kiểm tra build/dev server chạy được với env file.
 */
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
  },
});
