// Ejecuta un comando de Python usando el entorno virtual de `api/.venv`.
// Existe para que los scripts de npm funcionen igual en Windows, macOS y Linux:
// `. .venv/bin/activate` solo existe en shells POSIX.
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const apiDir = path.join(root, 'api');

const candidates = [
  path.join(apiDir, '.venv', 'Scripts', 'python.exe'), // Windows
  path.join(apiDir, '.venv', 'bin', 'python'), // macOS y Linux
];

const python = candidates.find((candidate) => existsSync(candidate));

if (!python) {
  console.error(
    [
      'No se encontró el entorno virtual en api/.venv.',
      '',
      'Créalo con:',
      '  Windows:      python -m venv api/.venv',
      '                api\\.venv\\Scripts\\pip install -r api\\requirements.txt',
      '  macOS/Linux:  python3 -m venv api/.venv',
      '                api/.venv/bin/pip install -r api/requirements.txt',
    ].join('\n'),
  );
  process.exit(1);
}

const result = spawnSync(python, process.argv.slice(2), { cwd: apiDir, stdio: 'inherit' });

if (result.error) {
  console.error(result.error.message);
  process.exit(1);
}

process.exit(result.status ?? 1);
