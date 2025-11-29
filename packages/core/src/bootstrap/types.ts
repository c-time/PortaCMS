/**
 * Bootstrap Configuration Types
 *
 * Defines the configuration interface for bootstrapping the application
 */

import type { RepositoryFactory } from '../infrastructure/factories/RepositoryFactory.js';

/**
 * Bootstrap configuration
 *
 * This configuration allows swapping infrastructure implementations
 * without changing application code.
 *
 * @example
 * ```typescript
 * // Local file-based configuration
 * const config: BootstrapConfig = {
 *   repositoryFactory: new LocalRepositoryFactory({
 *     baseDir: './data',
 *     prettyPrint: true
 *   })
 * };
 * ```
 *
 * @example
 * ```typescript
 * // Remote API-based configuration (future)
 * const config: BootstrapConfig = {
 *   repositoryFactory: new RemoteRepositoryFactory({
 *     apiUrl: 'https://api.example.com',
 *     apiKey: process.env.API_KEY
 *   })
 * };
 * ```
 */
export interface BootstrapConfig {
  /**
   * Repository factory for creating repository instances
   *
   * The factory determines which infrastructure implementation to use:
   * - LocalRepositoryFactory: File-based storage
   * - RemoteRepositoryFactory: API-based storage (future)
   * - InMemoryRepositoryFactory: In-memory storage for testing
   */
  repositoryFactory: RepositoryFactory;
}
