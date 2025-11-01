import { z } from 'zod';
import { UUIDSchema } from '../workspace/entities.js';
import { is } from 'zod/v4/locales';

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

// Transformation parameters
export const ViewTransformationParametersSchema = z.object({
  sorts: z.array(SortOperationSchema).default([]),
  filters: z.array(FilterOperationSchema).default([]),
  pagination: PaginationConfigSchema.optional(),
  groupBy: GroupByConfigSchema.optional(),
  stringConcatenations: z.array(StringConcatenationSchema).default([]),
  fieldMappings: z.record(z.string(), z.string()).default({}), // field rename mappings
  includeFields: z.array(z.string()).optional(), // whitelist fields
  excludeFields: z.array(z.string()).default([]), // blacklist fields
});

// Transformation result
export const ViewTransformationResultSchema = z.object({
  data: z.array(z.record(z.string(), z.unknown())),
  metadata: z.object({
    totalCount: z.number().int().min(0),
    pageCount: z.number().int().min(0).optional(),
    currentPage: z.number().int().min(0).optional(),
    hasNextPage: z.boolean().optional(),
    hasPreviousPage: z.boolean().optional(),
    transformedAt: z.date(),
  }),
});


const AttributesSchema = z.record(z.string(), 
    z.array(z.string())
    .or(z.string())
    .or(z.array(z.object({
      label: z.string(),
      slug: z.string(),
      value: z.string(),
    })))
    ).default({});

const DefaultPageContentViewSchema = z.object({
  // page context
  pageContext: z.object({}),
  // global contents
  globalContents: AttributesSchema,
  // listViews
  listViews: z.record(z.string(), z.array(AttributesSchema)).default({}),
});




// 
const StaticPageContentViewSchema = z.object({
}).extend(DefaultPageContentViewSchema.shape);

const IndexPageContentViewSchema = z.object({
  // pagination context
  paginationContext: z.object({
    items: z.array(AttributesSchema).default([]),
    links : z.object({
      // Examples:
      // [1,2,3, * ,9,10, *,   12,13, * , 98,99,100]
      // [1,2,3]
      // [1,2,3, 4,5, * , 98,99,100]
      // [1,2, "C3", 4,5, * , 6,7,8,9,10,11]

      //|◀ ◀  1 2 3 ... 9 10 **11** 12 13 ... 98 99 100 ▶ ▶|
      //|◀ ◀  1 **2** 3 ▶ ▶|
      //|◀ ◀  1 2 **3** 4 5 ... 98 99 100 ▶ ▶|
      //|◀ ◀  1 2 3 4 **5** 6 7 8 9 10 11 ▶ ▶|
      //|◀ ◀  3 / 100 ▶ ▶|

      first: z.boolean().optional(),
      last: z.boolean().optional(),
      next: z.boolean().optional(),
      previous: z.boolean().optional(),
      pages: 
        z.object( {
          number: z.number().int().min(1),
          isSeparator: z.boolean().default(false),
          isCurrent: z.boolean().default(false),
          url: z.string().min(1, { message: "URL is required" }).optional(),
        }).array().optional(),
    }).optional(),
    currentPage: z.number().int().min(1).default(1),
    totalPages: z.number().int().min(1).default(1),
  }),
}).extend(DefaultPageContentViewSchema.shape);

const ItemPageContentViewSchema = z.object({
  // attributes
  attributes: AttributesSchema,
}).extend(DefaultPageContentViewSchema.shape);;


// Page content view entity
export const PageContentViewSchema = z.object({
  // page context
  // attributes
  // page type (static, index, item)
  metadata : z.object({
    type: z.enum(['static', 'index', 'item'], { message: "Page type must be static, index, or item" }),
  }),
});

export type SortOperation = z.infer<typeof SortOperationSchema>;
export type FilterOperation = z.infer<typeof FilterOperationSchema>;
export type PaginationConfig = z.infer<typeof PaginationConfigSchema>;
export type GroupByConfig = z.infer<typeof GroupByConfigSchema>;
export type StringConcatenation = z.infer<typeof StringConcatenationSchema>;
export type ViewTransformationParameters = z.infer<typeof ViewTransformationParametersSchema>;
export type ViewTransformationResult = z.infer<typeof ViewTransformationResultSchema>;
export type PageContentView = z.infer<typeof PageContentViewSchema>;