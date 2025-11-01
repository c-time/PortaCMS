import { z } from 'zod';
import { ContentItemId } from '../ids';
import { DataTypesSchema } from '../content-list/entities';

// Content property value types
export const ContentPropertyValueSchema = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.date(),
  z.array(z.unknown()),
  z.record(z.string(), z.unknown()),
  z.null()
], { message: "Invalid property value type" });

// Content item attribute definition
export const ContentItemAttributeSchema = z.object({
  slug: z.string()
    .min(1, { message: "Attribute slug is required" })
    .max(100, { message: "Attribute slug must not exceed 100 characters" })
    .regex(/^[a-zA-Z][a-zA-Z0-9_]*$/, { message: "Attribute slug must start with letter and contain only letters, numbers, and underscores" }),
  value: z.string().array().default([]), // Supports multiple values
  schema: DataTypesSchema,
});

// Main content item entity
export const ContentItemSchema = z.object({
  id: ContentItemId,
  attributes: z.array(ContentItemAttributeSchema),
  publishedAt: z.date().optional(),
  expiresAt: z.date().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
  createdBy: z.string().optional(),
  updatedBy: z.string().optional(),
  version: z.number().int().min(1).default(1),
  tags: z.array(z.string()).default([]),
  status: z.enum(['draft', 'published', 'archived'], {
    message: "Status must be draft, published, or archived"
  }).default('draft'),
  slug: z.string()
    .min(1, { message: "Slug is required" })
    .max(200, { message: "Slug must not exceed 200 characters" })
    .regex(/^[a-z0-9\-_/]+$/, { message: "Slug must contain only lowercase letters, numbers, hyphens, underscores, and slashes" }),
});

export type ContentPropertyValue = z.infer<typeof ContentPropertyValueSchema>;
export type ContentItemProperty = z.infer<typeof ContentItemAttributeSchema>;
export type ContentItemMetadata = z.infer<typeof ContentItemMetadataSchema>;
export type ContentItem = z.infer<typeof ContentItemSchema>;