import type { PaletteMode } from '@mui/material';

export const getDesignTokens = (mode: PaletteMode) => ({
  palette: {
    mode,
    ...(mode === 'light'
      ? {
          // Light Mode Colors
          primary: {
            main: '#00b894',
            dark: '#009975',
            light: 'rgba(0, 184, 148, 0.1)',
            contrastText: '#ffffff',
          },
          secondary: {
            main: '#636e72',
            light: '#b2bec3',
            dark: '#2d3436',
          },
          background: {
            default: '#f8fafc',
            paper: '#ffffff',
          },
          text: {
            primary: '#0f172a',
            secondary: '#475569',
            disabled: '#94a3b8',
          },
          success: {
            main: '#2ecc71',
            light: 'rgba(46, 204, 113, 0.1)',
          },
          warning: {
            main: '#ff7675',
            light: 'rgba(255, 118, 117, 0.15)',
          },
          error: {
            main: '#e74c3c',
            dark: '#c0392b',
            light: 'rgba(231, 76, 60, 0.1)',
          },
          divider: '#e2e8f0',
          action: {
            hover: 'rgba(15, 23, 42, 0.04)',
            selected: 'rgba(15, 23, 42, 0.08)',
          },
        }
      : {
          // Dark Mode Colors
          primary: {
            main: '#00b894',
            dark: '#009975',
            light: 'rgba(0, 184, 148, 0.1)',
            contrastText: '#ffffff',
          },
          secondary: {
            main: '#a0aec0',
            light: '#cbd5e1',
            dark: '#64748b',
          },
          background: {
            default: '#0f172a',
            paper: '#1e293b',
          },
          text: {
            primary: '#f8fafc',
            secondary: '#94a3b8',
            disabled: '#475569',
          },
          success: {
            main: '#00b894',
            light: 'rgba(0, 184, 148, 0.1)',
          },
          warning: {
            main: '#ff7675',
            light: 'rgba(255, 118, 117, 0.15)',
          },
          error: {
            main: '#e74c3c',
            dark: '#c0392b',
            light: 'rgba(231, 76, 60, 0.1)',
          },
          divider: 'rgba(255, 255, 255, 0.08)',
          action: {
            hover: 'rgba(255, 255, 255, 0.05)',
            selected: 'rgba(255, 255, 255, 0.16)',
          },
        }),
    info: { main: '#3498db' },
  },
  typography: {
    fontFamily: '"Inter", "system-ui", "-apple-system", sans-serif',
    h1: { fontWeight: 700, letterSpacing: '-0.02em' },
    h2: { fontWeight: 700, letterSpacing: '-0.01em' },
    h3: { fontWeight: 600 },
    h4: { fontWeight: 600 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
    button: { textTransform: 'none' as const, fontWeight: 600 },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '8px 20px',
          boxShadow: 'none',
          '&:hover': { boxShadow: 'none' },
        },
        sizeLarge: { padding: '12px 28px', fontSize: '0.95rem' },
        sizeSmall: { padding: '4px 12px', fontSize: '0.8rem' },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          boxShadow: mode === 'light' ? '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)' : '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          '& .MuiTableCell-head': {
            fontWeight: 600,
            fontSize: '0.78rem',
            textTransform: 'uppercase' as const,
            letterSpacing: '0.04em',
            color: mode === 'light' ? '#475569' : '#94a3b8',
            backgroundColor: mode === 'light' ? '#f8fafc' : '#0f172a',
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderColor: mode === 'light' ? '#e2e8f0' : 'rgba(255, 255, 255, 0.08)',
          padding: '12px 16px',
        },
      },
    },
    MuiTextField: {
      defaultProps: { size: 'small' as const, variant: 'outlined' as const },
    },
    MuiDialog: {
      defaultProps: { disableScrollLock: true },
      styleOverrides: { paper: { borderRadius: 12 } },
    },
    MuiPopover: { defaultProps: { disableScrollLock: true } },
    MuiMenu: { defaultProps: { disableScrollLock: true } },
    MuiSelect: {
      defaultProps: {
        MenuProps: {
          variant: 'menu',
          disableScrollLock: true,
          disableAutoFocusItem: true,
          anchorOrigin: {
            vertical: 'bottom',
            horizontal: 'left',
          },
          transformOrigin: {
            vertical: 'top',
            horizontal: 'left',
          },
        },
      },
    },
    MuiChip: { styleOverrides: { root: { fontWeight: 600, fontSize: '0.78rem' } } },
    MuiDrawer: { styleOverrides: { paper: { border: 'none' } } },
  },
});

