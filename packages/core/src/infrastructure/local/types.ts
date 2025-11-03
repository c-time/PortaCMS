/**
 * Local file-based infrastructure types
 * Defines configuration and storage structure for local repositories
 */

/**
 * Configuration options for local file storage
 */
export interface LocalStorageConfig {
  /**
   * Base directory for all data storage
   * Default: './data'
   */
  baseDir: string;

  /**
   * Whether to create directories automatically if they don't exist
   * Default: true
   */
  autoCreateDirectories?: boolean;

  /**
   * Whether to pretty-print JSON files
   * Default: true (for better readability during development)
   */
  prettyPrint?: boolean;
}

/**
 * Default configuration for local storage
 */
export const DEFAULT_LOCAL_STORAGE_CONFIG: LocalStorageConfig = {
  baseDir: './data',
  autoCreateDirectories: true,
  prettyPrint: true,
};

/**
 * File paths structure for organizing data
 */
export const LOCAL_STORAGE_PATHS = {
  PROJECT: 'project.json',
  WORKSPACES: 'workspaces',
  WEBSITES: 'websites',
  CONTENT_MODELS: 'content-models',
  CONTENT_ITEMS: 'content-items',
} as const;
