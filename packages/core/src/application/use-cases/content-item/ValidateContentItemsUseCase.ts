import { ContentItemSchema } from '../../../domain/content-item/entities.js';
import { WorkspaceRepository } from '../../driven-ports/WorkspaceRepository.js';
import { ContentModelRepository } from '../../driven-ports/ContentModelRepository.js';
import { ContentItemRepository } from '../../driven-ports/ContentItemRepository.js';
import {
  ValidateContentItemsUseCasePort,
  ValidateContentItemsInput,
  ValidateContentItemsOutput,
  ValidateContentItemsInputSchema,
  ValidateContentItemsOutputSchema,
  ContentItemValidationResult,
} from '../../driver-ports/content-item/ValidateContentItemsUseCasePort.js';
import type { ContentItem } from '../../../domain/content-item/entities.js';
import type { ContentModel } from '../../../domain/content-model/entities.js';

// ========================================
// Error Definitions
// ========================================

export class WorkspaceNotFoundError extends Error {
  constructor(workspaceSlug: string) {
    super(`Workspace with slug '${workspaceSlug}' not found.`);
    this.name = 'WorkspaceNotFoundError';
  }
}

export class ContentModelNotFoundError extends Error {
  constructor(contentModelSlug: string) {
    super(`Content model with slug '${contentModelSlug}' not found.`);
    this.name = 'ContentModelNotFoundError';
  }
}

// ========================================
// Validation Logic
// ========================================

/**
 * Validates a single content item against its content model
 * Performs two levels of validation:
 * 1. Zod schema validation (entity-level constraints)
 * 2. Content model structure validation (field definitions, required fields, etc.)
 */
function validateContentItem(
  contentItem: ContentItem,
  contentModel: ContentModel
): ContentItemValidationResult {
  const errors: string[] = [];

  // Level 1: Zod schema validation
  try {
    ContentItemSchema.parse(contentItem);
  } catch (error) {
    if (error instanceof Error) {
      errors.push(`Schema validation failed: ${error.message}`);
    }
  }

  // Level 2: Content model structure validation
  const fieldDefinitions = contentModel.contentItemStructure.fields;
  const fieldDefinitionMap = new Map(
    fieldDefinitions.map((def) => [def.slug, def])
  );

  // Check for required fields
  for (const fieldDef of fieldDefinitions) {
    if (fieldDef.uiMetadata.required) {
      const field = contentItem.fields.find((f) => f.slug === fieldDef.slug);
      if (!field || field.value.length === 0 || field.value.every((v) => v === '')) {
        errors.push(`Required field '${fieldDef.slug}' is missing or empty`);
      }
    }
  }

  // Check for unknown fields (not in content model)
  for (const field of contentItem.fields) {
    if (!fieldDefinitionMap.has(field.slug)) {
      errors.push(`Field '${field.slug}' is not defined in the content model`);
    }
  }

  // Check data type compatibility
  for (const field of contentItem.fields) {
    const fieldDef = fieldDefinitionMap.get(field.slug);
    if (fieldDef) {
      // Verify schema type matches
      if (field.schema.type !== fieldDef.schema.type) {
        errors.push(
          `Field '${field.slug}' has incorrect data type: expected '${fieldDef.schema.type}', got '${field.schema.type}'`
        );
      }

      // For Select types, verify values are in options
      if (fieldDef.schema.type === 'SingleSelect') {
        const options = fieldDef.schema.options;
        for (const value of field.value) {
          if (value && !options.includes(value)) {
            errors.push(
              `Field '${field.slug}' has invalid value '${value}': not in options [${options.join(', ')}]`
            );
          }
        }
      }

      if (fieldDef.schema.type === 'MultipleSelect') {
        const options = fieldDef.schema.options;
        for (const value of field.value) {
          if (value && !options.includes(value)) {
            errors.push(
              `Field '${field.slug}' has invalid value '${value}': not in options [${options.join(', ')}]`
            );
          }
        }
      }
    }
  }

  return {
    id: contentItem.id,
    slug: contentItem.slug,
    isValid: errors.length === 0,
    errors,
  };
}

// ========================================
// Use Case Implementation
// ========================================

/**
 * Implementation of ValidateContentItemsUseCasePort
 *
 * This use case:
 * 1. Validates that the workspace exists
 * 2. Validates that the content model exists
 * 3. Retrieves all content items for the content model
 * 4. Validates each content item against:
 *    - Zod schema constraints (dates, version, status)
 *    - Content model field structure (required fields, unknown fields, data types)
 * 5. Returns validation results with detailed error messages
 *
 * @example
 * ```typescript
 * const useCase = new ValidateContentItemsUseCase(workspaceRepo, contentModelRepo, contentItemRepo);
 * const result = await useCase.execute({
 *   workspaceSlug: 'default',
 *   contentModelSlug: 'blog-posts'
 * });
 * console.log(`Valid: ${result.validItems}, Invalid: ${result.invalidItems}`);
 * ```
 */
export class ValidateContentItemsUseCase implements ValidateContentItemsUseCasePort {
  constructor(
    private readonly workspaceRepository: WorkspaceRepository,
    private readonly contentModelRepository: ContentModelRepository,
    private readonly contentItemRepository: ContentItemRepository
  ) {}

  /**
   * Executes the validate content items use case
   *
   * @param input - The validation parameters
   * @returns The validation results with detailed error information
   * @throws {WorkspaceNotFoundError} If the workspace does not exist
   * @throws {ContentModelNotFoundError} If the content model does not exist
   */
  async execute(input: ValidateContentItemsInput): Promise<ValidateContentItemsOutput> {
    // Validate input
    const validatedInput = ValidateContentItemsInputSchema.parse(input);

    // Check if workspace exists
    const workspaceExists = await this.workspaceRepository.exists(validatedInput.workspaceSlug);
    if (!workspaceExists) {
      throw new WorkspaceNotFoundError(validatedInput.workspaceSlug);
    }

    // Check if content model exists and retrieve it
    const contentModel = await this.contentModelRepository.findBySlug(
      validatedInput.workspaceSlug,
      validatedInput.contentModelSlug
    );
    if (!contentModel) {
      throw new ContentModelNotFoundError(validatedInput.contentModelSlug);
    }

    // Retrieve all content items
    const contentItems = await this.contentItemRepository.findAll(
      validatedInput.workspaceSlug,
      validatedInput.contentModelSlug
    );

    // Validate each content item
    const results: ContentItemValidationResult[] = contentItems.map((item) =>
      validateContentItem(item, contentModel)
    );

    // Calculate statistics
    const totalItems = results.length;
    const validItems = results.filter((r) => r.isValid).length;
    const invalidItems = results.filter((r) => !r.isValid).length;

    // Return result
    return ValidateContentItemsOutputSchema.parse({
      workspaceSlug: validatedInput.workspaceSlug,
      contentModelSlug: validatedInput.contentModelSlug,
      totalItems,
      validItems,
      invalidItems,
      results,
    });
  }
}
