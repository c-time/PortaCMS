/**
 * Bootstrap Testing Utilities
 *
 * Helper functions for testing with the DI Container
 */

import { DIContainer } from './DIContainer.js';
import type { ProjectRepository } from '../application/driven-ports/ProjectRepository.js';
import type { WorkspaceRepository } from '../application/driven-ports/WorkspaceRepository.js';
import type { WebsiteRepository } from '../application/driven-ports/WebsiteRepository.js';
import type { ContentModelRepository } from '../application/driven-ports/ContentModelRepository.js';
import type { ContentItemRepository } from '../application/driven-ports/ContentItemRepository.js';
import type { JobRepository } from '../application/driven-ports/JobRepository.js';

/**
 * Reset the DI Container to a clean state
 *
 * Call this in beforeEach to ensure test isolation.
 *
 * @example
 * ```typescript
 * import { resetDIContainer } from '@porta-cms/core/bootstrap/test-helpers';
 *
 * beforeEach(() => {
 *   resetDIContainer();
 * });
 * ```
 */
export function resetDIContainer(): void {
  DIContainer.reset();
}

/**
 * Override dependencies in the DI Container
 *
 * Useful for injecting mock implementations in tests.
 *
 * @param overrides - Partial repository overrides
 *
 * @example
 * ```typescript
 * import { overrideDependencies } from '@porta-cms/core/bootstrap/test-helpers';
 * import { InMemoryWorkspaceRepository } from './mocks';
 *
 * beforeEach(() => {
 *   overrideDependencies({
 *     workspaceRepository: new InMemoryWorkspaceRepository()
 *   });
 * });
 * ```
 */
export function overrideDependencies(overrides: {
  projectRepository?: ProjectRepository;
  workspaceRepository?: WorkspaceRepository;
  websiteRepository?: WebsiteRepository;
  contentModelRepository?: ContentModelRepository;
  contentItemRepository?: ContentItemRepository;
  jobRepository?: JobRepository;
}): void {
  DIContainer.override(overrides);
}

/**
 * Setup DI Container with test configuration
 *
 * Combines reset and override in a single call.
 *
 * @param overrides - Optional repository overrides
 *
 * @example
 * ```typescript
 * import { setupTestDIContainer } from '@porta-cms/core/bootstrap/test-helpers';
 *
 * beforeEach(() => {
 *   setupTestDIContainer({
 *     workspaceRepository: new InMemoryWorkspaceRepository(),
 *     projectRepository: new InMemoryProjectRepository()
 *   });
 * });
 * ```
 */
export function setupTestDIContainer(
  overrides?: {
    projectRepository?: ProjectRepository;
    workspaceRepository?: WorkspaceRepository;
    websiteRepository?: WebsiteRepository;
    contentModelRepository?: ContentModelRepository;
    contentItemRepository?: ContentItemRepository;
    jobRepository?: JobRepository;
  }
): void {
  DIContainer.reset();
  if (overrides) {
    DIContainer.override(overrides);
  }
}
