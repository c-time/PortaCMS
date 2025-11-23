import { ArtifactStructure } from '../../domain/artifact-structure/entities.js';
import { WorkspaceSlug } from '../../domain/shared/entities.js';

/**
 * Repository interface for ArtifactStructure entity
 * Manages artifact structure configurations per workspace
 */
export interface ArtifactStructureRepository {
  /**
   * Finds an artifact structure configuration for a specific workspace
   * @param workspaceSlug - The workspace identifier
   * @returns The artifact structure configuration or null if not found
   */
  findByWorkspace(workspaceSlug: WorkspaceSlug): Promise<ArtifactStructure | null>;

  /**
   * Saves or updates an artifact structure configuration
   * @param workspaceSlug - The workspace identifier
   * @param artifactStructure - The artifact structure configuration to save
   */
  save(workspaceSlug: WorkspaceSlug, artifactStructure: ArtifactStructure): Promise<void>;

  /**
   * Deletes an artifact structure configuration for a workspace
   * @param workspaceSlug - The workspace identifier
   */
  delete(workspaceSlug: WorkspaceSlug): Promise<void>;

  /**
   * Checks if an artifact structure configuration exists for the workspace
   * @param workspaceSlug - The workspace identifier
   * @returns true if exists, false otherwise
   */
  exists(workspaceSlug: WorkspaceSlug): Promise<boolean>;
}
