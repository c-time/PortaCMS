import { z } from 'zod';

/**
 * BuildArtifact entity represents the generated output file
 * It is the result of applying a BuildSpec to content models
 */

// BuildArtifact path schema
const BuildArtifactPathSchema = z.string().brand<'BuildArtifactPath'>();

// BuildArtifact metadata schema
export const BuildArtifactMetadataSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  // Additional metadata fields can be added here
});

// BuildArtifact schema
export const BuildArtifactSchema = z.object({
  // Output path (e.g., "/articles/1.json", "/pages/about.json")
  path: BuildArtifactPathSchema,

  // Generated content (as JSON structure)
  content: z.unknown(),

  // Metadata about the artifact
  metadata: BuildArtifactMetadataSchema.optional(),

  // Timestamp when this artifact was generated
  generatedAt: z.date(),
});

// Type exports for TypeScript
export type BuildArtifactPath = z.infer<typeof BuildArtifactPathSchema>;
export type BuildArtifactMetadata = z.infer<typeof BuildArtifactMetadataSchema>;
export type BuildArtifact = z.infer<typeof BuildArtifactSchema>;
