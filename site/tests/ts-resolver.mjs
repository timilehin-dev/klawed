// Node module resolve hook for the test suite.
//
// The project's TypeScript sources use extensionless relative imports
// (`import { isRegion } from './category-map'`), which Vite/Astro resolve at
// build time but Node's ESM resolver does not. This hook intercepts those
// specifiers, tries the .ts/.tsx variants on disk, and hands the file to
// Node's native type-stripping (Node 22+), so `node --test` imports the real
// lib modules with no TypeScript toolchain, no build step and no extra deps.
//
// A test file registers it before importing the sources:
//
//   import { registerTsResolver } from './ts-resolver.mjs';
//   registerTsResolver();
//   const { validateListing } = await import('../src/lib/validate-listing.ts');
//
// Usage: node --test tests/   (see tests/README.md)
import { existsSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { registerHooks } from 'node:module';

const EXTENSIONS = ['.ts', '.tsx', '.mts'];
let registered = false;

/** Try `./foo` as `./foo.ts` (etc.) next to the importing file. */
function tryProjectSources(specifier, parentURL) {
  if (!parentURL) return undefined;
  if (!parentURL.startsWith('file:')) return undefined;
  // The project's extensionless imports are always relative ('../lib/env').
  if (!specifier.startsWith('./') && !specifier.startsWith('../') && !specifier.startsWith('file:')) {
    return undefined;
  }
  let base;
  try {
    base = new URL(specifier, parentURL);
  } catch {
    return undefined;
  }
  for (const ext of EXTENSIONS) {
    const candidate = new URL(base.href + ext);
    const path = fileURLToPath(candidate);
    try {
      if (existsSync(path) && statSync(path).isFile()) return candidate.href;
    } catch {
      // unreadable candidate — keep trying
    }
  }
  return undefined;
}

/**
 * Register the hook once per process. Safe to call from every test file:
 * `node --test` runs each file in its own child process, and within one
 * process the second call is a no-op.
 */
export function registerTsResolver() {
  if (registered) return;
  registered = true;
  registerHooks({
    resolve(specifier, context, next) {
      const hit = tryProjectSources(specifier, context?.parentURL);
      if (hit) return { url: hit, format: 'module-typescript', shortCircuit: true };
      return next(specifier, context);
    },
  });
}
