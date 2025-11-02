import { Project } from '../../domain/workspace/entities.js';

/**
 * Repository interface for Project aggregate root
 * Manages the lifecycle of projects in the system
 */
export interface ProjectRepository {
  /**
   * Retrieves the project (singleton in the system)
   * @returns The project instance or null if not initialized
   */
  get(): Promise<Project | null>;

  /**
   * Saves or updates the project
   * @param project - The project to save
   */
  save(project: Project): Promise<void>;

  /**
   * Checks if a project exists in the system
   * @returns true if project exists, false otherwise
   */
  exists(): Promise<boolean>;
}
