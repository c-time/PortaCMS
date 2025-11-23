/**
 * Local file-based implementation of ArtifactStructureRepository
 * Stores artifact structure configurations per workspace in the artifact-structures directory
 */

import type { ArtifactStructureRepository } from '../../application/driven-ports/ArtifactStructureRepository.js';
import type { ArtifactStructure } from '../../domain/artifact-structure/entities.js';
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
 * Internal storage format for ArtifactStructure (with serialized dates)
 */
interface ArtifactStructureStorageFormat {
  name: string;
  description?: string;
  pagesStructure: unknown;
  createdAt: string;
  updatedAt: string;
}

export class LocalArtifactStructureRepository implements ArtifactStructureRepository {
  constructor(
    private readonly storageFiles: StorageFiles,
    private readonly config: LocalStorageConfig
  ) {}

  async findByWorkspace(workspaceSlug: WorkspaceSlug): Promise<ArtifactStructure | null> {
    const data = await readJsonFile<ArtifactStructureStorageFormat>(
      this.storageFiles.artifactStructureConfigFile(workspaceSlug)
    );

    if (!data) {
      return null;
    }

    return deserialize<ArtifactStructure>(data, ['createdAt', 'updatedAt']);
  }

  async save(workspaceSlug: WorkspaceSlug, artifactStructure: ArtifactStructure): Promise<void> {
    const serialized = serialize(artifactStructure);
    await writeJsonFile(
      this.storageFiles.artifactStructureConfigFile(workspaceSlug),
      serialized,
      this.config.prettyPrint,
      this.config.autoCreateDirectories
    );
  }

  async delete(workspaceSlug: WorkspaceSlug): Promise<void> {
    await deleteFile(this.storageFiles.artifactStructureConfigFile(workspaceSlug));
  }

  async exists(workspaceSlug: WorkspaceSlug): Promise<boolean> {
    return await fileExists(this.storageFiles.artifactStructureConfigFile(workspaceSlug));
  }
}
