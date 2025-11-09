/**
 * Implementation of StorageFiles interface for local file-based storage
 * Provides path resolution for all storage locations
 */

import { join } from 'path';
import type { StorageFiles } from './types.js';
import type { WorkspaceSlug, ContentModelSlug, ContentListViewSlug } from '../../domain/shared/entities.js';
import type { ContentItemIdType } from '../../application/ports/ContentItemRepository.js';

export class LocalStorageFiles implements StorageFiles {
  constructor(private readonly baseDir: string) {}

  // Project level
  projectConfigFile(): string {
    return join(this.baseDir, 'project.json');
  }

  // Media
  mediaDir(): string {
    return join(this.baseDir, 'media');
  }

  // Workspaces
  workspacesDir(): string {
    return join(this.baseDir, 'workspaces');
  }

  workspaceConfigFile(workspaceSlug: WorkspaceSlug): string {
    return join(this.workspacesDir(), `${workspaceSlug}.json`);
  }

  // Website
  websiteConfigFile(workspaceSlug: WorkspaceSlug): string {
    return join(this.baseDir, 'websites', `${workspaceSlug}.json`);
  }

  // Content Models - returns: workspaces/{workspaceSlug}/contents/
  contentModelsDir(workspaceSlug: WorkspaceSlug): string {
    return join(this.baseDir, 'content-models', workspaceSlug);
  }

  // Content Model - returns: workspaces/{workspaceSlug}/contents/{contentModelSlug}/
  contentModelDir(workspaceSlug: WorkspaceSlug, contentModelSlug: ContentModelSlug): string {
    return join(this.contentModelsDir(workspaceSlug), contentModelSlug);
  }

  contentModelConfigFile(workspaceSlug: WorkspaceSlug, contentModelSlug: ContentModelSlug): string {
    return join(this.contentModelsDir(workspaceSlug), `${contentModelSlug}.json`);
  }

  // Content List Views
  contentModelViewsDir(workspaceSlug: WorkspaceSlug, contentModelSlug: ContentModelSlug): string {
    return join(this.contentModelDir(workspaceSlug, contentModelSlug), 'views');
  }

  contentModelViewConfigFile(
    workspaceSlug: WorkspaceSlug,
    contentModelSlug: ContentModelSlug,
    contentListViewSlug: ContentListViewSlug
  ): string {
    return join(this.contentModelViewsDir(workspaceSlug, contentModelSlug), `${contentListViewSlug}.json`);
  }

  // Content Items
  contentModelItemsDir(workspaceSlug: WorkspaceSlug, contentModelSlug: ContentModelSlug): string {
    return join(this.baseDir, 'content-items', workspaceSlug, contentModelSlug);
  }

  contentModelItemFile(
    workspaceSlug: WorkspaceSlug,
    contentModelSlug: ContentModelSlug,
    itemId: ContentItemIdType
  ): string {
    return join(this.contentModelItemsDir(workspaceSlug, contentModelSlug), `${itemId}.json`);
  }

  // Page Content Views
  pageContentViewsDir(workspaceSlug: WorkspaceSlug): string {
    return join(this.baseDir, 'page-content-views', workspaceSlug);
  }
}
