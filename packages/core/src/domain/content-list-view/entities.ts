import { z } from 'zod';
import { PaginationContextSchema, ContentListViewSlugSchema, FieldSlugSchema } from '../shared/entities.js';


// Root Content List View entity
export const ContentListViewSchema = z.object({
  slug: ContentListViewSlugSchema,
  fields: z.array(FieldSlugSchema),
  generatedAt: z.date(),
  paginationContext: PaginationContextSchema,
});
