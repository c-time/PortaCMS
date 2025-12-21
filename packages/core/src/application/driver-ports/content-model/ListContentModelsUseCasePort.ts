import { z } from 'zod';
import { WorkspaceSlugSchema, ContentModelSlugSchema } from '../../../domain/shared/entities.js';

// ========================================
// Input/Output Schemas
// ========================================

export const ListContentModelsInputSchema = z.object({
  workspaceSlug: WorkspaceSlugSchema,
});

export type ListContentModelsInput = z.infer<typeof ListContentModelsInputSchema>;

export const ContentModelSummarySchema = z.object({
  slug: ContentModelSlugSchema,
  label: z.string(),
  modelType: z.enum(['list', 'object']),
  description: z.string().optional(),
  isActive: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type ContentModelSummary = z.infer<typeof ContentModelSummarySchema>;

export const ListContentModelsOutputSchema = z.object({
  workspaceSlug: WorkspaceSlugSchema,
  contentModels: z.array(ContentModelSummarySchema),
  totalCount: z.number().int().min(0),
  listCount: z.number().int().min(0),
  objectCount: z.number().int().min(0),
});

export type ListContentModelsOutput = z.infer<typeof ListContentModelsOutputSchema>;

// ========================================
// Driver Port (Primary Port)
// ========================================

/**
 * Driver port for listing all content models in a workspace
 * Defines the contract for content model listing use case
 *
 * This is a primary port in hexagonal architecture that defines
 * how external actors (e.g., CLI, API, UI) can interact with the
 * application to list content models.
 */
export interface ListContentModelsUseCasePort {
  /**
   * Executes the list content models use case
   *
   * Retrieves all content models in a workspace and returns summary information.
   *
   * @param input - The listing parameters (workspace slug)
   * @returns List of content models with summary statistics
   * @throws {WorkspaceNotFoundError} If the workspace does not exist
   */
  execute(input: ListContentModelsInput): Promise<ListContentModelsOutput>;
}
