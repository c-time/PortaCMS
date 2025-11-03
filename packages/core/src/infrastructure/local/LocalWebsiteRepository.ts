/**
 * Local file-based implementation of WebsiteRepository
 * Stores website configurations per workspace in the websites directory
 */

import type { WebsiteRepository } from '../../application/ports/WebsiteRepository.js';
import type { Website } from '../../domain/website/entities.js';
import type { WorkspaceSlug } from '../../domain/shared/entities.js';
import type { LocalStorageConfig } from './types.js';
import { DEFAULT_LOCAL_STORAGE_CONFIG, LOCAL_STORAGE_PATHS } from './types.js';
import {
  readJsonFile,
  writeJsonFile,
  deleteFile,
  fileExists,
  buildPath,
  deserialize,
  serialize,
} from './utils.js';

/**
 * Internal storage format for Website (with serialized dates)
 */
interface WebsiteStorageFormat {
  name: string;
  description?: string;
  websiteStructure: unknown;
  createdAt: string;
  updatedAt: string;
}

export class LocalWebsiteRepository implements WebsiteRepository {
  private readonly config: LocalStorageConfig;
  private readonly websitesDir: string;

  constructor(config: Partial<LocalStorageConfig> = {}) {
    this.config = { ...DEFAULT_LOCAL_STORAGE_CONFIG, ...config };
    this.websitesDir = buildPath(this.config.baseDir, LOCAL_STORAGE_PATHS.WEBSITES);
  }

  private getWebsiteFilePath(workspaceSlug: WorkspaceSlug): string {
    return buildPath(this.websitesDir, `${workspaceSlug}.json`);
  }

  async findByWorkspace(workspaceSlug: WorkspaceSlug): Promise<Website | null> {
    const filePath = this.getWebsiteFilePath(workspaceSlug);
    const data = await readJsonFile<WebsiteStorageFormat>(filePath);

    if (!data) {
      return null;
    }

    return deserialize<Website>(data, ['createdAt', 'updatedAt']);
  }

  async save(workspaceSlug: WorkspaceSlug, website: Website): Promise<void> {
    const filePath = this.getWebsiteFilePath(workspaceSlug);
    const serialized = serialize(website);
    await writeJsonFile(filePath, serialized, this.config);
  }

  async delete(workspaceSlug: WorkspaceSlug): Promise<void> {
    const filePath = this.getWebsiteFilePath(workspaceSlug);
    await deleteFile(filePath);
  }

  async exists(workspaceSlug: WorkspaceSlug): Promise<boolean> {
    const filePath = this.getWebsiteFilePath(workspaceSlug);
    return await fileExists(filePath);
  }
}
