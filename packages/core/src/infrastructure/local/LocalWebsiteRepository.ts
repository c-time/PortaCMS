/**
 * Local file-based implementation of WebsiteRepository
 * Stores website configurations per workspace in the websites directory
 */

import type { WebsiteRepository } from '../../application/ports/WebsiteRepository.js';
import type { Website } from '../../domain/website/entities.js';
import type { WorkspaceSlug } from '../../domain/shared/entities.js';
import type { LocalStorageConfig, StorageFiles } from './types.js';
import {
  readJsonFile,
  writeJsonFile,
  deleteFile,
  fileExists,
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
  constructor(
    private readonly storageFiles: StorageFiles,
    private readonly config: LocalStorageConfig
  ) {}

  async findByWorkspace(workspaceSlug: WorkspaceSlug): Promise<Website | null> {
    const data = await readJsonFile<WebsiteStorageFormat>(
      this.storageFiles.websiteConfigFile(workspaceSlug)
    );

    if (!data) {
      return null;
    }

    return deserialize<Website>(data, ['createdAt', 'updatedAt']);
  }

  async save(workspaceSlug: WorkspaceSlug, website: Website): Promise<void> {
    const serialized = serialize(website);
    await writeJsonFile(this.storageFiles.websiteConfigFile(workspaceSlug), serialized, this.config);
  }

  async delete(workspaceSlug: WorkspaceSlug): Promise<void> {
    await deleteFile(this.storageFiles.websiteConfigFile(workspaceSlug));
  }

  async exists(workspaceSlug: WorkspaceSlug): Promise<boolean> {
    return await fileExists(this.storageFiles.websiteConfigFile(workspaceSlug));
  }
}
