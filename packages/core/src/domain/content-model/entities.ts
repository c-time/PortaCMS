import { z } from 'zod';
import { CategorySlugSchema, FieldSlugSchema, ContentListViewSlugSchema , ContentModelSlugSchema, VirtualFieldSchema } from '../shared/entities.js';
import { FieldGroupId } from '../shared/ids.js';


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


export const FieldUIMetadataSchema = z.object({
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
  fieldGroupId: FieldGroupId.optional(),
});

export const GroupSchema = z.object({
  id: FieldGroupId,
  label: z.string().min(1), // Display Label  
  description: z.string().optional(),
  documentUrl: z.string().optional(),
});

// Content item structure definition
export const ContentItemStructureSchema = z.object({
  groups: z.array(GroupSchema),
  fields : z.array(z.object({
    slug: FieldSlugSchema,
    label: z.string(), // Display Label
    schema : DataTypesSchema,
    uiMetadata: FieldUIMetadataSchema,
  })),

  virtualFields: z.array(VirtualFieldSchema).default([]),

  categories: z.array(z.object({
    slug:  CategorySlugSchema,
    label: z.string(), // Display Label
  })).default([]),


  version: z.number().int().min(1).default(1),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Content list view structure
export const ContentListViewStructureSchema = z.object({
  slug: ContentListViewSlugSchema,
  name: z.string()
    .min(1, { message: "View structure name is required" })
    .max(100, { message: "View structure name must not exceed 100 characters" }),
  description: z.string()
    .max(500, { message: "Description must not exceed 500 characters" })
    .optional(),
  fields: z.array(FieldSlugSchema).min(1, { message: "At least one field must be selected for the view" }),
  sortFields: z.array(z.object({
    field: FieldSlugSchema,
    order: z.enum(['asc', 'desc']).default('asc'),
  })).default([]),
  filterRules: z.array(z.object({
    field: FieldSlugSchema,
    operator: z.enum(['eq', 'ne', 'gt', 'gte', 'lt', 'lte', 'contains', 'startsWith', 'endsWith', 'matches']).default('eq'),
    value: z.unknown(),
  })).default([]),
  groupByFields: z.array(FieldSlugSchema).default([]),
  pagination: z.object({
    enabled: z.boolean(),
    limitPerPage: z.number().int().min(1).max(1000),
    pageNeighborDisplayCount: z.number().int().min(0),
    pageEdgeDisplayCount: z.number().int().min(0),
  }).default({ enabled: true, limitPerPage: 20, pageNeighborDisplayCount: 2, pageEdgeDisplayCount: 3 }),

  isActive: z.boolean().default(true),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Type is defined above
export type ContentItemStructure = z.infer<typeof ContentItemStructureSchema>;
export type ContentListViewStructure = z.infer<typeof ContentListViewStructureSchema>;

// Base content model schema
export const BaseContentModelSchema = z.object({
  slug: ContentModelSlugSchema,
  label: z.string()
    .min(1, { message: "Content model name is required" }),
  description: z.string()
    .optional(),
  documentUrl: z.string().optional(), 
  isActive: z.boolean().default(true),
  enablePublishScheduling: z.boolean().default(false),
  version: z.number().int().min(1).default(1),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Content list entity (collection of multiple items)
export const ListContentModelSchema = BaseContentModelSchema.extend(z.object({
  modelType: z.literal('list'),
  enableCategories: z.boolean().default(false),
  contentItemStructure: ContentItemStructureSchema,
  contentListViewStructure: z.array(ContentListViewStructureSchema).default([]),
}));


// Object content entity (singleton item)
export const ObjectContentModelSchema = z.object({
  modelType: z.literal('object'),
  contentItemStructure: ContentItemStructureSchema,
});



export type ListContentModel = z.infer<typeof ListContentModelSchema>;
export type ObjectContentModel = z.infer<typeof ObjectContentModelSchema>;

// Content model with discriminated union
export const ContentModelSchema = z.discriminatedUnion('modelType', [
  ListContentModelSchema,
  ObjectContentModelSchema,
]);

export type ContentModel = z.infer<typeof ContentModelSchema>;