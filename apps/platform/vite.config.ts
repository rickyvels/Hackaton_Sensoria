import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// En el despliegue de un solo dominio la plataforma se sirve bajo /pro/, así que los activos
// tienen que emitirse con ese prefijo. Sin la variable el build local sigue siendo el de antes.
export default defineConfig({
  base: process.env.VITE_BASE_PATH || '/',
  plugins: [react()],
  resolve: { dedupe: ['react', 'react-dom'] },
});
