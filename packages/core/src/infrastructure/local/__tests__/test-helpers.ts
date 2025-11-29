/**
 * Test helpers for local infrastructure tests
 * Provides mock implementations and utilities for testing
 */

import { join } from 'path';
import type { StorageFiles, LocalStorageConfig } from '../types.js';
import type { WorkspaceSlug, ContentModelSlug, ContentListViewSlug } from '../../../domain/shared/entities.js';
import type { ContentItemIdType } from '../../../application/driven-ports/ContentItemRepository.js';

/**
 * Creates a simple StorageFiles implementation for testing
 */
export class TestStorageFiles implements StorageFiles {
  constructor(private readonly baseDir: string) {}

  projectConfigFile(): string {
    return join(this.baseDir, 'project.json');
  }

  mediaDir(): string {
    return join(this.baseDir, 'media');
  }

  workspacesDir(): string {
    return join(this.baseDir, 'workspaces');
  }

  workspaceConfigFile(workspaceSlug: WorkspaceSlug): string {
    return join(this.workspacesDir(), `${workspaceSlug}.json`);
  }

  artifactStructureConfigFile(workspaceSlug: WorkspaceSlug): string {
    return join(this.baseDir, 'artifact-structures', `${workspaceSlug}.json`);
  }

  contentModelsDir(workspaceSlug: WorkspaceSlug): string {
    return join(this.baseDir, 'content-models', workspaceSlug);
  }

  contentModelDir(workspaceSlug: WorkspaceSlug, contentModelSlug: ContentModelSlug): string {
    return join(this.contentModelsDir(workspaceSlug), contentModelSlug);
  }

  contentModelConfigFile(workspaceSlug: WorkspaceSlug, contentModelSlug: ContentModelSlug): string {
    return join(this.contentModelsDir(workspaceSlug), `${contentModelSlug}.json`);
  }

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

  pageContentViewsDir(workspaceSlug: WorkspaceSlug): string {
    return join(this.baseDir, 'page-content-views', workspaceSlug);
  }
}

/**
 * Creates a test configuration
 */
export function createTestConfig(baseDir: string): LocalStorageConfig {
  return {
    baseDir,
    autoCreateDirectories: true,
    prettyPrint: true,
  };
}
