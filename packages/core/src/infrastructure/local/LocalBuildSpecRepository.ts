/**
 * Local file-based implementation of BuildSpecRepository
 * Stores build specification configurations per workspace in the build-specs directory
 */

import type { BuildSpecRepository } from '../../application/driven-ports/BuildSpecRepository.js';
import type { BuildSpec } from '../../domain/build-spec/entities.js';
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
 * Internal storage format for BuildSpec (with serialized dates)
 */
interface BuildSpecStorageFormat {
  name: string;
  description?: string;
  pagesStructure: unknown;
  createdAt: string;
  updatedAt: string;
}

export class LocalBuildSpecRepository implements BuildSpecRepository {
  constructor(
    private readonly storageFiles: StorageFiles,
    private readonly config: LocalStorageConfig
  ) {}

  async findByWorkspace(workspaceSlug: WorkspaceSlug): Promise<BuildSpec | null> {
    const data = await readJsonFile<BuildSpecStorageFormat>(
      this.storageFiles.buildSpecConfigFile(workspaceSlug)
    );

    if (!data) {
      return null;
    }

    return deserialize<BuildSpec>(data, ['createdAt', 'updatedAt']);
  }

  async save(workspaceSlug: WorkspaceSlug, buildSpec: BuildSpec): Promise<void> {
    const serialized = serialize(buildSpec);
    await writeJsonFile(
      this.storageFiles.buildSpecConfigFile(workspaceSlug),
      serialized,
      this.config.prettyPrint,
      this.config.autoCreateDirectories
    );
  }

  async delete(workspaceSlug: WorkspaceSlug): Promise<void> {
    await deleteFile(this.storageFiles.buildSpecConfigFile(workspaceSlug));
  }

  async exists(workspaceSlug: WorkspaceSlug): Promise<boolean> {
    return await fileExists(this.storageFiles.buildSpecConfigFile(workspaceSlug));
  }
}
