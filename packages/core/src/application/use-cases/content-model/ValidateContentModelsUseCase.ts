import { WorkspaceRepository } from '../../driven-ports/WorkspaceRepository.js';
import { ContentModelRepository } from '../../driven-ports/ContentModelRepository.js';
import { ListContentModelSchema, ObjectContentModelSchema } from '../../../domain/content-model/entities.js';
import {
  ValidateContentModelsUseCasePort,
  ValidateContentModelsInput,
  ValidateContentModelsOutput,
  ValidateContentModelsInputSchema,
  ValidateContentModelsOutputSchema,
  ContentModelValidationResult,
} from '../../driver-ports/content-model/ValidateContentModelsUseCasePort.js';
import { WorkspaceNotFoundError } from './CreateContentModelUseCase.js';
import { ZodError } from 'zod';

// ========================================
// Use Case Implementation
// ========================================

/**
 * Implementation of ValidateContentModelsUseCasePort
 *
 * This use case:
 * 1. Validates that the workspace exists
 * 2. Retrieves all content models in the workspace
 * 3. Validates each content model against its Zod schema
 * 4. Collects and reports validation errors
 * 5. Returns summary and detailed validation results
 *
 * @example
 * ```typescript
 * const useCase = new ValidateContentModelsUseCase(workspaceRepo, contentModelRepo);
 * const result = await useCase.execute({
 *   workspaceSlug: 'default'
 * });
 * console.log(`Valid: ${result.validModels}, Invalid: ${result.invalidModels}`);
 * ```
 */
export class ValidateContentModelsUseCase implements ValidateContentModelsUseCasePort {
  constructor(
    private readonly workspaceRepository: WorkspaceRepository,
    private readonly contentModelRepository: ContentModelRepository
  ) {}

  /**
   * Executes the validate content models use case
   *
   * @param input - The validation parameters (workspace slug)
   * @returns Validation results for all content models
   * @throws {WorkspaceNotFoundError} If the workspace does not exist
   */
  async execute(input: ValidateContentModelsInput): Promise<ValidateContentModelsOutput> {
    // Validate input
    const validatedInput = ValidateContentModelsInputSchema.parse(input);

    // Check if workspace exists
    const workspaceExists = await this.workspaceRepository.exists(validatedInput.workspaceSlug);
    if (!workspaceExists) {
      throw new WorkspaceNotFoundError(validatedInput.workspaceSlug);
    }

    // Retrieve all content models in the workspace
    const contentModels = await this.contentModelRepository.findAll(validatedInput.workspaceSlug);

    // Validate each content model
    const results: ContentModelValidationResult[] = contentModels.map(model => {
      return this.validateContentModel(model);
    });

    // Calculate summary statistics
    const totalModels = results.length;
    const validModels = results.filter(r => r.isValid).length;
    const invalidModels = results.filter(r => !r.isValid).length;

    // Return validated output
    return ValidateContentModelsOutputSchema.parse({
      workspaceSlug: validatedInput.workspaceSlug,
      totalModels,
      validModels,
      invalidModels,
      results,
    });
  }

  /**
   * Validates a single content model against its schema
   *
   * @param model - The content model to validate
   * @returns Validation result with any errors found
   */
  private validateContentModel(model: any): ContentModelValidationResult {
    const errors: string[] = [];

    try {
      // Validate against the appropriate schema based on model type
      if (model.modelType === 'list') {
        ListContentModelSchema.parse(model);
      } else if (model.modelType === 'object') {
        ObjectContentModelSchema.parse(model);
      } else {
        errors.push(`Invalid model type: ${model.modelType}`);
      }
    } catch (error) {
      if (error instanceof ZodError) {
        // Extract human-readable error messages from Zod errors
        errors.push(...error.issues.map((err) => {
          const path = err.path.join('.');
          return `${path}: ${err.message}`;
        }));
      } else if (error instanceof Error) {
        errors.push(error.message);
      } else {
        errors.push('Unknown validation error');
      }
    }

    return {
      slug: model.slug,
      modelType: model.modelType === 'list' || model.modelType === 'object' ? model.modelType : 'list', // Default to 'list' for invalid types
      isValid: errors.length === 0,
      errors,
    };
  }
}
