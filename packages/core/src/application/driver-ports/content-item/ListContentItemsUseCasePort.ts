import { z } from 'zod';
import { WorkspaceSlugSchema, ContentModelSlugSchema, ContentItemSlugSchema } from '../../../domain/shared/entities.js';
import { ContentItemId } from '../../../domain/shared/ids.js';

// ========================================
// Input/Output Schemas
// ========================================

export const ListContentItemsInputSchema = z.object({
  workspaceSlug: WorkspaceSlugSchema,
  contentModelSlug: ContentModelSlugSchema,
  status: z.enum(['draft', 'published', 'archived']).optional(),
  limit: z.number().int().min(1).max(100).optional(),
  offset: z.number().int().min(0).optional(),
});

export type ListContentItemsInput = z.infer<typeof ListContentItemsInputSchema>;

export const ContentItemSummarySchema = z.object({
  id: ContentItemId,
  slug: ContentItemSlugSchema,
  status: z.enum(['draft', 'published', 'archived']),
  createdAt: z.date(),
  updatedAt: z.date(),
  version: z.number().int(),
  fieldCount: z.number().int(),
});

export type ContentItemSummary = z.infer<typeof ContentItemSummarySchema>;

export const ListContentItemsOutputSchema = z.object({
  workspaceSlug: WorkspaceSlugSchema,
  contentModelSlug: ContentModelSlugSchema,
  contentItems: z.array(ContentItemSummarySchema),
  totalCount: z.number().int().min(0),
  draftCount: z.number().int().min(0),
  publishedCount: z.number().int().min(0),
  archivedCount: z.number().int().min(0),
});

export type ListContentItemsOutput = z.infer<typeof ListContentItemsOutputSchema>;

// ========================================
// Driver Port (Primary Port)
// ========================================

/**
 * Driver port for listing content items
 * Defines the contract for content items listing use case
 *
 * This is a primary port in hexagonal architecture that defines
 * how external actors (e.g., CLI, API, UI) can interact with the
 * application to list content items.
 */
export interface ListContentItemsUseCasePort {
  /**
   * Executes the list content items use case
   *
   * @param input - The listing parameters (filters, pagination)
   * @returns The list of content items with summary statistics
   * @throws {WorkspaceNotFoundError} If the workspace does not exist
   * @throws {ContentModelNotFoundError} If the content model does not exist
   */
  execute(input: ListContentItemsInput): Promise<ListContentItemsOutput>;
}
