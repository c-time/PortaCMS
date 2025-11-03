/**
 * Utility functions for local file operations
 * Provides common file I/O operations for local repositories
 */

import { promises as fs } from 'fs';
import { join, dirname } from 'path';
import type { LocalStorageConfig } from './types.js';

/**
 * Ensures that a directory exists, creating it if necessary
 */
export async function ensureDirectory(dirPath: string): Promise<void> {
  try {
    await fs.access(dirPath);
  } catch {
    await fs.mkdir(dirPath, { recursive: true });
  }
}

/**
 * Reads and parses a JSON file
 */
export async function readJsonFile<T>(filePath: string): Promise<T | null> {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content) as T;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return null;
    }
    throw error;
  }
}

/**
 * Writes data to a JSON file
 */
export async function writeJsonFile<T>(
  filePath: string,
  data: T,
  config: LocalStorageConfig
): Promise<void> {
  if (config.autoCreateDirectories) {
    await ensureDirectory(dirname(filePath));
  }

  const content = config.prettyPrint
    ? JSON.stringify(data, null, 2)
    : JSON.stringify(data);

  await fs.writeFile(filePath, content, 'utf-8');
}

/**
 * Deletes a file if it exists
 */
export async function deleteFile(filePath: string): Promise<void> {
  try {
    await fs.unlink(filePath);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      throw error;
    }
  }
}

/**
 * Checks if a file exists
 */
export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Lists all files in a directory
 */
export async function listFiles(dirPath: string): Promise<string[]> {
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    return entries
      .filter((entry) => entry.isFile())
      .map((entry) => entry.name);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return [];
    }
    throw error;
  }
}

/**
 * Builds a full file path from base directory and relative path components
 */
export function buildPath(baseDir: string, ...paths: string[]): string {
  return join(baseDir, ...paths);
}

/**
 * Serializes data to JSON-compatible format
 * Handles Date objects and other special types
 */
export function serialize<T>(data: T): unknown {
  return JSON.parse(JSON.stringify(data));
}

/**
 * Deserializes data from JSON, converting date strings back to Date objects
 */
export function deserialize<T>(data: unknown, dateFields: string[] = []): T {
  const parsed = data as Record<string, unknown>;

  // Convert specified date fields back to Date objects
  for (const field of dateFields) {
    if (parsed[field] && typeof parsed[field] === 'string') {
      parsed[field] = new Date(parsed[field] as string);
    }
  }

  return parsed as T;
}
