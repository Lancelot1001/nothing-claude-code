// TypeScript definitions for utils.js

export function copyFile(src: string, dest: string): void;
export function removeFile(filePath: string): void;
export function mkdirp(dir: string): void;
export function fileExists(filePath: string): boolean;
export function readJson(filePath: string): unknown;
export function writeJson(filePath: string, data: unknown): void;
export function readUtf8BomSafe(filePath: string): string;

export function gitRoot(cwd?: string): string;
export function gitDiff(cwd?: string, file?: string): string;
export function gitStatus(cwd?: string): string;
export function gitStagedFiles(cwd?: string): string[];
export function isGitRepo(cwd?: string): boolean;

export function sanitizeSessionId(id: string): string;
export function generateSessionId(): string;

export function stripAnsi(str: string): string;
export function ansiWidth(str: string): number;
export function truncateAnsi(str: string, maxWidth: number, suffix?: string): string;

export function readHookInput(): object | null;
export function writeHookResponse(data: object): void;

export function normalizeSep(p: string): string;
export function relativeTo(from: string, to: string): string;
export function isDescendantOf(child: string, parent: string): boolean;

export function log(...args: unknown[]): void;
export function error(...args: unknown[]): void;
export function debug(...args: unknown[]): void;
