import { z } from 'zod';
import { ContentModelSlugSchema, ContentListViewSlugSchema, PageContextFieldSchema, VirtualFieldSchema, JSONataExpressionSchema } from '../shared/entities.js';

const PagePathSchema = z.string().brand<'PagePath'>();

export const PageContextSchema = z.object({
  constants: z.array(PageContextFieldSchema),
  properties: z.array(VirtualFieldSchema),
});

// Mapper input configuration
const MapperInputSchema = z.object({
  // Iterator for multipliable pages (e.g., "articles", "products")
  iterator: z.object({
    slug: ContentListViewSlugSchema,
    type: z.enum(["perItem","perPage"]),
  }).optional(),

  // Single item content references (e.g., "SiteConfig", "CompanyPageConfig")
  objectContents: z.array(ContentModelSlugSchema).optional(),

  // View references (e.g., "company.CompanyListView", "articles.ArticleDetailView")
  views: z.array(ContentListViewSlugSchema).optional(),

  // Context variables for template interpolation
  context: PageContextSchema.optional(),
});

// Mapper output configuration
const MapperOutputSchema = z.object({
  // Output file name pattern (can include variables like "/articles/{articles.id}.json")
  fileName: JSONataExpressionSchema, //json ata expression
});

// Mapper configuration for page generation
const MapperSchema = z.object({
  input: MapperInputSchema,
  output: MapperOutputSchema,
});

// Page configuration schema
const PageSchema = z.object({
  // Human-readable page title
  title: z.string(),
  description: z.string(),
  //TODO: add other metadata properties

  // Output path (for simple cases or generated pages)
  path: PagePathSchema,

  // Mapper configuration for content and output
  mapper: MapperSchema,

});

export const WebsiteStructureSchema = z.object({
  pages: z.array(PageSchema).default([]),
});

// Root entity schema
export const WebsiteSchema = z.object({
  name: z.string()
    .min(1, { message: "Website name is required" })
    .max(100, { message: "Website name must not exceed 100 characters" }),
  description: z.string()
    .max(500, { message: "Description must not exceed 500 characters" })
    .optional(),
  websiteStructure: WebsiteStructureSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Type exports for TypeScript
export type MapperInput = z.infer<typeof MapperInputSchema>;
export type MapperOutput = z.infer<typeof MapperOutputSchema>;
export type Mapper = z.infer<typeof MapperSchema>;
export type Page = z.infer<typeof PageSchema>;
export type WebsiteStructure = z.infer<typeof WebsiteStructureSchema>;
export type Website = z.infer<typeof WebsiteSchema>;
