import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig(({ command, mode }) => {
    if (mode === 'demo') {
        return {
            plugins: [vue()],
            root: 'demo',
            build: {
                outDir: 'dist',
                rollupOptions: {
                    input: 'demo/index.html',
                },
            },
        };
    }

    return {
        plugins: [vue()],
        build: {
            lib: {
                entry: 'src/library.ts',
                name: 'VueSketcher',
                formats: ['es', 'umd'],
                fileName: (format) => `vue-sketcher.${format}.js`,
            },
            rollupOptions: {
                external: ['vue'],
                output: {
                    globals: {
                        vue: 'Vue',
                    },
                },
            },
        },
    };
});
