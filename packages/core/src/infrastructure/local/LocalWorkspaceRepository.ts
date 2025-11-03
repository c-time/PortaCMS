/**
 * Local file-based implementation of WorkspaceRepository
 * Stores each workspace as a separate JSON file in the workspaces directory
 */

import type { WorkspaceRepository } from '../../application/ports/WorkspaceRepository.js';
import type { Workspace } from '../../domain/workspace/entities.js';
import type { WorkspaceSlug } from '../../domain/shared/entities.js';
import type { LocalStorageConfig } from './types.js';
import { DEFAULT_LOCAL_STORAGE_CONFIG, LOCAL_STORAGE_PATHS } from './types.js';
import {
  readJsonFile,
  writeJsonFile,
  deleteFile,
  fileExists,
  listFiles,
  buildPath,
  ensureDirectory,
} from './utils.js';

export class LocalWorkspaceRepository implements WorkspaceRepository {
  private readonly config: LocalStorageConfig;
  private readonly workspacesDir: string;

  constructor(config: Partial<LocalStorageConfig> = {}) {
    this.config = { ...DEFAULT_LOCAL_STORAGE_CONFIG, ...config };
    this.workspacesDir = buildPath(this.config.baseDir, LOCAL_STORAGE_PATHS.WORKSPACES);
  }

  private getWorkspaceFilePath(slug: WorkspaceSlug): string {
    return buildPath(this.workspacesDir, `${slug}.json`);
  }

  async findBySlug(slug: WorkspaceSlug): Promise<Workspace | null> {
    const filePath = this.getWorkspaceFilePath(slug);
    return await readJsonFile<Workspace>(filePath);
  }

  async findAll(): Promise<Workspace[]> {
    if (this.config.autoCreateDirectories) {
      await ensureDirectory(this.workspacesDir);
    }

    const files = await listFiles(this.workspacesDir);
    const workspaces: Workspace[] = [];

    for (const file of files) {
      if (file.endsWith('.json')) {
        const filePath = buildPath(this.workspacesDir, file);
        const workspace = await readJsonFile<Workspace>(filePath);
        if (workspace) {
          workspaces.push(workspace);
        }
      }
    }

    return workspaces;
  }

  async save(workspace: Workspace): Promise<void> {
    const filePath = this.getWorkspaceFilePath(workspace.slug);
    await writeJsonFile(filePath, workspace, this.config);
  }

  async delete(slug: WorkspaceSlug): Promise<void> {
    const filePath = this.getWorkspaceFilePath(slug);
    await deleteFile(filePath);
  }

  async exists(slug: WorkspaceSlug): Promise<boolean> {
    const filePath = this.getWorkspaceFilePath(slug);
    return await fileExists(filePath);
  }
}
