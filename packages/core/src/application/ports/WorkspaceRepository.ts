import { Workspace } from '../../domain/workspace/entities';
import { WorkspaceSlug } from '../../domain/shared/entities';

/**
 * Repository interface for Workspace aggregate root
 * Manages workspaces (environments/stages) within a project
 */
export interface WorkspaceRepository {
  /**
   * Finds a workspace by its slug
   * @param slug - The unique slug identifier
   * @returns The workspace or null if not found
   */
  findBySlug(slug: WorkspaceSlug): Promise<Workspace | null>;

  /**
   * Retrieves all workspaces in the project
   * @returns Array of all workspaces
   */
  findAll(): Promise<Workspace[]>;

  /**
   * Saves a new workspace or updates an existing one
   * @param workspace - The workspace to save
   */
  save(workspace: Workspace): Promise<void>;

  /**
   * Deletes a workspace by its slug
   * @param slug - The slug of the workspace to delete
   */
  delete(slug: WorkspaceSlug): Promise<void>;

  /**
   * Checks if a workspace with the given slug exists
   * @param slug - The slug to check
   * @returns true if exists, false otherwise
   */
  exists(slug: WorkspaceSlug): Promise<boolean>;
}
