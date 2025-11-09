import { ContentListViewSlug, ContentModelSlug, WorkspaceSlug } from "../../domain/shared/entities.js";

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



export interface StorageFiles {
  projectConfigFile: () => string;
  mediaDir: () => string;
  workspacesDir: () => string;
  workspaceConfigFile: (workspaceSlug: WorkspaceSlug) => string;
  websiteConfigFile: (workspaceSlug: WorkspaceSlug) => string;
  contentModelsDir: (workspaceSlug: WorkspaceSlug) => string;

  contentModelDir: (workspaceSlug: WorkspaceSlug, contentModelSlug: ContentModelSlug) => string;
  contentModelConfigFile: (workspaceSlug: WorkspaceSlug, contentModelSlug: ContentModelSlug) => string;

  contentModelViewsDir: (workspaceSlug: WorkspaceSlug, contentModelSlug: ContentModelSlug) => string;
  contentModelViewConfigFile: (workspaceSlug: WorkspaceSlug, contentModelSlug: ContentModelSlug, contentListViewSlug: ContentListViewSlug) => string;

  contentModelItemsDir: (workspaceSlug: WorkspaceSlug, contentModelSlug: ContentModelSlug) => string;
  contentModelItemFile: (workspaceSlug: WorkspaceSlug, contentModelSlug: ContentModelSlug) => string;

  pageContentViewsDir: (workspaceSlug: WorkspaceSlug) => string;
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
