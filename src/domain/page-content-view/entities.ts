import { z } from 'zod';
import { FieldSchema, PaginationContextSchema, FieldSlugSchema, ContentListViewSlugSchema } from '../shared/entities';

const FieldsSchema = z.record(FieldSlugSchema, FieldSchema).default({});

// Transformation operation definitions
export const SortOperationSchema = z.object({
  field: z.string().min(1, { message: "Sort field is required" }),
  order: z.enum(['asc', 'desc'], { message: "Sort order must be asc or desc" }).default('asc'),
});

export const FilterOperationSchema = z.object({
  field: z.string().min(1, { message: "Filter field is required" }),
  operator: z.enum(['eq', 'ne', 'gt', 'gte', 'lt', 'lte', 'contains', 'startsWith', 'endsWith'], {
    message: "Invalid filter operator"
  }),
  value: z.unknown(),
});

export const PaginationConfigSchema = z.object({
  offset: z.number().int().min(0).default(0),
  limit: z.number().int().min(1).max(1000, { message: "Limit must not exceed 1000" }).default(10),
  totalCount: z.number().int().min(0).optional(),
});

export const GroupByConfigSchema = z.object({
  field: z.string().min(1, { message: "Group by field is required" }),
  sortGroups: z.boolean().default(false),
  includeGroupCount: z.boolean().default(true),
});

export const StringConcatenationSchema = z.object({
  outputField: z.string().min(1, { message: "Output field name is required" }),
  sourceFields: z.array(z.string().min(1)).min(1, { message: "At least one source field is required" }),
  separator: z.string().default(' '),
  template: z.string().optional(), // e.g., "{field1} - {field2}"
});


// TODO: Extend with more common fields as needed
const DefaultPageContentViewSchema = z.object({
  // page context
  pageContext: z.object({}),
  // global contents
  globalContents: FieldsSchema,
  // listViews
  listViews: z.record(ContentListViewSlugSchema, FieldsSchema).default({}),
});


// 
const StaticPageContentViewSchema = z.object({
}).extend(DefaultPageContentViewSchema.shape);

const IndexPageContentViewSchema = z.object({
  // pagination context
  paginationContext: PaginationContextSchema,
}).extend(DefaultPageContentViewSchema.shape);

const ItemPageContentViewSchema = z.object({
  // fields
  fields: FieldsSchema,
}).extend(DefaultPageContentViewSchema.shape);;

// Page content view entity
export const PageContentViewSchema = 
  ItemPageContentViewSchema.or(IndexPageContentViewSchema).or(StaticPageContentViewSchema);


export type SortOperation = z.infer<typeof SortOperationSchema>;
export type FilterOperation = z.infer<typeof FilterOperationSchema>;
export type PaginationConfig = z.infer<typeof PaginationConfigSchema>;
export type GroupByConfig = z.infer<typeof GroupByConfigSchema>;
export type StringConcatenation = z.infer<typeof StringConcatenationSchema>;
export type PageContentView = z.infer<typeof PageContentViewSchema>;