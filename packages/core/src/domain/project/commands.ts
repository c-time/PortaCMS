import { Project } from './entities.js';
import { WorkspaceSlug } from '../shared/entities.js';

// ========================================
// Error Definitions
// ========================================

export class WorkspaceAlreadyExistsError extends Error {
  constructor(slug: WorkspaceSlug) {
    super(`Workspace with slug '${slug}' already exists in the project.`);
    this.name = 'WorkspaceAlreadyExistsError';
  }
}

export class WorkspaceNotFoundError extends Error {
  constructor(slug: WorkspaceSlug) {
    super(`Workspace with slug '${slug}' not found in the project.`);
    this.name = 'WorkspaceNotFoundError';
  }
}

export class CannotRemoveDefaultWorkspaceError extends Error {
  constructor() {
    super('Cannot remove the default workspace. At least one workspace must exist.');
    this.name = 'CannotRemoveDefaultWorkspaceError';
  }
}

// ========================================
// Add Workspace to Project Command
// ========================================

export interface AddWorkspaceToProjectParams {
  workspaceSlug: WorkspaceSlug;
}

export interface AddWorkspaceToProjectResult {
  nextState: Project;
  patch: Partial<Project>;
}

/**
 * Adds a workspace to the project
 * Pure function: (prevState, params) => { nextState, patch }
 *
 * @param prevState - Current project state
 * @param params - Parameters containing the workspace slug to add
 * @returns Result containing the updated project and the applied patch
 * @throws {WorkspaceAlreadyExistsError} If workspace already exists in the project
 */
export function addWorkspaceToProject(
  prevState: Project,
  params: AddWorkspaceToProjectParams
): AddWorkspaceToProjectResult {
  // Check if workspace already exists
  if (prevState.workspaces.includes(params.workspaceSlug)) {
    throw new WorkspaceAlreadyExistsError(params.workspaceSlug);
  }

  const updatedWorkspaces = [...prevState.workspaces, params.workspaceSlug];

  const patch: Partial<Project> = {
    workspaces: updatedWorkspaces,
  };

  const nextState: Project = {
    ...prevState,
    ...patch,
  };

  return { nextState, patch };
}

// ========================================
// Remove Workspace from Project Command
// ========================================

export interface RemoveWorkspaceFromProjectParams {
  workspaceSlug: WorkspaceSlug;
}

export interface RemoveWorkspaceFromProjectResult {
  nextState: Project;
  patch: Partial<Project>;
}

/**
 * Removes a workspace from the project
 * Pure function: (prevState, params) => { nextState, patch }
 *
 * @param prevState - Current project state
 * @param params - Parameters containing the workspace slug to remove
 * @returns Result containing the updated project and the applied patch
 * @throws {WorkspaceNotFoundError} If workspace doesn't exist in the project
 * @throws {CannotRemoveDefaultWorkspaceError} If attempting to remove the last workspace
 */
export function removeWorkspaceFromProject(
  prevState: Project,
  params: RemoveWorkspaceFromProjectParams
): RemoveWorkspaceFromProjectResult {
  // Check if workspace exists
  if (!prevState.workspaces.includes(params.workspaceSlug)) {
    throw new WorkspaceNotFoundError(params.workspaceSlug);
  }

  // Prevent removing the last workspace
  if (prevState.workspaces.length === 1) {
    throw new CannotRemoveDefaultWorkspaceError();
  }

  const updatedWorkspaces = prevState.workspaces.filter(
    (slug: WorkspaceSlug) => slug !== params.workspaceSlug
  );

  const patch: Partial<Project> = {
    workspaces: updatedWorkspaces,
  };

  const nextState: Project = {
    ...prevState,
    ...patch,
  };

  return { nextState, patch };
}
