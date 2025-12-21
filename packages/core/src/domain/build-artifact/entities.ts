import { z } from 'zod';

/**
 * BuildArtifact entity represents the generated output file
 * It is the result of applying a BuildSpec to content models
 */

// BuildArtifact path schema
const BuildArtifactPathSchema = z.string().brand<'BuildArtifactPath'>();

// BuildArtifact schema
export const BuildArtifactSchema = z.object({
  // Output paths (e.g., ["/articles/1.json", "/articles/2.json"])
  paths: BuildArtifactPathSchema.array(),

  // Timestamp when this artifact was generated
  generatedAt: z.date(),
});

// Type exports for TypeScript
export type BuildArtifactPath = z.infer<typeof BuildArtifactPathSchema>;
export type BuildArtifact = z.infer<typeof BuildArtifactSchema>;
