import { createContentItem } from '../../../domain/content-item/commands.js';
import { ContentItemAlreadyExistsError } from '../../../domain/content-item/commands.js';
import { WorkspaceRepository } from '../../driven-ports/WorkspaceRepository.js';
import { ContentModelRepository } from '../../driven-ports/ContentModelRepository.js';
import { ContentItemRepository } from '../../driven-ports/ContentItemRepository.js';
import { UUIDPort } from '../../driven-ports/UUIDPort.js';
import {
  CreateContentItemUseCasePort,
  CreateContentItemInput,
  CreateContentItemOutput,
  CreateContentItemInputSchema,
  CreateContentItemOutputSchema,
} from '../../driver-ports/content-item/CreateContentItemUseCasePort.js';
import { ContentItemId } from '../../../domain/shared/ids.js';
import { ContentItemField } from '../../../domain/content-item/entities.js';
import type { FieldDefinition } from '../../../domain/content-model/entities.js';

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
// Sample Data Generator
// ========================================

/**
 * Generates sample data for a field based on its data type
 */
function generateSampleDataForField(field: FieldDefinition): string[] {
  const dataType = field.schema;
  const label = field.uiMetadata.label || field.slug;

  switch (dataType.type) {
    case 'String':
      return [`Sample ${label}`];

    case 'StringArray':
      return ['Item 1', 'Item 2', 'Item 3'];

    case 'Number':
      return ['42'];

    case 'Boolean':
      return ['true'];

    case 'Date':
      return [new Date().toISOString()];

    case 'Link':
      return ['https://example.com'];

    case 'SingleSelect':
      return dataType.options.length > 0 ? [dataType.options[0] || ""] : [];

    case 'MultipleSelect':
      return dataType.options.slice(0, 2);

    case 'RelatedSingleSelect':
      return ['related-item-1'];

    case 'RelatedMultipleSelect':
      return ['related-item-1', 'related-item-2'];

    default:
      return [];
  }
}

// ========================================
// Use Case Implementation
// ========================================

/**
 * Implementation of CreateContentItemUseCasePort
 *
 * This use case:
 * 1. Validates that the workspace exists
 * 2. Validates that the content model exists
 * 3. Validates that the content item doesn't already exist
 * 4. Generates sample data for fields (if requested)
 * 5. Creates a new content item using the domain command
 * 6. Persists the content item to the repository
 * 7. Returns the created content item
 *
 * @example
 * ```typescript
 * const useCase = new CreateContentItemUseCase(workspaceRepo, contentModelRepo, contentItemRepo);
 * const result = await useCase.execute({
 *   workspaceSlug: 'default',
 *   contentModelSlug: 'blog-posts',
 *   slug: 'first-post',
 *   generateSampleData: true
 * });
 * console.log(result.contentItem);
 * ```
 */
export class CreateContentItemUseCase implements CreateContentItemUseCasePort {
  constructor(
    private readonly workspaceRepository: WorkspaceRepository,
    private readonly contentModelRepository: ContentModelRepository,
    private readonly contentItemRepository: ContentItemRepository,
    private readonly uuidGenerator: UUIDPort
  ) {}

  /**
   * Executes the create content item use case
   *
   * @param input - The content item creation parameters
   * @returns The created content item
   * @throws {WorkspaceNotFoundError} If the workspace does not exist
   * @throws {ContentModelNotFoundError} If the content model does not exist
   * @throws {ContentItemAlreadyExistsError} If a content item with the same slug already exists
   */
  async execute(input: CreateContentItemInput): Promise<CreateContentItemOutput> {
    // Validate input
    const validatedInput = CreateContentItemInputSchema.parse(input);

    // Check if workspace exists
    const workspaceExists = await this.workspaceRepository.exists(validatedInput.workspaceSlug);
    if (!workspaceExists) {
      throw new WorkspaceNotFoundError(validatedInput.workspaceSlug);
    }

    // Check if content model exists
    const contentModel = await this.contentModelRepository.findBySlug(
      validatedInput.workspaceSlug,
      validatedInput.contentModelSlug
    );
    if (!contentModel) {
      throw new ContentModelNotFoundError(validatedInput.contentModelSlug);
    }

    // Check if content item already exists
    const exists = await this.contentItemRepository.existsBySlug(
      validatedInput.workspaceSlug,
      validatedInput.contentModelSlug,
      validatedInput.slug
    );
    if (exists) {
      throw new ContentItemAlreadyExistsError(validatedInput.slug);
    }

    // Generate fields (either from input or sample data)
    let fields: ContentItemField[];

    if (validatedInput.fields) {
      // Use provided fields
      fields = validatedInput.fields;
    } else if (validatedInput.generateSampleData) {
      // Generate sample data based on content model structure
      const fieldDefinitions = contentModel.contentItemStructure.fields;
      fields = fieldDefinitions.map((fieldDef) => ({
        slug: fieldDef.slug,
        value: generateSampleDataForField(fieldDef),
        schema: fieldDef.schema,
      }));
    } else {
      // No fields provided and sample data not requested
      fields = [];
    }

    // Generate ID and create content item using domain command
    const id = ContentItemId.parse(this.uuidGenerator.generate());
    const now = new Date();

    const { nextState: contentItem } = createContentItem({
      id,
      slug: validatedInput.slug,
      fields,
      categories: validatedInput.categories,
      tags: validatedInput.tags,
      createdAt: now,
    });

    // Save content item to repository
    await this.contentItemRepository.save(
      validatedInput.workspaceSlug,
      validatedInput.contentModelSlug,
      contentItem
    );

    // Return result
    return CreateContentItemOutputSchema.parse({
      contentItem: {
        id: contentItem.id,
        slug: contentItem.slug,
        status: contentItem.status,
        fields: contentItem.fields,
        createdAt: contentItem.createdAt,
        version: contentItem.version,
      },
    });
  }
}
