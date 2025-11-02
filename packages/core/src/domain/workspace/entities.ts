import { z } from 'zod';
import { WorkspaceSlug, WorkspaceSlugSchema } from '../shared/entities.js';

// Project entity - root level project management
export const ProjectSchema = z.object({
  workspaces: z.array(WorkspaceSlugSchema).default(["default" as WorkspaceSlug]),
});

// Workspace entity - environment and stage management
export const WorkspaceSchema = z.object({
  slug : WorkspaceSlugSchema,
});

export type Project = z.infer<typeof ProjectSchema>;
export type Workspace = z.infer<typeof WorkspaceSchema>;