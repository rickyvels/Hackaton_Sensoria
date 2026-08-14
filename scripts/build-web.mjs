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

function install(prefix) {
  // Cada aplicación tiene su propio node_modules y sus binarios (tsc, vite) viven ahí. Sin este
  // paso el build falla con "tsc: command not found", porque instalar la raíz no instala nada:
  // el package.json de la raíz solo orquesta y no declara dependencias.
  try {
    run(['--prefix', prefix, 'ci']);
  } catch {
    // `npm ci` aborta si el lockfile y el package.json se desincronizan. Preferimos un
    // despliegue que compile a uno que se caiga por una discrepancia de versiones.
    console.warn(`[build-web] "npm ci" falló en ${prefix}; se reintenta con "npm install".`);
    run(['--prefix', prefix, 'install']);
  }
}

rmSync(dist, { recursive: true, force: true });
mkdirSync(dist, { recursive: true });

for (const app of apps) {
  console.log(`[build-web] Compilando ${app.prefix} con base ${app.base}`);
  install(app.prefix);
  // Lo que va tras `--` se añade al final del script, es decir a `vite build`. Pasar el prefijo
  // por la bandera nativa evita leer `process.env` dentro de vite.config.ts, que obligaría a
  // instalar @types/node solo para type-chequear ese archivo.
  run(['--prefix', app.prefix, 'run', 'build', '--', `--base=${app.base}`], {
    VITE_API_URL: '/api/v1',
  });
  cpSync(join(root, app.prefix, 'dist'), app.target, { recursive: true });
}

console.log(`[build-web] Listo. PWA familiar en /, plataforma en /pro/.`);
