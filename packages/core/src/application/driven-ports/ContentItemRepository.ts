import { ContentItem } from '../../domain/content-item/entities.js';
import { ContentModelSlug, ContentItemSlug, WorkspaceSlug } from '../../domain/shared/entities.js';
import { z } from 'zod';
import { ContentItemId } from '../../domain/shared/ids.js';

// Type for ContentItemId
export type ContentItemIdType = z.infer<typeof ContentItemId>;

/**
 * Query options for filtering and pagination
 */
export interface ContentItemQueryOptions {
  status?: 'draft' | 'published' | 'archived';
  categories?: string[];
  tags?: string[];
  limit?: number;
  offset?: number;
  sortBy?: 'createdAt' | 'updatedAt' | 'publishedAt';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Repository interface for ContentItem aggregate root
 * Manages content items within a workspace and content model
 */
export interface ContentItemRepository {
  /**
   * Finds a content item by its ID
   * @param workspaceSlug - The workspace identifier
   * @param contentModelSlug - The content model identifier
   * @param id - The content item ID
   * @returns The content item or null if not found
   */
  findById(
    workspaceSlug: WorkspaceSlug,
    contentModelSlug: ContentModelSlug,
    id: ContentItemIdType
  ): Promise<ContentItem | null>;

  /**
   * Finds a content item by its slug
   * @param workspaceSlug - The workspace identifier
   * @param contentModelSlug - The content model identifier
   * @param slug - The content item slug
   * @returns The content item or null if not found
   */
  findBySlug(
    workspaceSlug: WorkspaceSlug,
    contentModelSlug: ContentModelSlug,
    slug: ContentItemSlug
  ): Promise<ContentItem | null>;

  /**
   * Retrieves all content items for a content model with optional filtering
   * @param workspaceSlug - The workspace identifier
   * @param contentModelSlug - The content model identifier
   * @param options - Query options for filtering and pagination
   * @returns Array of content items
   */
  findAll(
    workspaceSlug: WorkspaceSlug,
    contentModelSlug: ContentModelSlug,
    options?: ContentItemQueryOptions
  ): Promise<ContentItem[]>;

  /**
   * Counts total content items for a content model
   * @param workspaceSlug - The workspace identifier
   * @param contentModelSlug - The content model identifier
   * @param options - Query options for filtering (without pagination)
   * @returns Total count of content items
   */
  count(
    workspaceSlug: WorkspaceSlug,
    contentModelSlug: ContentModelSlug,
    options?: Omit<ContentItemQueryOptions, 'limit' | 'offset' | 'sortBy' | 'sortOrder'>
  ): Promise<number>;

  /**
   * Finds content items by category
   * @param workspaceSlug - The workspace identifier
   * @param contentModelSlug - The content model identifier
   * @param category - The category to filter by
   * @returns Array of content items
   */
  findByCategory(
    workspaceSlug: WorkspaceSlug,
    contentModelSlug: ContentModelSlug,
    category: string
  ): Promise<ContentItem[]>;

  /**
   * Finds content items by tag
   * @param workspaceSlug - The workspace identifier
   * @param contentModelSlug - The content model identifier
   * @param tag - The tag to filter by
   * @returns Array of content items
   */
  findByTag(
    workspaceSlug: WorkspaceSlug,
    contentModelSlug: ContentModelSlug,
    tag: string
  ): Promise<ContentItem[]>;

  /**
   * Saves a new content item or updates an existing one
   * @param workspaceSlug - The workspace identifier
   * @param contentModelSlug - The content model identifier
   * @param contentItem - The content item to save
   */
  save(
    workspaceSlug: WorkspaceSlug,
    contentModelSlug: ContentModelSlug,
    contentItem: ContentItem
  ): Promise<void>;

  /**
   * Deletes a content item by its ID
   * @param workspaceSlug - The workspace identifier
   * @param contentModelSlug - The content model identifier
   * @param id - The ID of the content item to delete
   */
  delete(
    workspaceSlug: WorkspaceSlug,
    contentModelSlug: ContentModelSlug,
    id: ContentItemIdType
  ): Promise<void>;

  /**
   * Checks if a content item with the given ID exists
   * @param workspaceSlug - The workspace identifier
   * @param contentModelSlug - The content model identifier
   * @param id - The ID to check
   * @returns true if exists, false otherwise
   */
  exists(
    workspaceSlug: WorkspaceSlug,
    contentModelSlug: ContentModelSlug,
    id: ContentItemIdType
  ): Promise<boolean>;

  /**
   * Checks if a content item with the given slug exists
   * @param workspaceSlug - The workspace identifier
   * @param contentModelSlug - The content model identifier
   * @param slug - The slug to check
   * @returns true if exists, false otherwise
   */
  existsBySlug(
    workspaceSlug: WorkspaceSlug,
    contentModelSlug: ContentModelSlug,
    slug: ContentItemSlug
  ): Promise<boolean>;
}
