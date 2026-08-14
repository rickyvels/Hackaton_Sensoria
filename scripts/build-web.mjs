#!/usr/bin/env node
// Compila las dos SPA en un único directorio estático: la PWA familiar en la raíz y la
// plataforma profesional en /pro/.
//
// Un solo origen es lo que permite que ambas llamen a `/api/v1` sin conocer la URL del backend.
// Eso elimina el CORS y, sobre todo, el error de que `VITE_API_URL` se congela en el bundle
// durante el build: una URL relativa no puede quedar apuntando al sitio equivocado.
import { execFileSync } from 'node:child_process';
import { cpSync, mkdirSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const dist = join(root, 'dist');
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';

const apps = [
  { prefix: 'apps/family-pwa', target: dist, base: '/' },
  { prefix: 'apps/platform', target: join(dist, 'pro'), base: '/pro/' },
];

function run(args, env) {
  execFileSync(npm, args, {
    cwd: root,
    stdio: 'inherit',
    env: { ...process.env, ...env },
    // Node se niega a ejecutar un .cmd sin shell desde las versiones que corrigieron CVE-2024-27980.
    shell: process.platform === 'win32',
  });
}

rmSync(dist, { recursive: true, force: true });
mkdirSync(dist, { recursive: true });

for (const app of apps) {
  run(['--prefix', app.prefix, 'ci']);
  run(['--prefix', app.prefix, 'run', 'build'], {
    VITE_API_URL: '/api/v1',
    VITE_BASE_PATH: app.base,
  });
  cpSync(join(root, app.prefix, 'dist'), app.target, { recursive: true });
}
