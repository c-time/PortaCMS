/**
 * Local File-Based Repository Factory
 *
 * Creates repository instances that use local file storage
 */

import type { RepositoryFactory } from './RepositoryFactory.js';
import type { LocalStorageConfig, StorageFiles } from '../local/types.js';

import { LocalProjectRepository } from '../local/LocalProjectRepository.js';
import { LocalWorkspaceRepository } from '../local/LocalWorkspaceRepository.js';
import { LocalBuildSpecRepository } from '../local/LocalBuildSpecRepository.js';
import { LocalContentModelRepository } from '../local/LocalContentModelRepository.js';
import { LocalContentItemRepository } from '../local/LocalContentItemRepository.js';
import { DefaultStorageFiles } from '../local/DefaultStorageFiles.js';
import { UUIDv4Generator } from '../effects/UUIDv4Generator.js';

import type { ProjectRepository } from '../../application/driven-ports/ProjectRepository.js';
import type { WorkspaceRepository } from '../../application/driven-ports/WorkspaceRepository.js';
import type { BuildSpecRepository } from '../../application/driven-ports/BuildSpecRepository.js';
import type { ContentModelRepository } from '../../application/driven-ports/ContentModelRepository.js';
import type { ContentItemRepository } from '../../application/driven-ports/ContentItemRepository.js';
import type { JobRepository } from '../../application/driven-ports/JobRepository.js';
import type { UUIDPort } from '../../application/driven-ports/UUIDPort.js';

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

  createBuildSpecRepository(): BuildSpecRepository {
    return new LocalBuildSpecRepository(this.storageFiles, this.config);
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

  createUUIDGenerator(): UUIDPort {
    return new UUIDv4Generator();
  }
}
