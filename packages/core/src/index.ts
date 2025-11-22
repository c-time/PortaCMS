/**
 * @porta-cms/core
 *
 * Core library for PortaCMS - provides the main entry point for application configuration.
 *
 * This module exports the bootstrap layer as the primary public API.
 * Other layers (domain, application, infrastructure) are internal implementation details.
 *
 * @example
 * ```typescript
 * import { configureApp, LocalRepositoryFactory } from '@porta-cms/core';
 *
 * const app = configureApp({
 *   repositoryFactory: new LocalRepositoryFactory({
 *     baseDir: './data',
 *     prettyPrint: true
 *   })
 * });
 *
 * await app.workspace.create({ slug: 'my-workspace' });
 * ```
 */

// Bootstrap Layer - Main Entry Point
export * from './bootstrap/index.js';