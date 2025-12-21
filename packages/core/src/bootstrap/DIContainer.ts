/**
 * Dependency Injection Container
 *
 * Central place for resolving all dependencies and creating application instances.
 * This class manages:
 * - Repository instances (singleton)
 * - UseCase instances
 * - Application facade
 */

import type { BootstrapConfig } from './types.js';

// ========================================
// Repository Interfaces (Driven Ports)
// ========================================

import type { ProjectRepository } from '../application/driven-ports/ProjectRepository.js';
import type { WorkspaceRepository } from '../application/driven-ports/WorkspaceRepository.js';
import type { BuildSpecRepository } from '../application/driven-ports/BuildSpecRepository.js';
import type { ContentModelRepository } from '../application/driven-ports/ContentModelRepository.js';
import type { ContentItemRepository } from '../application/driven-ports/ContentItemRepository.js';
import type { JobRepository } from '../application/driven-ports/JobRepository.js';

// ========================================
// UseCase Imports
// ========================================

import { CreateWorkspaceUseCase } from '../application/use-cases/workspace/CreateWorkspaceUseCase.js';
import { CreateContentModelUseCase } from '../application/use-cases/content-model/CreateContentModelUseCase.js';

/**
 * DI Container
 *
 * Manages all application dependencies and provides a single entry point
 * for creating the application instance.
 *
 * @example
 * ```typescript
 * // Configure with local file-based repositories
 * const config: BootstrapConfig = {
 *   repositoryFactory: new LocalRepositoryFactory({
 *     baseDir: './data'
 *   })
 * };
 *
 * // Initialize container
 * DIContainer.initialize(config);
 *
 * // Create application instance
 * const app = DIContainer.createApplication();
 * ```
 *
 * @example
 * ```typescript
 * // For testing: override with mock repositories
 * DIContainer.reset();
 * DIContainer.override({
 *   projectRepository: new InMemoryProjectRepository()
 * });
 * const app = DIContainer.createApplication();
 * ```
 */
export class DIContainer {
  // ========================================
  // Configuration
  // ========================================

  private static config: BootstrapConfig | null = null;

  // ========================================
  // Repository Singletons
  // ========================================

  private static projectRepository: ProjectRepository | null = null;
  private static workspaceRepository: WorkspaceRepository | null = null;
  private static buildSpecRepository: BuildSpecRepository | null = null;
  private static contentModelRepository: ContentModelRepository | null = null;
  private static contentItemRepository: ContentItemRepository | null = null;
  private static jobRepository: JobRepository | null = null;

  // ========================================
  // Initialization
  // ========================================

  /**
   * Initialize the DI Container with configuration
   *
   * Must be called before creating any instances.
   *
   * @param config - Bootstrap configuration including repository factory
   */
  static initialize(config: BootstrapConfig): void {
    this.config = config;
  }

  /**
   * Ensure container is initialized
   *
   * @throws {Error} If container is not initialized
   */
  private static ensureInitialized(): void {
    if (!this.config) {
      throw new Error(
        'DIContainer is not initialized. Call DIContainer.initialize(config) first.'
      );
    }
  }

  // ========================================
  // Repository Getters (Singleton)
  // ========================================

  /**
   * Get ProjectRepository instance (Singleton)
   */
  private static getProjectRepository(): ProjectRepository {
    this.ensureInitialized();

    if (!this.projectRepository) {
      this.projectRepository = this.config!.repositoryFactory.createProjectRepository();
    }
    return this.projectRepository;
  }

  /**
   * Get WorkspaceRepository instance (Singleton)
   */
  private static getWorkspaceRepository(): WorkspaceRepository {
    this.ensureInitialized();

    if (!this.workspaceRepository) {
      this.workspaceRepository = this.config!.repositoryFactory.createWorkspaceRepository();
    }
    return this.workspaceRepository;
  }

  /**
   * Get BuildSpecRepository instance (Singleton)
   */
  // @ts-expect-error - This method will be used when build spec use cases are added
  private static getBuildSpecRepository(): BuildSpecRepository {
    this.ensureInitialized();

    if (!this.buildSpecRepository) {
      this.buildSpecRepository = this.config!.repositoryFactory.createBuildSpecRepository();
    }
    return this.buildSpecRepository;
  }

  /**
   * Get ContentModelRepository instance (Singleton)
   */
  private static getContentModelRepository(): ContentModelRepository {
    this.ensureInitialized();

    if (!this.contentModelRepository) {
      this.contentModelRepository = this.config!.repositoryFactory.createContentModelRepository();
    }
    return this.contentModelRepository;
  }

  /**
   * Get ContentItemRepository instance (Singleton)
   */
  // @ts-expect-error - This method will be used when content item use cases are added
  private static getContentItemRepository(): ContentItemRepository {
    this.ensureInitialized();

    if (!this.contentItemRepository) {
      this.contentItemRepository = this.config!.repositoryFactory.createContentItemRepository();
    }
    return this.contentItemRepository;
  }

  /**
   * Get JobRepository instance (Singleton)
   */
  // @ts-expect-error - This method will be used when job use cases are added
  private static getJobRepository(): JobRepository {
    this.ensureInitialized();

    if (!this.jobRepository) {
      this.jobRepository = this.config!.repositoryFactory.createJobRepository();
    }
    return this.jobRepository;
  }

  // ========================================
  // UseCase Factory Methods
  // ========================================

  /**
   * Create CreateWorkspaceUseCase instance
   */
  private static createCreateWorkspaceUseCase(): CreateWorkspaceUseCase {
    return new CreateWorkspaceUseCase(
      this.getWorkspaceRepository(),
      this.getProjectRepository()
    );
  }

  /**
   * Create CreateContentModelUseCase instance
   */
  private static createCreateContentModelUseCase(): CreateContentModelUseCase {
    return new CreateContentModelUseCase(
      this.getWorkspaceRepository(),
      this.getContentModelRepository()
    );
  }

  // TODO: Add other UseCase factory methods as needed
  // private static createArchiveProjectUseCase(): ArchiveProjectUseCase { ... }
  // private static createListProjectsUseCase(): ListProjectsUseCase { ... }

  // ========================================
  // Application Factory (Entry Point)
  // ========================================

  /**
   * Create Application instance
   *
   * This is the main entry point for getting a configured application instance.
   * All dependencies are resolved and injected.
   *
   * @returns Application instance with all use cases
   *
   * @example
   * ```typescript
   * const app = DIContainer.createApplication();
   * const result = await app.workspace.create({ slug: 'production' });
   * ```
   */
  static createApplication(): Application {
    this.ensureInitialized();

    return new Application({
      workspace: {
        create: this.createCreateWorkspaceUseCase(),
        // TODO: Add other workspace use cases
      },
      contentModel: {
        create: this.createCreateContentModelUseCase(),
        // TODO: Add other content model use cases
      },
      // TODO: Add other domain use case groups
      // project: { ... },
      // website: { ... },
      // contentItem: { ... },
    });
  }

  // ========================================
  // Testing Utilities
  // ========================================

  /**
   * Reset all dependencies
   *
   * Useful for testing to ensure clean state between tests.
   *
   * @example
   * ```typescript
   * beforeEach(() => {
   *   DIContainer.reset();
   * });
   * ```
   */
  static reset(): void {
    this.config = null;
    this.projectRepository = null;
    this.workspaceRepository = null;
    this.buildSpecRepository = null;
    this.contentModelRepository = null;
    this.contentItemRepository = null;
    this.jobRepository = null;
  }

  /**
   * Override specific dependencies
   *
   * Useful for testing to inject mock implementations.
   *
   * @param overrides - Partial repository overrides
   *
   * @example
   * ```typescript
   * DIContainer.override({
   *   projectRepository: new InMemoryProjectRepository(),
   *   workspaceRepository: new InMemoryWorkspaceRepository()
   * });
   * ```
   */
  static override(overrides: {
    projectRepository?: ProjectRepository;
    workspaceRepository?: WorkspaceRepository;
    buildSpecRepository?: BuildSpecRepository;
    contentModelRepository?: ContentModelRepository;
    contentItemRepository?: ContentItemRepository;
    jobRepository?: JobRepository;
  }): void {
    if (overrides.projectRepository) this.projectRepository = overrides.projectRepository;
    if (overrides.workspaceRepository) this.workspaceRepository = overrides.workspaceRepository;
    if (overrides.buildSpecRepository) this.buildSpecRepository = overrides.buildSpecRepository;
    if (overrides.contentModelRepository)
      this.contentModelRepository = overrides.contentModelRepository;
    if (overrides.contentItemRepository)
      this.contentItemRepository = overrides.contentItemRepository;
    if (overrides.jobRepository) this.jobRepository = overrides.jobRepository;
  }
}

// ========================================
// Application Facade Type
// ========================================

/**
 * Application facade type
 *
 * Groups all use cases by domain for easy access.
 */
type ApplicationUseCases = {
  workspace: {
    create: CreateWorkspaceUseCase;
    // TODO: Add other workspace use cases
    // list: ListWorkspacesUseCase;
    // update: UpdateWorkspaceUseCase;
    // delete: DeleteWorkspaceUseCase;
  };
  contentModel: {
    create: CreateContentModelUseCase;
    // TODO: Add other content model use cases
    // list: ListContentModelsUseCase;
    // update: UpdateContentModelUseCase;
    // delete: DeleteContentModelUseCase;
  };
  // TODO: Add other domain groups
  // project: { ... };
  // website: { ... };
  // contentItem: { ... };
};

/**
 * Application facade implementation
 *
 * Simple container for organizing use cases by domain.
 */
class Application {
  workspace: ApplicationUseCases['workspace'];
  contentModel: ApplicationUseCases['contentModel'];

  constructor(useCases: ApplicationUseCases) {
    this.workspace = useCases.workspace;
    this.contentModel = useCases.contentModel;
  }
}
