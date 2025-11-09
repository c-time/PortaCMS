/**
 * Local file-based implementation of WorkspaceRepository
 * Stores each workspace as a separate JSON file in the workspaces directory
 */

import { join } from 'path';
import type { WorkspaceRepository } from '../../application/ports/WorkspaceRepository.js';
import type { Workspace } from '../../domain/workspace/entities.js';
import type { WorkspaceSlug } from '../../domain/shared/entities.js';
import type { LocalStorageConfig, StorageFiles } from './types.js';
import { DEFAULT_LOCAL_STORAGE_CONFIG } from './types.js';
import { LocalStorageFiles } from './LocalStorageFiles.js';
import {
  readJsonFile,
  writeJsonFile,
  deleteFile,
  fileExists,
  listFiles,
  ensureDirectory,
} from './utils.js';

export class LocalWorkspaceRepository implements WorkspaceRepository {
  private readonly config: LocalStorageConfig;
  private readonly storageFiles: StorageFiles;

  constructor(config: Partial<LocalStorageConfig> = {}) {
    this.config = { ...DEFAULT_LOCAL_STORAGE_CONFIG, ...config };
    this.storageFiles = new LocalStorageFiles(this.config.baseDir);
  }

  async findBySlug(slug: WorkspaceSlug): Promise<Workspace | null> {
    return await readJsonFile<Workspace>(this.storageFiles.workspaceConfigFile(slug));
  }

  async findAll(): Promise<Workspace[]> {
    const workspacesDir = this.storageFiles.workspacesDir();

    if (this.config.autoCreateDirectories) {
      await ensureDirectory(workspacesDir);
    }

    const files = await listFiles(workspacesDir);
    const workspaces: Workspace[] = [];

    for (const file of files) {
      if (file.endsWith('.json')) {
        const filePath = join(workspacesDir, file);
        const workspace = await readJsonFile<Workspace>(filePath);
        if (workspace) {
          workspaces.push(workspace);
        }
      }
    }

    return workspaces;
  }

  async save(workspace: Workspace): Promise<void> {
    await writeJsonFile(this.storageFiles.workspaceConfigFile(workspace.slug), workspace, this.config);
  }

  async delete(slug: WorkspaceSlug): Promise<void> {
    await deleteFile(this.storageFiles.workspaceConfigFile(slug));
  }

  async exists(slug: WorkspaceSlug): Promise<boolean> {
    return await fileExists(this.storageFiles.workspaceConfigFile(slug));
  }
}
