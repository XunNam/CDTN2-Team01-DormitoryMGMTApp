import { existsSync, readdirSync } from 'node:fs';
import { resolve, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { loadEnvFile } from 'node:process';

export function discoverTests(backendRoot, mode) {
  if (!['unit', 'integration'].includes(mode)) throw new Error('Unknown test group');
  const root = join(backendRoot, 'tests');
  const found = [];
  function visit(dir) {
    if (!existsSync(dir)) return;
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const path = join(dir, entry.name);
      // No symlink traversal. Integration files are never imported by the unit run.
      if (entry.isDirectory()) visit(path);
      else if (entry.isFile() && /\.test\.(ts|mjs)$/.test(entry.name)) {
        const integration = relative(root, path).split(sep)[0] === 'integration';
        if (integration === (mode === 'integration')) found.push(path);
      }
    }
  }
  visit(root);
  return found.sort();
}

export function childEnvironment(mode, source) {
  const env = { ...source };
  if (mode === 'unit') {
    delete env.DATABASE_URL;
    delete env.TEST_DATABASE_URL;
    return env;
  }
  const value = env.TEST_DATABASE_URL;
  if (!value) throw new Error("TEST_DATABASE_URL is required on Anh machine; see .env.test.example.");
  try {
    const url = new URL(value);
    if (!['postgres:', 'postgresql:'].includes(url.protocol) || url.pathname.length < 2) throw new Error();
  } catch { throw new Error('TEST_DATABASE_URL must point to a separately prepared PostgreSQL test database.'); }
  env.DATABASE_URL = value;
  return env;
}

export function main(mode = 'unit') {
  const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
  try {
    if (!['unit', 'integration'].includes(mode)) throw new Error('Use unit or integration.');
    const envPath = join(root, '.env.test');
    if (mode === 'integration' && existsSync(envPath)) loadEnvFile(envPath);
    const env = childEnvironment(mode, process.env);
    const files = discoverTests(root, mode);
    if (!files.length) throw new Error(`No ${mode} tests found. Integration tests must be supplied with the backend handoff; this is not a passing result.`);
    const result = spawnSync(process.execPath, ['--import', 'tsx', '--test', ...files], { cwd: root, env, stdio: 'inherit' });
    if (result.error) throw new Error('Unable to start test process. Check Node.js and npm ci.');
    return result.status ?? 1;
  } catch (error) {
    console.error(error instanceof Error ? error.message : 'Unable to run tests.');
    return 1;
  }
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) process.exitCode = main(process.argv[2]);
