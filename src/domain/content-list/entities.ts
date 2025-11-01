import { z } from 'zod';

/* {

{
  attributes : {
    Name: {
      type: "String"
    }
  }
}

TypeSchema = z.enum(["OneLineText", "MultiLineText", "R"])

{
  attributes : [
    {
      id : "name"
      name: "Name",
      description: "The name of a person",
      type: "String"
    }
  ]
}


## String系
一行テキスト
複数行テキスト
リッチエディタ
記事エディタ

## 日時

## スイッチ(boolean)

## 
単一選択リスト
複数選択リスト
チェックボックス
ラジオボタン


ファイル
画像
}
*/

// Types

// String
export const StringTypeSchema = z.object({
  type: z.literal('String'),
});
// StringArray
export const StringArrayTypeSchema = z.object({
  type: z.literal('StringArray'),
});
// Number
export const NumberTypeSchema = z.object({
  type: z.literal('Number'),
});
// Boolean
export const BooleanTypeSchema = z.object({
  type: z.literal('Boolean'),
});
// Date
export const DateTypeSchema = z.object({
  type: z.literal('Date'),
});
// Link
export const LinkTypeSchema = z.object({
  type: z.literal('Link'),
});
// MultipleSelect
export const MultipleSelectTypeSchema = z.object({
  type: z.literal('MultipleSelect'),
  options: z.array(z.string().min(1)).min(1, { message: "At least one option is required" }),
});
// SingleSelect
export const SingleSelectTypeSchema = z.object({
  type: z.literal('SingleSelect'),
  options: z.array(z.string().min(1)).min(1, { message: "At least one option is required" }),
});
// RelatedMultipleSelect
export const RelatedMultipleSelectTypeSchema = z.object({
  type: z.literal('RelatedMultipleSelect'),
});
// RelatedSingleSelect
export const RelatedSingleSelectTypeSchema = z.object({
  type: z.literal('RelatedSingleSelect'),
});

export const DataTypesSchema = z.union([
  StringTypeSchema,
  StringArrayTypeSchema,
  NumberTypeSchema,
  BooleanTypeSchema,
  DateTypeSchema,
  LinkTypeSchema,
  MultipleSelectTypeSchema,
  SingleSelectTypeSchema,
  RelatedMultipleSelectTypeSchema,
  RelatedSingleSelectTypeSchema,
]);


export const UIMetadataSchema = z.object({
  type: z.string().optional(),
  label: z.string().optional(),
  maxLength: z.number().int().min(0).optional(),
  minLength: z.number().int().min(0).optional(),
  size: z.enum(['small', 'medium', 'large']).optional(),
  description: z.string().optional(),
  required: z.boolean().default(false),
  defaultValue: z.string().array().optional(),
  autoFill: z.boolean().default(false),
  display: z.enum(['hidden', 'visible', 'readOnly']).default('visible'), 
  placeholder: z.string().optional(),
  color: z.string().optional(),
  documentUrl: z.string().optional(),
  prefix: z.string().optional(),
  suffix: z.string().optional(),
  format: z.string().optional(),
});


// Content item structure definition
export const ContentItemStructureSchema = z.object({
  attributes : z.array(z.object({
    slug: z.string() // Attribute ID
      .min(1, { message: "Slug is required" })
      .max(100, { message: "Slug must not exceed 100 characters" })
      .regex(/^[a-z0-9\-_]+$/, { message: "Slug must contain only lowercase letters, numbers, hyphens, and underscores" }),
    label: z.string(), // Display Label
    schema : DataTypesSchema,
    uiMetadata: UIMetadataSchema,
  })),

  categories: z.array(z.object({
    slug: z.string() // Attribute ID
      .min(1, { message: "Slug is required" })
      .max(100, { message: "Slug must not exceed 100 characters" })
      .regex(/^[a-z0-9\-_]+$/, { message: "Slug must contain only lowercase letters, numbers, hyphens, and underscores" }),
    label: z.string(), // Display Label
  })).default([]),

  version: z.number().int().min(1).default(1),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Content list view structure
export const ContentListViewStructureSchema = z.object({
  name: z.string()
    .min(1, { message: "View structure name is required" })
    .max(100, { message: "View structure name must not exceed 100 characters" }),
  description: z.string()
    .max(500, { message: "Description must not exceed 500 characters" })
    .optional(),
  fields: z.array(z.string().min(1)).min(1, { message: "At least one field must be selected for the view" }),
  virtualFields: z.array(z.object({
    slug: z.string() // Virtual field ID
      .min(1, { message: "Slug is required" })
      .max(100, { message: "Slug must not exceed 100 characters" })
      .regex(/^[a-z0-9\-_]+$/, { message: "Slug must contain only lowercase letters, numbers, hyphens, and underscores" }),
    expression: z.string().min(1).describe("Expression to compute the virtual field's value with JSONata path syntax"),
    label: z.string().min(1),
  })).default([]),
  sortFields: z.array(z.object({
    field: z.string().min(1),
    order: z.enum(['asc', 'desc']).default('asc'),
  })).default([]),
  filterRules: z.array(z.object({
    field: z.string().min(1),
    operator: z.enum(['eq', 'ne', 'gt', 'gte', 'lt', 'lte', 'contains', 'startsWith', 'endsWith', 'matches']).default('eq'),
    value: z.unknown(),
  })).default([]),
  groupByFields: z.array(z.string()).default([]),
  pagination: z.object({
    enabled: z.boolean().default(false),
    pageSize: z.number().int().min(1).max(1000).default(100),
    maxPages: z.number().int().min(1).optional(),
  }).default({ enabled: false, pageSize: 10 }),

  isActive: z.boolean().default(true),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Main content list structure
export const ContentListStructureSchema = z.object({
  contentItemStructure: ContentItemStructureSchema,
  contentListViewStructure: z.array(ContentListViewStructureSchema).default([]),
});

// Type is defined above
export type ContentItemStructure = z.infer<typeof ContentItemStructureSchema>;
// export type ViewTransformationConfig = z.infer<typeof ViewTransformationConfigSchema>;
export type ContentListViewStructure = z.infer<typeof ContentListViewStructureSchema>;
export type ContentListStructure = z.infer<typeof ContentListStructureSchema>;


// Content list entity
export const ContentListSchema = z.object({
  slug: z.string()
    .min(1, { message: "Slug is required" })
    .max(100, { message: "Slug must not exceed 100 characters" })
    .regex(/^[a-z0-9\-_]+$/, { message: "Slug must contain only lowercase letters, numbers, hyphens, and underscores" }),
  name: z.string()
    .min(1, { message: "Content list name is required" })
    .max(100, { message: "Content list name must not exceed 100 characters" }),
  description: z.string()
    .max(500, { message: "Description must not exceed 500 characters" })
    .optional(),

  contentListStructure: ContentListStructureSchema,

  enablePublishScheduling: z.boolean().default(false),
  enableTags: z.boolean().default(false),
  enableCategories: z.boolean().default(false),

  isActive: z.boolean().default(true),
  version: z.number().int().min(1).default(1),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type ContentList = z.infer<typeof ContentListSchema>;
