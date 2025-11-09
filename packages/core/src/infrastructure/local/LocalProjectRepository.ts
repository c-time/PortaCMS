/**
 * Local file-based implementation of ProjectRepository
 * Stores project data in a single JSON file
 */

import type { ProjectRepository } from '../../application/ports/ProjectRepository.js';
import type { Project } from '../../domain/workspace/entities.js';
import type { LocalStorageConfig, StorageFiles } from './types.js';
import { DEFAULT_LOCAL_STORAGE_CONFIG } from './types.js';
import { LocalStorageFiles } from './LocalStorageFiles.js';
import { readJsonFile, writeJsonFile, fileExists } from './utils.js';

export class LocalProjectRepository implements ProjectRepository {
  private readonly config: LocalStorageConfig;
  private readonly storageFiles: StorageFiles;

  constructor(config: Partial<LocalStorageConfig> = {}) {
    this.config = { ...DEFAULT_LOCAL_STORAGE_CONFIG, ...config };
    this.storageFiles = new LocalStorageFiles(this.config.baseDir);
  }

  async get(): Promise<Project | null> {
    return await readJsonFile<Project>(this.storageFiles.projectConfigFile());
  }

  async save(project: Project): Promise<void> {
    await writeJsonFile(this.storageFiles.projectConfigFile(), project, this.config);
  }

  async exists(): Promise<boolean> {
    return await fileExists(this.storageFiles.projectConfigFile());
  }
}
