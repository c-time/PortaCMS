import { ContentListViewSlug, ContentModelSlug, WorkspaceSlug } from "../../domain/shared/entities.js";
import type { ContentItemIdType } from "../../application/driven-ports/ContentItemRepository.js";

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
  // Project level
  projectConfigFile: () => string;

  // Media
  mediaDir: () => string;

  // Workspaces
  workspacesDir: () => string;
  workspaceConfigFile: (workspaceSlug: WorkspaceSlug) => string;

  // Website
  websiteConfigFile: (workspaceSlug: WorkspaceSlug) => string;

  // Content Models - returns: workspaces/{workspaceSlug}/contents/
  contentModelsDir: (workspaceSlug: WorkspaceSlug) => string;
  // Content Model - returns: workspaces/{workspaceSlug}/contents/{contentModelSlug}/
  contentModelDir: (workspaceSlug: WorkspaceSlug, contentModelSlug: ContentModelSlug) => string;
  contentModelConfigFile: (workspaceSlug: WorkspaceSlug, contentModelSlug: ContentModelSlug) => string;

  // Content List Views
  contentModelViewsDir: (workspaceSlug: WorkspaceSlug, contentModelSlug: ContentModelSlug) => string;
  contentModelViewConfigFile: (
    workspaceSlug: WorkspaceSlug,
    contentModelSlug: ContentModelSlug,
    contentListViewSlug: ContentListViewSlug
  ) => string;

  // Content Items
  contentModelItemsDir: (workspaceSlug: WorkspaceSlug, contentModelSlug: ContentModelSlug) => string;
  contentModelItemFile: (
    workspaceSlug: WorkspaceSlug,
    contentModelSlug: ContentModelSlug,
    itemId: ContentItemIdType
  ) => string;

  // Page Content Views
  pageContentViewsDir: (workspaceSlug: WorkspaceSlug) => string;
}