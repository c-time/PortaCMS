import { z } from 'zod';
import { FieldValueSchema, PaginationContextSchema, FieldSlugSchema, ContentListViewSlugSchema, PageContextFieldSchema } from '../shared/entities';

const FieldsRecordSchema = z.record(FieldSlugSchema, FieldValueSchema).default({});
const ObjectContentsSchema = z.record(FieldSlugSchema, FieldValueSchema).default({});
const PropertiesSchema = z.record(FieldSlugSchema, FieldValueSchema).default({});
const ConstantsSchema = z.record(FieldSlugSchema, PageContextFieldSchema).default({});
const ListViewsSchema = z.record(ContentListViewSlugSchema, FieldsRecordSchema).default({});

const DefaultPageContentViewSchema = z.object({
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

// 
const StaticPageContentViewSchema = z.object({
}).extend(DefaultPageContentViewSchema.shape);

const IndexPageContentViewSchema = z.object({
  // pagination context
  paginationContext: PaginationContextSchema,
}).extend(DefaultPageContentViewSchema.shape);

const ItemPageContentViewSchema = z.object({
  // fields
  fields: FieldsRecordSchema,
}).extend(DefaultPageContentViewSchema.shape);;

// Page content view entity
export const PageContentViewSchema = 
  ItemPageContentViewSchema.or(IndexPageContentViewSchema).or(StaticPageContentViewSchema);


export type PageContentView = z.infer<typeof PageContentViewSchema>;