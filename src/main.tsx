import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { store } from './app/store';
import theme from './theme';
import AppRouter from './routes/AppRouter';
import './index.css';


import { ToastifyProvider } from './components/Toastify';

createRoot(document.getElementById('root')!).render(
	<StrictMode>
		<Provider store={store}>
			<ThemeProvider theme={theme}>
				<CssBaseline />
				<ToastifyProvider>
					<AppRouter />
				</ToastifyProvider>
			</ThemeProvider>
		</Provider>
	</StrictMode>,
);
