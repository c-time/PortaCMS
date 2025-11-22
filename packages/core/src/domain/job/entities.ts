import { z } from 'zod';
import { JobId, UserId, WorkspaceId } from '../shared/ids.js';

// ========================================
// Complete Entity Schema
// ========================================
export const JobSchema = z.object({
  id: JobId,
  name: z.string().min(1),
  workspaceId: WorkspaceId,
  userId: UserId,
  status: z.enum(['new', 'in_progress', 'completed', 'failed', "timed_out"]),
  steps: z.number().min(1), // total number of steps
  progress: z.number().min(0), // current progress (0 to steps)
  createdAt: z.date(),
  updatedAt: z.date(),
  completedAt: z.date().nullable(),
});

export type Job = z.infer<typeof JobSchema>;