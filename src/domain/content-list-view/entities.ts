import { z } from 'zod';
import { PaginationContextSchema, ContentListViewSlugSchema, FieldSlugSchema } from '../shared/entities';


// Root Content List View entity
export const ContentListViewSchema = z.object({
  slug: ContentListViewSlugSchema,
  fields: z.array(FieldSlugSchema),
  generatedAt: z.date(),
  paginationContext: PaginationContextSchema,
  
  // id: z.string(),
  // name: z.string(), // View name
  // description: z.string().optional(),
  // fields: z.array(z.string()), // Selected fields for the view
  // sortFields: z.array(z.object({
  //   field: z.string(),  // Field to sort by
  //   order: z.enum(['asc', 'desc']).default('asc'), // Sort order
  // })).default([]),
  // filterRules: z.array(z.object({
  //   field: z.string(), // Field to filter
  //   operator: z.enum(['eq', 'ne', 'gt', 'gte', 'lt', 'lte', 'contains', 'startsWith', 'endsWith', 'matches']).default('eq'), // Filter operator
  //   value: z.unknown(), // Value to filter by
  // })).default([]),
  // groupByFields: z.array(z.string()).default([]), // Fields to group by 
});
