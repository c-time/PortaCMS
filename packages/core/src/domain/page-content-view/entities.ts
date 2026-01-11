import { z } from 'zod';
import { FieldValueSchema, PaginationContextSchema, FieldSlugSchema, ContentListViewSlugSchema, PageContextFieldSchema, PageSlugSchema } from '../shared/entities.js';

const FieldsRecordSchema = z.record(FieldSlugSchema, FieldValueSchema).default({});
const ObjectContentsSchema = z.record(FieldSlugSchema, FieldValueSchema).default({});
const PropertiesSchema = z.record(FieldSlugSchema, FieldValueSchema).default({});
const ConstantsSchema = z.record(FieldSlugSchema, PageContextFieldSchema).default({});
const ListViewsSchema = z.record(ContentListViewSlugSchema, FieldsRecordSchema).default({});

const DefaultPageContentViewSchema = z.object({
  slug: PageSlugSchema,
  // page context
  pageContext: z.object({
    title: z.string().default(''),
    description: z.string().default(''),
    // TODO: add pre-defined pageContext fields

    constants: ConstantsSchema,
    properties: PropertiesSchema
  }),
  // object contents
  objectContents: ObjectContentsSchema,
  // listViews
  listViews: ListViewsSchema,
});

// Static page content view (no dynamic content)
const StaticPageContentViewSchema = z.object({
  type: z.literal('static'),
}).extend(DefaultPageContentViewSchema.shape);

// Index page content view (list of items with pagination)
const IndexPageContentViewSchema = z.object({
  type: z.literal('index'),
  // pagination context
  paginationContext: PaginationContextSchema,
}).extend(DefaultPageContentViewSchema.shape);

// Item page content view (single item detail page)
const ItemPageContentViewSchema = z.object({
  type: z.literal('item'),
  // fields
  fields: FieldsRecordSchema,
}).extend(DefaultPageContentViewSchema.shape);

// Page content view entity with discriminated union
export const PageContentViewSchema = z.discriminatedUnion('type', [
  StaticPageContentViewSchema,
  IndexPageContentViewSchema,
  ItemPageContentViewSchema,
]);

export type StaticPageContentView = z.infer<typeof StaticPageContentViewSchema>;
export type IndexPageContentView = z.infer<typeof IndexPageContentViewSchema>;
export type ItemPageContentView = z.infer<typeof ItemPageContentViewSchema>;
export type PageContentView = z.infer<typeof PageContentViewSchema>;