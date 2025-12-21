import { z } from 'zod';
import { WorkspaceSlugSchema, ContentModelSlugSchema } from '../../../domain/shared/entities.js';

// ========================================
// Input/Output Schemas
// ========================================

export const ValidateContentModelsInputSchema = z.object({
  workspaceSlug: WorkspaceSlugSchema,
});

export type ValidateContentModelsInput = z.infer<typeof ValidateContentModelsInputSchema>;

export const ContentModelValidationResultSchema = z.object({
  slug: ContentModelSlugSchema,
  modelType: z.enum(['list', 'object']),
  isValid: z.boolean(),
  errors: z.array(z.string()),
});

export type ContentModelValidationResult = z.infer<typeof ContentModelValidationResultSchema>;

export const ValidateContentModelsOutputSchema = z.object({
  workspaceSlug: WorkspaceSlugSchema,
  totalModels: z.number().int().min(0),
  validModels: z.number().int().min(0),
  invalidModels: z.number().int().min(0),
  results: z.array(ContentModelValidationResultSchema),
});

export type ValidateContentModelsOutput = z.infer<typeof ValidateContentModelsOutputSchema>;

// ========================================
// Driver Port (Primary Port)
// ========================================

/**
 * Driver port for validating all content models in a workspace
 * Defines the contract for content model validation use case
 *
 * This is a primary port in hexagonal architecture that defines
 * how external actors (e.g., CLI, API, UI) can interact with the
 * application to validate content models.
 */
export interface ValidateContentModelsUseCasePort {
  /**
   * Executes the validate content models use case
   *
   * Validates all content models in a workspace against their Zod schemas.
   * Returns validation results for each model, including any errors found.
   *
   * @param input - The validation parameters (workspace slug)
   * @returns Validation results for all content models
   * @throws {WorkspaceNotFoundError} If the workspace does not exist
   */
  execute(input: ValidateContentModelsInput): Promise<ValidateContentModelsOutput>;
}
