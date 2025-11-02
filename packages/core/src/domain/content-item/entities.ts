import { z } from 'zod';
import { ContentItemId } from '../shared/ids';
import { FieldSlugSchema, ContentItemSlugSchema } from '../shared/entities';
import { DataTypesSchema } from '../content-model/entities';

// Content item attribute definition
export const ContentItemFieldSchema = z.object({
  slug: FieldSlugSchema,
  value: z.string().array().default([]), // Supports multiple values
  schema: DataTypesSchema,
});

// Main content item entity
export const ContentItemSchema = z.object({
  id: ContentItemId,
  fields: z.array(ContentItemFieldSchema),
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
  slug: ContentItemSlugSchema,
}).refine(
  (data) => {
    // If both publishedAt and expiresAt are provided, expiresAt must be after publishedAt
    if (data.publishedAt && data.expiresAt) {
      return data.expiresAt > data.publishedAt;
    }
    return true; // Valid if either or both are missing
  },
  {
    message: "expiresAt must be after publishedAt",
    path: ["expiresAt"], // Error will be associated with the expiresAt field
  }
).refine(
  (data) => {
    // updatedAt should not be before createdAt
    return data.updatedAt >= data.createdAt;
  },
  {
    message: "updatedAt must be after or equal to createdAt",
    path: ["updatedAt"],
  }
);

export type ContentItemField = z.infer<typeof ContentItemFieldSchema>;
export type ContentItem = z.infer<typeof ContentItemSchema>;