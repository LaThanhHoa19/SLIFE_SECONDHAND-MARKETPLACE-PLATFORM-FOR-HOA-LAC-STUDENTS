/**
 * Theme tối dành riêng cho trang chat (Messenger-style), bọc trong ThemeProvider tại ChatPage.
 * Giữ accent tím brand, tăng contrast chữ / divider / action cho đọc lâu dễ chịu.
 */
import { createTheme } from '@mui/material/styles';

export const chatDarkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#B894F5',
      light: '#DCC4FF',
      dark: '#9D6EED',
      contrastText: '#121018',
    },
    secondary: {
      main: '#9B9BAD',
    },
    background: {
      default: '#09090e',
      paper: '#12121a',
    },
    divider: 'rgba(255, 255, 255, 0.1)',
    text: {
      primary: '#EDEEF7',
      secondary: '#A4A4BA',
      disabled: 'rgba(255, 255, 255, 0.38)',
    },
    action: {
      active: 'rgba(255, 255, 255, 0.72)',
      hover: 'rgba(255, 255, 255, 0.06)',
      selected: 'rgba(184, 148, 245, 0.16)',
      disabled: 'rgba(255, 255, 255, 0.28)',
      disabledBackground: 'rgba(255, 255, 255, 0.06)',
    },
    success: {
      main: '#6FD99A',
      dark: '#45B274',
      light: '#A5EDCA',
    },
    error: {
      main: '#FF9A9A',
    },
    warning: {
      main: '#E5C46E',
    },
    info: {
      main: '#8AB9FF',
    },
  },
  shape: { borderRadius: 12 },
  typography: {
    fontFamily:
        '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif',
  },
  components: {
    MuiListItemButton: {
      styleOverrides: {
        root: {
          '&.Mui-selected': {
            backgroundColor: 'rgba(184, 148, 245, 0.14)',
          },
          '&.Mui-selected:hover': {
            backgroundColor: 'rgba(184, 148, 245, 0.2)',
          },
        },
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: {
          backgroundImage: 'none',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        },
      },
    },
    MuiPopover: {
      styleOverrides: {
        paper: {
          backgroundImage: 'none',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        },
      },
    },
  },
});
