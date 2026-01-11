import { z } from 'zod';
import { WorkspaceSlugSchema, ContentModelSlugSchema, ContentItemSlugSchema } from '../../../domain/shared/entities.js';
import { ContentItemId } from '../../../domain/shared/ids.js';

// ========================================
// Input/Output Schemas
// ========================================

export const ValidateContentItemsInputSchema = z.object({
  workspaceSlug: WorkspaceSlugSchema,
  contentModelSlug: ContentModelSlugSchema,
});

export type ValidateContentItemsInput = z.infer<typeof ValidateContentItemsInputSchema>;

export const ContentItemValidationResultSchema = z.object({
  id: ContentItemId,
  slug: ContentItemSlugSchema,
  isValid: z.boolean(),
  errors: z.array(z.string()),
});

export type ContentItemValidationResult = z.infer<typeof ContentItemValidationResultSchema>;

export const ValidateContentItemsOutputSchema = z.object({
  workspaceSlug: WorkspaceSlugSchema,
  contentModelSlug: ContentModelSlugSchema,
  totalItems: z.number().int().min(0),
  validItems: z.number().int().min(0),
  invalidItems: z.number().int().min(0),
  results: z.array(ContentItemValidationResultSchema),
});

export type ValidateContentItemsOutput = z.infer<typeof ValidateContentItemsOutputSchema>;

// ========================================
// Driver Port (Primary Port)
// ========================================

/**
 * Driver port for validating content items
 * Defines the contract for content items validation use case
 *
 * This is a primary port in hexagonal architecture that defines
 * how external actors (e.g., CLI, API, UI) can interact with the
 * application to validate content items.
 */
export interface ValidateContentItemsUseCasePort {
  /**
   * Executes the validate content items use case
   *
   * @param input - The validation parameters
   * @returns The validation results with detailed error information
   * @throws {WorkspaceNotFoundError} If the workspace does not exist
   * @throws {ContentModelNotFoundError} If the content model does not exist
   */
  execute(input: ValidateContentItemsInput): Promise<ValidateContentItemsOutput>;
}
