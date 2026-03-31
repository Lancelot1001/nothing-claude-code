// TypeScript definitions for session-manager.js

export interface SessionFile {
  path: string;
  stat: import('fs').Stats;
}

export interface SessionWithMetadata extends SessionFile {
  frontmatter: Record<string, string> | null;
  content: string;
}

export interface SessionStats {
  totalCount: number;
  totalSizeBytes: number;
  oldestStart: string | null;
  newestStart: string | null;
}

/**
 * Return every session file sorted newest-first.
 */
export function getAllSessions(): SessionFile[];

/**
 * Return a session by its `sessionId` frontmatter field.
 */
export function getSessionById(sessionId: string): SessionWithMetadata | null;

/**
 * Parse frontmatter from a session file.
 */
export function parseSessionMetadata(filePath: string): {
  frontmatter: Record<string, string> | null;
  content: string;
};

/**
 * Return aggregate statistics across all sessions.
 */
export function getSessionStats(): SessionStats;
