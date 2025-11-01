import { z } from 'zod';

// Common UUID schema with detailed validation
export const UUIDSchema = z.string()
  .uuid({ message: "Invalid UUID format" })
  .describe("Universally unique identifier");

// UUID generator with basic error handling
export function generateUUID(): string {
  try {
    return crypto.randomUUID();
  } catch (error) {
    throw new Error("Failed to generate UUID: " + (error as Error).message);
  }
}

// Project entity - root level project management
export const ProjectSchema = z.object({
  id: UUIDSchema,
  name: z.string()
    .min(1, { message: "Project name is required" })
    .max(100, { message: "Project name must not exceed 100 characters" })
    .regex(/^[a-zA-Z0-9\s\-_]+$/, { message: "Project name contains invalid characters" }),
  description: z.string()
    .max(500, { message: "Description must not exceed 500 characters" })
    .optional(),
  createdAt: z.date({ message: "Invalid creation date" }),
  updatedAt: z.date({ message: "Invalid update date" }),
  settings: z.record(z.string(), z.unknown()).default({}),
});

// Workspace entity - environment and stage management
export const WorkspaceSchema = z.object({
  id: UUIDSchema,
  projectId: UUIDSchema,
  name: z.string()
    .min(1, { message: "Workspace name is required" })
    .max(50, { message: "Workspace name must not exceed 50 characters" }),
  environment: z.enum(['development', 'staging', 'production'], {
    message: "Environment must be development, staging, or production"
  }),
  isActive: z.boolean().default(true),
  configuration: z.record(z.string(), z.unknown()).default({}),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Project = z.infer<typeof ProjectSchema>;
export type Workspace = z.infer<typeof WorkspaceSchema>;