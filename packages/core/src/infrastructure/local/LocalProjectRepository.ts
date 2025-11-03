/**
 * Local file-based implementation of ProjectRepository
 * Stores project data in a single JSON file
 */

import type { ProjectRepository } from '../../application/ports/ProjectRepository.js';
import type { Project } from '../../domain/workspace/entities.js';
import type { LocalStorageConfig } from './types.js';
import { DEFAULT_LOCAL_STORAGE_CONFIG, LOCAL_STORAGE_PATHS } from './types.js';
import { readJsonFile, writeJsonFile, fileExists, buildPath } from './utils.js';

export class LocalProjectRepository implements ProjectRepository {
  private readonly config: LocalStorageConfig;
  private readonly projectFilePath: string;

  constructor(config: Partial<LocalStorageConfig> = {}) {
    this.config = { ...DEFAULT_LOCAL_STORAGE_CONFIG, ...config };
    this.projectFilePath = buildPath(this.config.baseDir, LOCAL_STORAGE_PATHS.PROJECT);
  }

  async get(): Promise<Project | null> {
    return await readJsonFile<Project>(this.projectFilePath);
  }

  async save(project: Project): Promise<void> {
    await writeJsonFile(this.projectFilePath, project, this.config);
  }

  async exists(): Promise<boolean> {
    return await fileExists(this.projectFilePath);
  }
}
