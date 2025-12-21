/**
 * Local File-Based Repository Factory
 *
 * Creates repository instances that use local file storage
 */

import type { RepositoryFactory } from './RepositoryFactory.js';
import type { LocalStorageConfig, StorageFiles } from '../local/types.js';

import { LocalProjectRepository } from '../local/LocalProjectRepository.js';
import { LocalWorkspaceRepository } from '../local/LocalWorkspaceRepository.js';
import { LocalArtifactStructureRepository } from '../local/LocalArtifactStructureRepository.js';
import { LocalContentModelRepository } from '../local/LocalContentModelRepository.js';
import { LocalContentItemRepository } from '../local/LocalContentItemRepository.js';
import { DefaultStorageFiles } from '../local/DefaultStorageFiles.js';

import type { ProjectRepository } from '../../application/driven-ports/ProjectRepository.js';
import type { WorkspaceRepository } from '../../application/driven-ports/WorkspaceRepository.js';
import type { ArtifactStructureRepository } from '../../application/driven-ports/ArtifactStructureRepository.js';
import type { ContentModelRepository } from '../../application/driven-ports/ContentModelRepository.js';
import type { ContentItemRepository } from '../../application/driven-ports/ContentItemRepository.js';
import type { JobRepository } from '../../application/driven-ports/JobRepository.js';

/**
 * Factory for creating local file-based repository instances
 *
 * @example
 * ```typescript
 * const factory = new LocalRepositoryFactory({
 *   baseDir: './data',
 *   prettyPrint: true
 * });
 * const projectRepo = factory.createProjectRepository();
 * ```
 */
export class LocalRepositoryFactory implements RepositoryFactory {
  private readonly storageFiles: StorageFiles;

  constructor(private readonly config: LocalStorageConfig) {
    this.storageFiles = new DefaultStorageFiles(config);
  }

  createProjectRepository(): ProjectRepository {
    return new LocalProjectRepository(this.storageFiles, this.config);
  }

  createWorkspaceRepository(): WorkspaceRepository {
    return new LocalWorkspaceRepository(this.storageFiles, this.config);
  }

  createArtifactStructureRepository(): ArtifactStructureRepository {
    return new LocalArtifactStructureRepository(this.storageFiles, this.config);
  }

  createContentModelRepository(): ContentModelRepository {
    return new LocalContentModelRepository(this.storageFiles, this.config);
  }

  createContentItemRepository(): ContentItemRepository {
    return new LocalContentItemRepository(this.storageFiles, this.config);
  }

  createJobRepository(): JobRepository {
    // TODO: Implement LocalJobRepository when available
    throw new Error('LocalJobRepository not yet implemented');
  }
}
