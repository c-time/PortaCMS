
/**
 * Bootstrap Layer - Application Initialization
 *
 * This module provides the entry point for configuring and initializing
 * the application with dependency injection.
 *
 * @example
 * ```typescript
 * import { configureApp, LocalRepositoryFactory } from '@porta-cms/core/bootstrap';
 *
 * // Configure with local file-based repositories
 * const app = configureApp({
 *   repositoryFactory: new LocalRepositoryFactory({
 *     baseDir: './data',
 *     prettyPrint: true
 *   })
 * });
 *
 * // Use the application
 * await app.workspace.create({ slug: 'production' });
 * ```
 */

import { DIContainer } from './DIContainer.js';
import type { BootstrapConfig } from './types.js';

/**
 * Configure and initialize the application
 *
 * This is the main entry point for setting up the application.
 * It initializes the DI container with the provided configuration
 * and returns a fully configured application instance.
 *
 * @param config - Bootstrap configuration including repository factory
 * @returns Configured application instance
 *
 * @example
 * ```typescript
 * // Local file-based configuration
 * const app = configureApp({
 *   repositoryFactory: new LocalRepositoryFactory({
 *     baseDir: './data'
 *   })
 * });
 * ```
 *
 * @example
 * ```typescript
 * // Remote API-based configuration (future)
 * const app = configureApp({
 *   repositoryFactory: new RemoteRepositoryFactory({
 *     apiUrl: 'https://api.example.com'
 *   })
 * });
 * ```
 */
export function configureApp(config: BootstrapConfig) {
  // Initialize DI Container
  DIContainer.initialize(config);

  // Create and return application instance
  return DIContainer.createApplication();
}

// ========================================
// Re-exports
// ========================================

// Export DI Container for advanced usage and testing
export { DIContainer } from './DIContainer.js';

// Export types
export type { BootstrapConfig } from './types.js';

// Export factories for convenience
export { RepositoryFactory, LocalRepositoryFactory } from '../infrastructure/factories/index.js';

// Export UseCase Input/Output types for CLI usage
export type {
  CreateContentModelInput,
  CreateContentModelOutput,
} from '../application/driver-ports/content-model/CreateContentModelUseCasePort.js';
export type {
  ValidateContentModelsInput,
  ValidateContentModelsOutput,
  ContentModelValidationResult,
} from '../application/driver-ports/content-model/ValidateContentModelsUseCasePort.js';
export type {
  ListContentModelsInput,
  ListContentModelsOutput,
  ContentModelSummary,
} from '../application/driver-ports/content-model/ListContentModelsUseCasePort.js';