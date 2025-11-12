import { z } from 'zod';
import { WorkspaceSlugSchema } from '../shared/entities.js';

// Workspace entity - environment and stage management
export const WorkspaceSchema = z.object({
  slug : WorkspaceSlugSchema,
});

export type Workspace = z.infer<typeof WorkspaceSchema>;