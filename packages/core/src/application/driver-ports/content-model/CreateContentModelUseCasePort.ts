import { z } from 'zod';
import { ContentModelSlugSchema, WorkspaceSlugSchema } from '../../../domain/shared/entities.js';

// ========================================
// Input/Output Schemas
// ========================================

export const CreateContentModelInputSchema = z.object({
  workspaceSlug: WorkspaceSlugSchema,
  slug: ContentModelSlugSchema,
  label: z.string().min(1, 'Label is required'),
  modelType: z.enum(['list', 'object']),
  description: z.string().optional(),
  documentUrl: z.string().url().optional(),
  isActive: z.boolean().optional(),
  enablePublishScheduling: z.boolean().optional(),
  enableCategories: z.boolean().optional(),
  orderValue: z.number().int().optional(),
});

export type CreateContentModelInput = z.infer<typeof CreateContentModelInputSchema>;

export const CreateContentModelOutputSchema = z.object({
  contentModel: z.object({
    slug: ContentModelSlugSchema,
    label: z.string(),
    modelType: z.enum(['list', 'object']),
    description: z.string().optional(),
    documentUrl: z.string().optional(),
    isActive: z.boolean(),
    enablePublishScheduling: z.boolean(),
    orderValue: z.number(),
  }),
});

export type CreateContentModelOutput = z.infer<typeof CreateContentModelOutputSchema>;

// ========================================
// Driver Port (Primary Port)
// ========================================

/**
 * Driver port for creating a new content model
 * Defines the contract for content model creation use case
 *
 * This is a primary port in hexagonal architecture that defines
 * how external actors (e.g., CLI, API, UI) can interact with the
 * application to create content models.
 */
export interface CreateContentModelUseCasePort {
  /**
   * Executes the create content model use case
   *
   * @param input - The content model creation parameters
   * @returns The created content model
   * @throws {WorkspaceNotFoundError} If the workspace does not exist
   * @throws {ContentModelAlreadyExistsError} If a content model with the same slug already exists
   */
  execute(input: CreateContentModelInput): Promise<CreateContentModelOutput>;
}
