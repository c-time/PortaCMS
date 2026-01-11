import { z } from 'zod';
import { WorkspaceSlugSchema, ContentModelSlugSchema, ContentItemSlugSchema } from '../../../domain/shared/entities.js';
import { ContentItemId } from '../../../domain/shared/ids.js';
import { ContentItemFieldSchema } from '../../../domain/content-item/entities.js';

// ========================================
// Input/Output Schemas
// ========================================

export const CreateContentItemInputSchema = z.object({
  workspaceSlug: WorkspaceSlugSchema,
  contentModelSlug: ContentModelSlugSchema,
  slug: ContentItemSlugSchema,
  fields: z.array(ContentItemFieldSchema).optional(),
  categories: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  generateSampleData: z.boolean().default(true),
});

export type CreateContentItemInput = z.infer<typeof CreateContentItemInputSchema>;

export const CreateContentItemOutputSchema = z.object({
  contentItem: z.object({
    id: ContentItemId,
    slug: ContentItemSlugSchema,
    status: z.enum(['draft', 'published', 'archived']),
    fields: z.array(ContentItemFieldSchema),
    createdAt: z.date(),
    version: z.number(),
  }),
});

export type CreateContentItemOutput = z.infer<typeof CreateContentItemOutputSchema>;

// ========================================
// Driver Port (Primary Port)
// ========================================

/**
 * Driver port for creating a new content item
 * Defines the contract for content item creation use case
 *
 * This is a primary port in hexagonal architecture that defines
 * how external actors (e.g., CLI, API, UI) can interact with the
 * application to create content items.
 */
export interface CreateContentItemUseCasePort {
  /**
   * Executes the create content item use case
   *
   * @param input - The content item creation parameters
   * @returns The created content item
   * @throws {WorkspaceNotFoundError} If the workspace does not exist
   * @throws {ContentModelNotFoundError} If the content model does not exist
   * @throws {ContentItemAlreadyExistsError} If a content item with the same slug already exists
   */
  execute(input: CreateContentItemInput): Promise<CreateContentItemOutput>;
}
