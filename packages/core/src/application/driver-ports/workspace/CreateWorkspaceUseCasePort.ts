import { z } from 'zod';
import { WorkspaceSlugSchema } from '../../../domain/shared/entities.js';

// ========================================
// Input/Output Schemas
// ========================================

export const CreateWorkspaceInputSchema = z.object({
  slug: WorkspaceSlugSchema,
});

export type CreateWorkspaceInput = z.infer<typeof CreateWorkspaceInputSchema>;

export const CreateWorkspaceOutputSchema = z.object({
  workspace: z.object({
    slug: WorkspaceSlugSchema,
  }),
});

export type CreateWorkspaceOutput = z.infer<typeof CreateWorkspaceOutputSchema>;

// ========================================
// Driver Port (Primary Port)
// ========================================

/**
 * Driver port for creating a new workspace
 * Defines the contract for workspace creation use case
 *
 * This is a primary port in hexagonal architecture that defines
 * how external actors (e.g., CLI, API, UI) can interact with the
 * application to create workspaces.
 */
export interface CreateWorkspaceUseCasePort {
  /**
   * Executes the create workspace use case
   *
   * @param input - The workspace creation parameters
   * @returns The created workspace
   * @throws {WorkspaceAlreadyExistsError} If a workspace with the same slug already exists
   */
  execute(input: CreateWorkspaceInput): Promise<CreateWorkspaceOutput>;
}
