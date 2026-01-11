import { WorkspaceRepository } from '../../driven-ports/WorkspaceRepository.js';
import { ContentModelRepository } from '../../driven-ports/ContentModelRepository.js';
import { ContentItemRepository } from '../../driven-ports/ContentItemRepository.js';
import {
  ListContentItemsUseCasePort,
  ListContentItemsInput,
  ListContentItemsOutput,
  ListContentItemsInputSchema,
  ListContentItemsOutputSchema,
  ContentItemSummary,
} from '../../driver-ports/content-item/ListContentItemsUseCasePort.js';

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
// Use Case Implementation
// ========================================

/**
 * Implementation of ListContentItemsUseCasePort
 *
 * This use case:
 * 1. Validates that the workspace exists
 * 2. Validates that the content model exists
 * 3. Retrieves content items with optional filtering and pagination
 * 4. Calculates statistics (total, draft, published, archived counts)
 * 5. Returns content item summaries
 *
 * @example
 * ```typescript
 * const useCase = new ListContentItemsUseCase(workspaceRepo, contentModelRepo, contentItemRepo);
 * const result = await useCase.execute({
 *   workspaceSlug: 'default',
 *   contentModelSlug: 'blog-posts',
 *   status: 'published',
 *   limit: 10
 * });
 * console.log(result.contentItems);
 * ```
 */
export class ListContentItemsUseCase implements ListContentItemsUseCasePort {
  constructor(
    private readonly workspaceRepository: WorkspaceRepository,
    private readonly contentModelRepository: ContentModelRepository,
    private readonly contentItemRepository: ContentItemRepository
  ) {}

  /**
   * Executes the list content items use case
   *
   * @param input - The listing parameters (filters, pagination)
   * @returns The list of content items with summary statistics
   * @throws {WorkspaceNotFoundError} If the workspace does not exist
   * @throws {ContentModelNotFoundError} If the content model does not exist
   */
  async execute(input: ListContentItemsInput): Promise<ListContentItemsOutput> {
    // Validate input
    const validatedInput = ListContentItemsInputSchema.parse(input);

    // Check if workspace exists
    const workspaceExists = await this.workspaceRepository.exists(validatedInput.workspaceSlug);
    if (!workspaceExists) {
      throw new WorkspaceNotFoundError(validatedInput.workspaceSlug);
    }

    // Check if content model exists
    const contentModelExists = await this.contentModelRepository.exists(
      validatedInput.workspaceSlug,
      validatedInput.contentModelSlug
    );
    if (!contentModelExists) {
      throw new ContentModelNotFoundError(validatedInput.contentModelSlug);
    }

    // Retrieve content items with filters
    const contentItems = await this.contentItemRepository.findAll(
      validatedInput.workspaceSlug,
      validatedInput.contentModelSlug,
      {
        status: validatedInput.status,
        limit: validatedInput.limit,
        offset: validatedInput.offset,
      }
    );

    // Calculate statistics
    const draftCount = await this.contentItemRepository.count(
      validatedInput.workspaceSlug,
      validatedInput.contentModelSlug,
      { status: 'draft' }
    );

    const publishedCount = await this.contentItemRepository.count(
      validatedInput.workspaceSlug,
      validatedInput.contentModelSlug,
      { status: 'published' }
    );

    const archivedCount = await this.contentItemRepository.count(
      validatedInput.workspaceSlug,
      validatedInput.contentModelSlug,
      { status: 'archived' }
    );

    const totalCount = draftCount + publishedCount + archivedCount;

    // Map to content item summaries
    const contentItemSummaries: ContentItemSummary[] = contentItems.map((item) => ({
      id: item.id,
      slug: item.slug,
      status: item.status,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      version: item.version,
      fieldCount: item.fields.length,
    }));

    // Return result
    return ListContentItemsOutputSchema.parse({
      workspaceSlug: validatedInput.workspaceSlug,
      contentModelSlug: validatedInput.contentModelSlug,
      contentItems: contentItemSummaries,
      totalCount,
      draftCount,
      publishedCount,
      archivedCount,
    });
  }
}
