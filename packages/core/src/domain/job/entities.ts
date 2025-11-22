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

// ========================================
// Factory Function
// ========================================
/**
 * Factory function to create a new Job in 'new' status (immutable value)
 */
export function createJob(input: {
  id: string;
  name: string;
  workspaceId: string;
  userId: string;
  steps: number;
  createdAt: Date;
}): Job {
  return JobSchema.parse({
    id: input.id,
    name: input.name,
    workspaceId: input.workspaceId,
    userId: input.userId,
    status: 'new',
    steps: input.steps,
    progress: 0,
    createdAt: input.createdAt,
    updatedAt: input.createdAt,
    completedAt: null,
  });
}