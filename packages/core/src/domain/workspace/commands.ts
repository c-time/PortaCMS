import { Workspace } from './entities.js';
import { WorkspaceSlug } from '../shared/entities.js';

// ========================================
// Create Workspace Command
// ========================================

export interface CreateWorkspaceParams {
  slug: WorkspaceSlug;
}

export interface CreateWorkspaceResult {
  nextState: Workspace;
}

/**
 * Creates a new workspace
 * Pure function: (params) => { nextState }
 *
 * @param params - Parameters for creating the workspace
 * @returns Result containing the created workspace
 */
export function createWorkspace(
  params: CreateWorkspaceParams
): CreateWorkspaceResult {
  const nextState: Workspace = {
    slug: params.slug,
  };

  return { nextState };
}
