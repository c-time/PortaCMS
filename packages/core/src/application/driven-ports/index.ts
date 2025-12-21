/**
 * Application Ports - Repository Interfaces
 *
 * This module exports all repository interfaces that define the contracts
 * for persisting and retrieving domain aggregates.
 *
 * Repository Pattern:
 * - Repositories provide an abstraction over data persistence
 * - Each aggregate root has its own repository
 * - Repositories hide implementation details from the domain layer
 */

export { ProjectRepository } from './ProjectRepository.js';
export { WorkspaceRepository } from './WorkspaceRepository.js';
export { BuildSpecRepository } from './BuildSpecRepository.js';
export { ContentModelRepository } from './ContentModelRepository.js';
export { ContentItemRepository, ContentItemQueryOptions, ContentItemIdType } from './ContentItemRepository.js';
export { JobRepository } from './JobRepository.js';
