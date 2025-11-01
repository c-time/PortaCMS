import { z } from 'zod';

const SlugSchema = z.string() 
      .min(1, { message: "Slug is required" })
      .max(100, { message: "Slug must not exceed 100 characters" })
      .regex(/^[a-z0-9\-_]+$/, { message: "Slug must contain only lowercase letters, numbers, hyphens, and underscores" });

export const FieldSlugSchema = SlugSchema.brand('FieldSlug');

export const ContentItemSlugSchema = SlugSchema.brand('ContentItemSlug');

export const FieldSchema = z.record(FieldSlugSchema, 
    z.array(z.string())
    .or(z.string())
    .or(z.array(z.object({
      label: z.string(),
      slug: z.string(),
      value: z.string(),
    })))
    ).default({});

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

    items: z.array(FieldSchema).default([]),
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


