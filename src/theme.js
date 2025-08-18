import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#00bcd4', // Teal
      light: '#4dd0e1',
      dark: '#008ba3',
      contrastText: '#fff',
    },
    secondary: {
      main: '#7c4dff', // Purple
      light: '#b47cff',
      dark: '#3f1dcb',
      contrastText: '#fff',
    },
    background: {
      default: '#101624',
      paper: '#18213a',
    },
    text: {
      primary: '#e3f2fd',
      secondary: '#b0bec5',
    },
    error: {
      main: '#ff5252',
    },
    warning: {
      main: '#ffb300',
    },
    info: {
      main: '#29b6f6',
    },
    success: {
      main: '#00e676',
    },
  },
  shape: {
    borderRadius: 14,
  },
  typography: {
    fontFamily: 'Montserrat, Roboto, Helvetica Neue, Arial, sans-serif',
    h1: { fontWeight: 900 },
    h2: { fontWeight: 800 },
    h3: { fontWeight: 700 },
    h4: { fontWeight: 700 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
    button: { textTransform: 'none', fontWeight: 600 },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 14,
          backgroundImage: 'none',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          fontWeight: 700,
          boxShadow: '0 2px 8px 0 rgba(0,0,0,0.12)',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          background: 'linear-gradient(135deg, #101624 60%, #18213a 100%)',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: 'linear-gradient(90deg, #00bcd4 0%, #7c4dff 100%)',
          boxShadow: '0 2px 8px 0 rgba(0,0,0,0.18)',
        },
      },
    },
  },
});

export default theme;
