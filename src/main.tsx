import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { ThemeContextProvider } from './contexts/ThemeContext';
import CssBaseline from '@mui/material/CssBaseline';
import { store } from './app/store';

import AppRouter from './routes/AppRouter';
import './index.css';


import { ToastifyProvider } from './components/Toastify';

createRoot(document.getElementById('root')!).render(
	<StrictMode>
		<Provider store={store}>
			<ThemeContextProvider>
				<CssBaseline />
				<ToastifyProvider>
					<AppRouter />
				</ToastifyProvider>
			</ThemeContextProvider>
		</Provider>
	</StrictMode>,
);
