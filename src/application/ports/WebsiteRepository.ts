import { Website } from '../../domain/website/entities';
import { WorkspaceSlug } from '../../domain/shared/entities';

/**
 * Repository interface for Website aggregate root
 * Manages website configurations per workspace
 */
export interface WebsiteRepository {
  /**
   * Finds a website configuration for a specific workspace
   * @param workspaceSlug - The workspace identifier
   * @returns The website configuration or null if not found
   */
  findByWorkspace(workspaceSlug: WorkspaceSlug): Promise<Website | null>;

  /**
   * Saves or updates a website configuration
   * @param workspaceSlug - The workspace identifier
   * @param website - The website configuration to save
   */
  save(workspaceSlug: WorkspaceSlug, website: Website): Promise<void>;

  /**
   * Deletes a website configuration for a workspace
   * @param workspaceSlug - The workspace identifier
   */
  delete(workspaceSlug: WorkspaceSlug): Promise<void>;

  /**
   * Checks if a website configuration exists for the workspace
   * @param workspaceSlug - The workspace identifier
   * @returns true if exists, false otherwise
   */
  exists(workspaceSlug: WorkspaceSlug): Promise<boolean>;
}
