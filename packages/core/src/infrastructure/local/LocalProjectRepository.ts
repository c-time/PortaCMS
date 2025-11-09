/**
 * Local file-based implementation of ProjectRepository
 * Stores project data in a single JSON file
 */

import type { ProjectRepository } from '../../application/ports/ProjectRepository.js';
import type { Project } from '../../domain/workspace/entities.js';
import type { LocalStorageConfig, StorageFiles } from './types.js';
import { readJsonFile, writeJsonFile, fileExists } from './utils.js';

export class LocalProjectRepository implements ProjectRepository {
  constructor(
    private readonly storageFiles: StorageFiles,
    private readonly config: LocalStorageConfig
  ) {}

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
