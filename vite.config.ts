import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
	plugins: [react()],
	resolve: {
		alias: {
			'@': path.resolve(__dirname, './src'),
		},
	},
	server: {
		proxy: {
			'/api/v1': {
				target: 'http://36.50.55.38/',
				changeOrigin: true,
				// SSE: tắt buffering để event stream qua ngay lập tức
				configure: (proxy) => {
					proxy.on('proxyRes', (proxyRes, req) => {
						if (req.url?.includes('/stream')) {
							proxyRes.headers['cache-control'] = 'no-cache';
							proxyRes.headers['x-accel-buffering'] = 'no';
							delete proxyRes.headers['content-encoding'];
						}
					});
				},
			},
		},
	},
	test: {
		globals: true,
		environment: 'jsdom',
		setupFiles: './src/setupTests.ts',
	},
})
