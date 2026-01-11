/**
 * Repository Factory Interface
 *
 * Defines the contract for creating repository instances.
 * Different implementations can be provided (Local, Remote, InMemory, etc.)
 */

import type { ProjectRepository } from '../../application/driven-ports/ProjectRepository.js';
import type { WorkspaceRepository } from '../../application/driven-ports/WorkspaceRepository.js';
import type { BuildSpecRepository } from '../../application/driven-ports/BuildSpecRepository.js';
import type { ContentModelRepository } from '../../application/driven-ports/ContentModelRepository.js';
import type { ContentItemRepository } from '../../application/driven-ports/ContentItemRepository.js';
import type { JobRepository } from '../../application/driven-ports/JobRepository.js';
import type { UUIDPort } from '../../application/driven-ports/UUIDPort.js';

/**
 * Factory interface for creating repository instances
 *
 * This abstraction allows swapping infrastructure implementations
 * based on configuration (e.g., local file-based vs remote API-based)
 */
export interface RepositoryFactory {
  /**
   * Create a ProjectRepository instance
   */
  createProjectRepository(): ProjectRepository;

  /**
   * Create a WorkspaceRepository instance
   */
  createWorkspaceRepository(): WorkspaceRepository;

  /**
   * Create a BuildSpecRepository instance
   */
  createBuildSpecRepository(): BuildSpecRepository;

  /**
   * Create a ContentModelRepository instance
   */
  createContentModelRepository(): ContentModelRepository;

  /**
   * Create a ContentItemRepository instance
   */
  createContentItemRepository(): ContentItemRepository;

  /**
   * Create a JobRepository instance
   */
  createJobRepository(): JobRepository;

  /**
   * Create a UUIDPort instance (UUID generator)
   */
  createUUIDGenerator(): UUIDPort;
}
