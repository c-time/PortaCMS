import { z } from 'zod';

/**
 * Artifact entity represents the generated output file
 * It is the result of applying an ArtifactStructure to content models
 */

// Artifact path schema
const ArtifactPathSchema = z.string().brand<'ArtifactPath'>();

// Artifact metadata schema
export const ArtifactMetadataSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  // Additional metadata fields can be added here
});

// Artifact schema
export const ArtifactSchema = z.object({
  // Output path (e.g., "/articles/1.json", "/pages/about.json")
  path: ArtifactPathSchema,

  // Generated content (as JSON structure)
  content: z.unknown(),

  // Metadata about the artifact
  metadata: ArtifactMetadataSchema.optional(),

  // Timestamp when this artifact was generated
  generatedAt: z.date(),
});

// Type exports for TypeScript
export type ArtifactPath = z.infer<typeof ArtifactPathSchema>;
export type ArtifactMetadata = z.infer<typeof ArtifactMetadataSchema>;
export type Artifact = z.infer<typeof ArtifactSchema>;
