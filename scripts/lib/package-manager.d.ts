// TypeScript definitions for package-manager.js

export interface PackageManager {
  name: 'npm' | 'pnpm' | 'yarn' | 'bun';
  execCmd: string;
  lockFile: string;
  version: string;
}

/**
 * Detect and return the active package manager for `cwd`.
 * Uses cached result on subsequent calls.
 */
export function getPackageManager(cwd?: string): PackageManager;

/**
 * Override the preferred package manager for all subsequent calls.
 */
export function setPreferredPackageManager(name: 'npm' | 'pnpm' | 'yarn' | 'bun'): void;

/**
 * Return the CLI runner for the detected package manager.
 * e.g. `"npm run"`, `"pnpm run"`, `"yarn run"`, `"bun run"`
 */
export function getRunCommand(cwd?: string): string;

/**
 * Return the direct executor for the detected package manager.
 * e.g. `"npx"`, `"pnpm exec"`, `"bunx"`, `"npx"` (yarn 1.x always falls back to npx)
 */
export function getExecCommand(cwd?: string): string;
