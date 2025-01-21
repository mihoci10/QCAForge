import { purgeCss } from 'vite-plugin-tailwind-purgecss';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import path from 'path';
const host = process.env.TAURI_DEV_HOST;

export default defineConfig({
	plugins: [sveltekit(), purgeCss()],
	clearScreen: false,
	server: {
		port: 5173,
		strictPort: true,
		host: host || false,
		watch: {
			ignored: ["**/src-tauri/**"],
		},
	},
	resolve: {
		alias: {
			$lib: path.resolve("./src/lib"),
		},
	},
});
