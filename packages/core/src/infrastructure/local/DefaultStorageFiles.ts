/**
 * Default StorageFiles implementation
 * Provides standard file path resolution for local repositories
 */

import { join } from 'path';
import type { StorageFiles, LocalStorageConfig } from './types.js';
import type {
  WorkspaceSlug,
  ContentModelSlug,
  ContentListViewSlug,
} from '../../domain/shared/entities.js';
import type { ContentItemIdType } from '../../application/driven-ports/ContentItemRepository.js';

/**
 * Default implementation of StorageFiles
 *
 * Provides standard file path resolution based on baseDir configuration.
 */
export class DefaultStorageFiles implements StorageFiles {
  constructor(private readonly config: LocalStorageConfig) {}

  projectConfigFile(): string {
    return join(this.config.baseDir, 'project.json');
  }

  mediaDir(): string {
    return join(this.config.baseDir, 'media');
  }

  workspacesDir(): string {
    return join(this.config.baseDir, 'workspaces');
  }

  workspaceConfigFile(workspaceSlug: WorkspaceSlug): string {
    return join(this.workspacesDir(), workspaceSlug, 'workspace.json');
  }

  artifactStructureConfigFile(workspaceSlug: WorkspaceSlug): string {
    return join(this.workspacesDir(), workspaceSlug, 'artifact-structure.json');
  }

  contentModelsDir(workspaceSlug: WorkspaceSlug): string {
    return join(this.workspacesDir(), workspaceSlug, 'contents');
  }

  contentModelDir(workspaceSlug: WorkspaceSlug, contentModelSlug: ContentModelSlug): string {
    return join(this.contentModelsDir(workspaceSlug), contentModelSlug);
  }

  contentModelConfigFile(
    workspaceSlug: WorkspaceSlug,
    contentModelSlug: ContentModelSlug
  ): string {
    return join(this.contentModelDir(workspaceSlug, contentModelSlug), 'model.json');
  }

  contentModelViewsDir(workspaceSlug: WorkspaceSlug, contentModelSlug: ContentModelSlug): string {
    return join(this.contentModelDir(workspaceSlug, contentModelSlug), 'views');
  }

  contentModelViewConfigFile(
    workspaceSlug: WorkspaceSlug,
    contentModelSlug: ContentModelSlug,
    contentListViewSlug: ContentListViewSlug
  ): string {
    return join(
      this.contentModelViewsDir(workspaceSlug, contentModelSlug),
      `${contentListViewSlug}.json`
    );
  }

  contentModelItemsDir(workspaceSlug: WorkspaceSlug, contentModelSlug: ContentModelSlug): string {
    return join(this.contentModelDir(workspaceSlug, contentModelSlug), 'items');
  }

  contentModelItemFile(
    workspaceSlug: WorkspaceSlug,
    contentModelSlug: ContentModelSlug,
    itemId: ContentItemIdType
  ): string {
    return join(this.contentModelItemsDir(workspaceSlug, contentModelSlug), `${itemId}.json`);
  }

  pageContentViewsDir(workspaceSlug: WorkspaceSlug): string {
    return join(this.workspacesDir(), workspaceSlug, 'pages');
  }
}
