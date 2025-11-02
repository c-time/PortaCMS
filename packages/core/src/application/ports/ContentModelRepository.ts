import { ContentModel, ListContentModel, ObjectContentModel } from '../../domain/content-model/entities';
import { ContentModelSlug, WorkspaceSlug } from '../../domain/shared/entities';

/**
 * Repository interface for ContentModel aggregate root
 * Manages content model definitions (both List and Object types)
 */
export interface ContentModelRepository {
  /**
   * Finds a content model by its slug within a workspace
   * @param workspaceSlug - The workspace identifier
   * @param slug - The content model slug
   * @returns The content model or null if not found
   */
  findBySlug(workspaceSlug: WorkspaceSlug, slug: ContentModelSlug): Promise<ContentModel | null>;

  /**
   * Retrieves all content models in a workspace
   * @param workspaceSlug - The workspace identifier
   * @returns Array of all content models
   */
  findAll(workspaceSlug: WorkspaceSlug): Promise<ContentModel[]>;

  /**
   * Retrieves all list content models in a workspace
   * @param workspaceSlug - The workspace identifier
   * @returns Array of list content models
   */
  findAllListModels(workspaceSlug: WorkspaceSlug): Promise<ListContentModel[]>;

  /**
   * Retrieves all object content models in a workspace
   * @param workspaceSlug - The workspace identifier
   * @returns Array of object content models
   */
  findAllObjectModels(workspaceSlug: WorkspaceSlug): Promise<ObjectContentModel[]>;

  /**
   * Saves a new content model or updates an existing one
   * @param workspaceSlug - The workspace identifier
   * @param contentModel - The content model to save
   */
  save(workspaceSlug: WorkspaceSlug, contentModel: ContentModel): Promise<void>;

  /**
   * Deletes a content model by its slug
   * @param workspaceSlug - The workspace identifier
   * @param slug - The slug of the content model to delete
   */
  delete(workspaceSlug: WorkspaceSlug, slug: ContentModelSlug): Promise<void>;

  /**
   * Checks if a content model with the given slug exists
   * @param workspaceSlug - The workspace identifier
   * @param slug - The slug to check
   * @returns true if exists, false otherwise
   */
  exists(workspaceSlug: WorkspaceSlug, slug: ContentModelSlug): Promise<boolean>;
}
