import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// El prefijo de despliegue no se fija aquí: llega como `--base` desde scripts/build-web.mjs.
// Leerlo de `process.env` obligaría a añadir @types/node solo para el archivo de configuración.
export default defineConfig({ plugins: [react()], resolve: { dedupe: ['react', 'react-dom'] } });
