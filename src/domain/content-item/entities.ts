import { z } from 'zod';
import { ContentItemId } from '../ids';
import { DataTypesSchema } from '../content-list/entities';
import { SlugSchema } from '../shared/entities';

// Content item attribute definition
export const ContentItemAttributeSchema = z.object({
  slug: SlugSchema,
  value: z.string().array().default([]), // Supports multiple values
  schema: DataTypesSchema,
});

// Main content item entity
export const ContentItemSchema = z.object({
  id: ContentItemId,
  attributes: z.array(ContentItemAttributeSchema),
  virtualFields: z.array(z.object({
    slug: SlugSchema,
    expression: z.string().min(1).describe("Expression to compute the virtual field's value with JSONata path syntax"),
    label: z.string().min(1),
  })).default([]),
  publishedAt: z.date().optional(),
  expiresAt: z.date().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
  createdBy: z.string().optional(),
  updatedBy: z.string().optional(),
  version: z.number().int().min(1).default(1),
  categories: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  status: z.enum(['draft', 'published', 'archived'], {
    message: "Status must be draft, published, or archived"
  }).default('draft'),
  slug: SlugSchema,
});

export type ContentItemProperty = z.infer<typeof ContentItemAttributeSchema>;
export type ContentItem = z.infer<typeof ContentItemSchema>;