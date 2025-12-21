import { createListContentModel, createObjectContentModel } from '../../../domain/content-model/commands.js';
import { WorkspaceRepository } from '../../driven-ports/WorkspaceRepository.js';
import { ContentModelRepository } from '../../driven-ports/ContentModelRepository.js';
import {
  CreateContentModelUseCasePort,
  CreateContentModelInput,
  CreateContentModelOutput,
  CreateContentModelInputSchema,
  CreateContentModelOutputSchema,
} from '../../driver-ports/content-model/CreateContentModelUseCasePort.js';

// ========================================
// Error Definitions
// ========================================

export class WorkspaceNotFoundError extends Error {
  constructor(workspaceSlug: string) {
    super(`Workspace with slug '${workspaceSlug}' not found.`);
    this.name = 'WorkspaceNotFoundError';
  }
}

export class ContentModelAlreadyExistsError extends Error {
  constructor(slug: string) {
    super(`Content model with slug '${slug}' already exists.`);
    this.name = 'ContentModelAlreadyExistsError';
  }
}

// ========================================
// Use Case Implementation
// ========================================

/**
 * Implementation of CreateContentModelUseCasePort
 *
 * This use case:
 * 1. Validates that the workspace exists
 * 2. Validates that the content model doesn't already exist
 * 3. Creates a new content model using the appropriate domain command
 * 4. Persists the content model to the repository
 * 5. Returns the created content model
 *
 * @example
 * ```typescript
 * const useCase = new CreateContentModelUseCase(workspaceRepo, contentModelRepo);
 * const result = await useCase.execute({
 *   workspaceSlug: 'default',
 *   slug: 'blog-posts',
 *   label: 'Blog Posts',
 *   modelType: 'list'
 * });
 * console.log(result.contentModel);
 * ```
 */
export class CreateContentModelUseCase implements CreateContentModelUseCasePort {
  constructor(
    private readonly workspaceRepository: WorkspaceRepository,
    private readonly contentModelRepository: ContentModelRepository
  ) {}

  /**
   * Executes the create content model use case
   *
   * @param input - The content model creation parameters
   * @returns The created content model
   * @throws {WorkspaceNotFoundError} If the workspace does not exist
   * @throws {ContentModelAlreadyExistsError} If a content model with the same slug already exists
   */
  async execute(input: CreateContentModelInput): Promise<CreateContentModelOutput> {
    // Validate input
    const validatedInput = CreateContentModelInputSchema.parse(input);

    // Check if workspace exists
    const workspaceExists = await this.workspaceRepository.exists(validatedInput.workspaceSlug);
    if (!workspaceExists) {
      throw new WorkspaceNotFoundError(validatedInput.workspaceSlug);
    }

    // Check if content model already exists
    const exists = await this.contentModelRepository.exists(
      validatedInput.workspaceSlug,
      validatedInput.slug
    );
    if (exists) {
      throw new ContentModelAlreadyExistsError(validatedInput.slug);
    }

    // Create content model using domain command
    const now = new Date();
    const { nextState: contentModel } =
      validatedInput.modelType === 'list'
        ? createListContentModel({
            slug: validatedInput.slug,
            label: validatedInput.label,
            description: validatedInput.description,
            documentUrl: validatedInput.documentUrl,
            isActive: validatedInput.isActive,
            enablePublishScheduling: validatedInput.enablePublishScheduling,
            enableCategories: validatedInput.enableCategories,
            orderValue: validatedInput.orderValue,
            createdAt: now,
          })
        : createObjectContentModel({
            slug: validatedInput.slug,
            label: validatedInput.label,
            description: validatedInput.description,
            documentUrl: validatedInput.documentUrl,
            isActive: validatedInput.isActive,
            enablePublishScheduling: validatedInput.enablePublishScheduling,
            orderValue: validatedInput.orderValue,
            createdAt: now,
          });

    // Save content model to repository
    await this.contentModelRepository.save(validatedInput.workspaceSlug, contentModel);

    // Return result
    return CreateContentModelOutputSchema.parse({
      contentModel: {
        slug: contentModel.slug,
        label: contentModel.label,
        modelType: contentModel.modelType,
        description: contentModel.description,
        documentUrl: contentModel.documentUrl,
        isActive: contentModel.isActive,
        enablePublishScheduling: contentModel.enablePublishScheduling,
        orderValue: contentModel.orderValue,
      },
    });
  }
}
