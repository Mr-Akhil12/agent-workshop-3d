import { defineConfig } from 'vite';

export default defineConfig({
    build: {
        lib: {
            entry: 'src/main.js',
            name: 'AgentWorkshop',
            fileName: 'bundle',
            formats: ['iife']
        },
        outDir: 'dist',
        emptyOutDir: true,
        minify: false
    },
    publicDir: 'assets',
    server: { port: 5173 }
});
