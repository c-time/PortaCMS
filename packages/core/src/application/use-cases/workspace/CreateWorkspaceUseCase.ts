import { createWorkspace } from '../../../domain/workspace/commands.js';
import { addWorkspaceToProject, WorkspaceAlreadyExistsError } from '../../../domain/project/commands.js';
import { WorkspaceRepository } from '../../driven-ports/WorkspaceRepository.js';
import { ProjectRepository } from '../../driven-ports/ProjectRepository.js';
import { ProjectSchema } from '../../../domain/project/entities.js';
import {
  CreateWorkspaceUseCasePort,
  CreateWorkspaceInput,
  CreateWorkspaceOutput,
  CreateWorkspaceInputSchema,
  CreateWorkspaceOutputSchema,
} from '../../driver-ports/workspace/CreateWorkspaceUseCasePort.js';

// ========================================
// Use Case Implementation
// ========================================

/**
 * Implementation of CreateWorkspaceUseCasePort
 *
 * This use case:
 * 1. Validates that the workspace doesn't already exist
 * 2. Creates a new workspace using the domain command
 * 3. Persists the workspace to the repository
 * 4. Adds the workspace to the project
 * 5. Returns the created workspace
 *
 * @example
 * ```typescript
 * const useCase = new CreateWorkspaceUseCase(workspaceRepo, projectRepo);
 * const result = await useCase.execute({ slug: 'production' as WorkspaceSlug });
 * console.log(result.workspace); // { slug: 'production' }
 * ```
 */
export class CreateWorkspaceUseCase implements CreateWorkspaceUseCasePort {
  constructor(
    private readonly workspaceRepository: WorkspaceRepository,
    private readonly projectRepository: ProjectRepository
  ) {}

  /**
   * Executes the create workspace use case
   *
   * @param input - The workspace creation parameters
   * @returns The created workspace
   * @throws {WorkspaceAlreadyExistsError} If a workspace with the same slug already exists
   */
  async execute(input: CreateWorkspaceInput): Promise<CreateWorkspaceOutput> {
    // Validate input
    const validatedInput = CreateWorkspaceInputSchema.parse(input);

    // Check if workspace already exists
    const exists = await this.workspaceRepository.exists(validatedInput.slug);
    if (exists) {
      throw new WorkspaceAlreadyExistsError(validatedInput.slug);
    }

    // Create workspace using domain command
    const { nextState: workspace } = createWorkspace({
      slug: validatedInput.slug,
    });

    // Save workspace to repository
    await this.workspaceRepository.save(workspace);

    // Get current project (or create default if doesn't exist)
    let project = await this.projectRepository.get();
    if (!project) {
      // Initialize with empty project if it doesn't exist
      // Don't use default value from schema to avoid pre-populating workspaces
      project = ProjectSchema.parse({ workspaces: [] });
    }

    // Add workspace to project using domain command
    const { nextState: updatedProject } = addWorkspaceToProject(project, {
      workspaceSlug: validatedInput.slug,
    });

    // Save updated project
    await this.projectRepository.save(updatedProject);

    // Return result
    return CreateWorkspaceOutputSchema.parse({
      workspace,
    });
  }
}
