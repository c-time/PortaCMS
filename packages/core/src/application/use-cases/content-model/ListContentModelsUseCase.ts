import { WorkspaceRepository } from '../../driven-ports/WorkspaceRepository.js';
import { ContentModelRepository } from '../../driven-ports/ContentModelRepository.js';
import {
  ListContentModelsUseCasePort,
  ListContentModelsInput,
  ListContentModelsOutput,
  ListContentModelsInputSchema,
  ListContentModelsOutputSchema,
  ContentModelSummary,
} from '../../driver-ports/content-model/ListContentModelsUseCasePort.js';
import { WorkspaceNotFoundError } from './CreateContentModelUseCase.js';

// ========================================
// Use Case Implementation
// ========================================

/**
 * Implementation of ListContentModelsUseCasePort
 *
 * This use case:
 * 1. Validates that the workspace exists
 * 2. Retrieves all content models in the workspace
 * 3. Calculates summary statistics (total, list count, object count)
 * 4. Returns content model summaries
 *
 * @example
 * ```typescript
 * const useCase = new ListContentModelsUseCase(workspaceRepo, contentModelRepo);
 * const result = await useCase.execute({
 *   workspaceSlug: 'default'
 * });
 * console.log(`Found ${result.totalCount} models`);
 * ```
 */
export class ListContentModelsUseCase implements ListContentModelsUseCasePort {
  constructor(
    private readonly workspaceRepository: WorkspaceRepository,
    private readonly contentModelRepository: ContentModelRepository
  ) {}

  /**
   * Executes the list content models use case
   *
   * @param input - The listing parameters (workspace slug)
   * @returns List of content models with summary statistics
   * @throws {WorkspaceNotFoundError} If the workspace does not exist
   */
  async execute(input: ListContentModelsInput): Promise<ListContentModelsOutput> {
    // Validate input
    const validatedInput = ListContentModelsInputSchema.parse(input);

    // Check if workspace exists
    const workspaceExists = await this.workspaceRepository.exists(validatedInput.workspaceSlug);
    if (!workspaceExists) {
      throw new WorkspaceNotFoundError(validatedInput.workspaceSlug);
    }

    // Retrieve all content models in the workspace
    const contentModels = await this.contentModelRepository.findAll(validatedInput.workspaceSlug);

    // Create summaries
    const summaries: ContentModelSummary[] = contentModels.map(model => ({
      slug: model.slug,
      label: model.label,
      modelType: model.modelType,
      description: model.description,
      isActive: model.isActive,
      createdAt: model.createdAt,
      updatedAt: model.updatedAt,
    }));

    // Calculate statistics
    const totalCount = summaries.length;
    const listCount = summaries.filter(m => m.modelType === 'list').length;
    const objectCount = summaries.filter(m => m.modelType === 'object').length;

    // Return validated output
    return ListContentModelsOutputSchema.parse({
      workspaceSlug: validatedInput.workspaceSlug,
      contentModels: summaries,
      totalCount,
      listCount,
      objectCount,
    });
  }
}
