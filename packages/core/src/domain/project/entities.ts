import { z } from 'zod';
import { WorkspaceSlug, WorkspaceSlugSchema } from '../shared/entities.js';

// Project entity - root level project management
export const ProjectSchema = z.object({
  workspaces: z.array(WorkspaceSlugSchema).default(["default" as WorkspaceSlug]),
});

export type Project = z.infer<typeof ProjectSchema>;
