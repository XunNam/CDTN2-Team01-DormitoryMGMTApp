import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { discoverTests, childEnvironment } from '../../tools/run-tests.mjs';

test('default test discovery excludes integration files, not just execution', () => {
  const root = mkdtempSync(join(tmpdir(), 'dormflow-test-discovery-'));
  try {
    for (const dir of ['tests/student', 'tests/shared', 'tests/integration/student']) mkdirSync(join(root, dir), { recursive: true });
    for (const file of ['tests/student/operation.test.ts', 'tests/shared/runner.test.mjs', 'tests/integration/student/operation.test.ts']) writeFileSync(join(root, file), 'throw new Error("must not import during discovery")');
    assert.equal(discoverTests(root, 'unit').length, 2);
    assert.deepEqual(discoverTests(root, 'integration'), [join(root, 'tests/integration/student/operation.test.ts')]);
    assert.throws(() => discoverTests(root, 'all'));
  } finally {
    // mkdtemp generated this exact disposable directory beneath OS temp.
    assert.equal(resolve(root).startsWith(resolve(tmpdir())), true);
    rmSync(root, { recursive: true });
  }
});
test('unit group never inherits database URLs or mutates parent environment', () => {
  const original = { DATABASE_URL: 'development-url', TEST_DATABASE_URL: 'test-url', PATH: 'path' };
  assert.deepEqual(childEnvironment('unit', original), { PATH: 'path' });
  assert.equal(original.DATABASE_URL, 'development-url');
});
test('integration requires its own URL, never falls back to development database', () => {
  assert.throws(() => childEnvironment('integration', { DATABASE_URL: 'postgresql://localhost/dev' }), /TEST_DATABASE_URL is required/);
  assert.throws(() => childEnvironment('integration', { TEST_DATABASE_URL: 'not-a-url' }), /separately prepared/);
  const env = childEnvironment('integration', { DATABASE_URL: 'postgresql://localhost/dev', TEST_DATABASE_URL: 'postgresql://localhost/dormflow_test' });
  assert.equal(env.DATABASE_URL, 'postgresql://localhost/dormflow_test');
});
