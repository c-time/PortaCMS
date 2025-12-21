import { BuildSpec } from '../../domain/build-spec/entities.js';
import { WorkspaceSlug } from '../../domain/shared/entities.js';

/**
 * Repository interface for BuildSpec entity
 * Manages build specification configurations per workspace
 */
export interface BuildSpecRepository {
  /**
   * Finds a build specification configuration for a specific workspace
   * @param workspaceSlug - The workspace identifier
   * @returns The build specification configuration or null if not found
   */
  findByWorkspace(workspaceSlug: WorkspaceSlug): Promise<BuildSpec | null>;

  /**
   * Saves or updates a build specification configuration
   * @param workspaceSlug - The workspace identifier
   * @param buildSpec - The build specification configuration to save
   */
  save(workspaceSlug: WorkspaceSlug, buildSpec: BuildSpec): Promise<void>;

  /**
   * Deletes a build specification configuration for a workspace
   * @param workspaceSlug - The workspace identifier
   */
  delete(workspaceSlug: WorkspaceSlug): Promise<void>;

  /**
   * Checks if a build specification configuration exists for the workspace
   * @param workspaceSlug - The workspace identifier
   * @returns true if exists, false otherwise
   */
  exists(workspaceSlug: WorkspaceSlug): Promise<boolean>;
}
