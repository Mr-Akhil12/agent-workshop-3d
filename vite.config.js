import { defineConfig } from 'vite';

export default defineConfig({
    build: {
        outDir: 'dist',
        emptyOutDir: true,
        minify: false,
        rollupOptions: {
            input: 'index.html',
            external: ['three', 'three/addons/*', 'three/examples/jsm/*'],
            output: {
                globals: {
                    'three': 'THREE'
                }
            }
        }
    },
    publicDir: false,
    server: { port: 5173 }
});
