/**
 * Minimal ESM resolve hook so the Node test files can import the app's real
 * TypeScript modules instead of a hand-copied reimplementation of them.
 *
 * It only does what tsconfig's `paths` does: map `@/x` onto `src/x`, trying the
 * extensions Next would try. Run tests with:
 *
 *   node --experimental-strip-types --import ./tests/ts-resolver.mjs <file>
 */
import { existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, resolve as resolvePath } from 'node:path';
import { register } from 'node:module';

const ROOT = resolvePath(dirname(fileURLToPath(import.meta.url)), '..');
const CANDIDATES = ['', '.ts', '.tsx', '/index.ts', '/index.tsx'];

export function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith('@/')) {
    const base = resolvePath(ROOT, 'src', specifier.slice(2));
    for (const ext of CANDIDATES) {
      if (existsSync(base + ext) && ext !== '') {
        return { url: pathToFileURL(base + ext).href, shortCircuit: true };
      }
    }
  }
  return nextResolve(specifier, context);
}

// Self-registering: `--import ./tests/ts-resolver.mjs` installs the hook above.
if (!process.env.__TS_RESOLVER_REGISTERED) {
  process.env.__TS_RESOLVER_REGISTERED = '1';
  register(import.meta.url, import.meta.url);
}
