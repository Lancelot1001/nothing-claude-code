// TypeScript definitions for session-aliases.js

/**
 * Set a named alias for a session file.
 */
export function setAlias(alias: string, sessionFile: string): void;

/**
 * Delete a named alias.
 * @returns `true` if the alias existed
 */
export function deleteAlias(alias: string): boolean;

/**
 * List all aliases.
 * @returns A copy of the aliases object.
 */
export function listAliases(): Record<string, string>;

/**
 * Rename an existing alias.
 * @returns `true` if the old alias existed
 */
export function renameAlias(oldAlias: string, newAlias: string): boolean;
