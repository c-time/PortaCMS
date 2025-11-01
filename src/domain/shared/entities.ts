import { z } from 'zod';

const SlugSchema = z.string() 
      .min(1, { message: "Slug is required" })
      .max(100, { message: "Slug must not exceed 100 characters" })
      .regex(/^[a-z0-9\-_]+$/, { message: "Slug must contain only lowercase letters, numbers, hyphens, and underscores" });

export const WorkspaceSlugSchema = SlugSchema.brand('WorkspaceSlug');

export const FieldSlugSchema = SlugSchema.brand('FieldSlug');

export const ContentItemSlugSchema = SlugSchema.brand('ContentItemSlug');

export const CategorySlugSchema = SlugSchema.brand('CategorySlug');

export const ContentModelSlugSchema = SlugSchema.brand('ContentModelSlug');

export const ContentListViewSlugSchema = SlugSchema.brand('ContentListViewSlug');

export type WorkspaceSlug = z.infer<typeof WorkspaceSlugSchema>;
export type FieldSlug = z.infer<typeof FieldSlugSchema>;
export type ContentItemSlug = z.infer<typeof ContentItemSlugSchema>;
export type CategorySlug = z.infer<typeof CategorySlugSchema>;
export type ContentModelSlug = z.infer<typeof ContentModelSlugSchema>;
export type ContentListViewSlug = z.infer<typeof ContentListViewSlugSchema>;

export const FieldValueSchema = z.array(z.string())
    .or(z.string())
    .or(z.array(z.object({
      label: z.string(),
      slug: z.string(),
      value: z.string(),
    })));

export const PageContextFieldSchema = z.object({
  slug: FieldSlugSchema,
  value: FieldValueSchema, // Supports multiple values
});

export const JSONataExpressionSchema = z.string().min(1).describe("Expression in JSONata path syntax").brand('JSONataExpression');

export type JSONataExpression = z.infer<typeof JSONataExpressionSchema>;

export const VirtualFieldSchema = z.object({
    slug: FieldSlugSchema,
    expression: JSONataExpressionSchema,
    label: z.string().min(1),
  });

export const PaginationContextSchema = z.object({
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

    items: z.array(FieldValueSchema).default([]),
    links : z.object({
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
  })


