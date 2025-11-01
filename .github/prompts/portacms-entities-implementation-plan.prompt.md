---
name: PortaCMS Entities Implementation Plan
description: Complete implementation plan for PortaCMS headless CMS entity system with UUID management, detailed validation, and unified refactoring
---

# PortaCMS Entities Implementation Plan

## Overview

Complete implementation plan for PortaCMS headless CMS entity system featuring:
- **UUID Management**: crypto.randomUUID with basic try-catch error handling
- **Validation**: Detailed Zod schema validation with English error messages
- **Refactoring**: Unified breaking change approach with new format data updates

## Architecture Requirements

### Core Specifications
- **ID Strategy**: UUID-based identification using crypto.randomUUID
- **Validation Level**: Detailed Zod schema validation with comprehensive rules
- **Error Messages**: English-only validation messages
- **Storage Abstraction**: None (direct file-based operations)
- **Data Transformation**: Basic operations (string concatenation, sorting, filtering, offset, limit, group by, paging)
- **Authentication**: Not included in entities
- **Refactoring Approach**: Breaking changes allowed with unified patterns
- **Data Migration**: New format updates (no backward compatibility)

## Implementation Steps

### Step 1: UUID Foundation & Workspace Entities
**File**: `src/domain/workspace/entities.ts`

**Implementation**:
```typescript
import { z } from 'zod';

// Common UUID schema with detailed validation
export const UUIDSchema = z.string()
  .uuid({ message: "Invalid UUID format" })
  .describe("Universally unique identifier");

// UUID generator with basic error handling
export function generateUUID(): string {
  try {
    return crypto.randomUUID();
  } catch (error) {
    throw new Error("Failed to generate UUID: " + (error as Error).message);
  }
}

// Project entity - root level project management
export const ProjectSchema = z.object({
  id: UUIDSchema,
  name: z.string()
    .min(1, { message: "Project name is required" })
    .max(100, { message: "Project name must not exceed 100 characters" })
    .regex(/^[a-zA-Z0-9\s\-_]+$/, { message: "Project name contains invalid characters" }),
  description: z.string()
    .max(500, { message: "Description must not exceed 500 characters" })
    .optional(),
  createdAt: z.date({ message: "Invalid creation date" }),
  updatedAt: z.date({ message: "Invalid update date" }),
  settings: z.record(z.unknown()).default({}),
});

// Workspace entity - environment and stage management
export const WorkspaceSchema = z.object({
  id: UUIDSchema,
  projectId: UUIDSchema,
  name: z.string()
    .min(1, { message: "Workspace name is required" })
    .max(50, { message: "Workspace name must not exceed 50 characters" }),
  environment: z.enum(['development', 'staging', 'production'], {
    message: "Environment must be development, staging, or production"
  }),
  isActive: z.boolean().default(true),
  configuration: z.record(z.unknown()).default({}),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Project = z.infer<typeof ProjectSchema>;
export type Workspace = z.infer<typeof WorkspaceSchema>;
```

### Step 2: Content Item Core Entities
**File**: `src/domain/content-item/entities.ts`

**Implementation**:
```typescript
import { z } from 'zod';
import { UUIDSchema, generateUUID } from '../workspace/entities.js';

// Content property value types
export const ContentPropertyValueSchema = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.date(),
  z.array(z.unknown()),
  z.record(z.unknown()),
  z.null()
], { message: "Invalid property value type" });

// Content item property definition
export const ContentItemPropertySchema = z.object({
  key: z.string()
    .min(1, { message: "Property key is required" })
    .max(100, { message: "Property key must not exceed 100 characters" })
    .regex(/^[a-zA-Z][a-zA-Z0-9_]*$/, { message: "Property key must start with letter and contain only letters, numbers, and underscores" }),
  value: ContentPropertyValueSchema,
  type: z.enum(['string', 'number', 'boolean', 'date', 'array', 'object'], {
    message: "Property type must be string, number, boolean, date, array, or object"
  }),
  isRequired: z.boolean().default(false),
  validation: z.record(z.unknown()).optional(),
});

// Content item metadata
export const ContentItemMetadataSchema = z.object({
  createdAt: z.date(),
  updatedAt: z.date(),
  createdBy: z.string().optional(),
  updatedBy: z.string().optional(),
  version: z.number().int().min(1).default(1),
  status: z.enum(['draft', 'published', 'archived'], {
    message: "Status must be draft, published, or archived"
  }).default('draft'),
  tags: z.array(z.string()).default([]),
});

// Main content item entity
export const ContentItemSchema = z.object({
  id: UUIDSchema,
  contentListId: UUIDSchema,
  structureId: UUIDSchema,
  properties: z.array(ContentItemPropertySchema)
    .min(1, { message: "At least one property is required" }),
  metadata: ContentItemMetadataSchema,
  slug: z.string()
    .min(1, { message: "Slug is required" })
    .max(200, { message: "Slug must not exceed 200 characters" })
    .regex(/^[a-z0-9\-_/]+$/, { message: "Slug must contain only lowercase letters, numbers, hyphens, underscores, and slashes" }),
});

export type ContentPropertyValue = z.infer<typeof ContentPropertyValueSchema>;
export type ContentItemProperty = z.infer<typeof ContentItemPropertySchema>;
export type ContentItemMetadata = z.infer<typeof ContentItemMetadataSchema>;
export type ContentItem = z.infer<typeof ContentItemSchema>;
```

### Step 3: Content List Management
**File**: `src/domain/content-list/entities.ts`

**Implementation**:
```typescript
import { z } from 'zod';
import { UUIDSchema } from '../workspace/entities.js';

// Content list configuration
export const ContentListConfigurationSchema = z.object({
  allowMultipleItems: z.boolean().default(true),
  maxItems: z.number().int().min(0).optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
  enableVersioning: z.boolean().default(true),
  enablePublishing: z.boolean().default(true),
  allowedStatuses: z.array(z.enum(['draft', 'published', 'archived'])).default(['draft', 'published']),
});

// Content list entity
export const ContentListSchema = z.object({
  id: UUIDSchema,
  workspaceId: UUIDSchema,
  structureId: UUIDSchema,
  name: z.string()
    .min(1, { message: "Content list name is required" })
    .max(100, { message: "Content list name must not exceed 100 characters" }),
  description: z.string()
    .max(500, { message: "Description must not exceed 500 characters" })
    .optional(),
  slug: z.string()
    .min(1, { message: "Slug is required" })
    .max(100, { message: "Slug must not exceed 100 characters" })
    .regex(/^[a-z0-9\-_]+$/, { message: "Slug must contain only lowercase letters, numbers, hyphens, and underscores" }),
  configuration: ContentListConfigurationSchema,
  contentItemIds: z.array(UUIDSchema).default([]),
  isActive: z.boolean().default(true),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Content list summary for listing views
export const ContentListSummarySchema = ContentListSchema.pick({
  id: true,
  name: true,
  slug: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  itemCount: z.number().int().min(0),
});

export type ContentListConfiguration = z.infer<typeof ContentListConfigurationSchema>;
export type ContentList = z.infer<typeof ContentListSchema>;
export type ContentListSummary = z.infer<typeof ContentListSummarySchema>;
```

### Step 4: Structure Definition System
**File**: `src/domain/content-list-structure/entities.ts`

**Implementation**:
```typescript
import { z } from 'zod';
import { UUIDSchema } from '../workspace/entities.js';

// JSON Schema property definition
export const JSONSchemaPropertySchema = z.object({
  type: z.enum(['string', 'number', 'boolean', 'array', 'object'], {
    message: "Property type must be string, number, boolean, array, or object"
  }),
  title: z.string().min(1, { message: "Property title is required" }),
  description: z.string().optional(),
  required: z.boolean().default(false),
  default: z.unknown().optional(),
  enum: z.array(z.unknown()).optional(),
  minimum: z.number().optional(),
  maximum: z.number().optional(),
  minLength: z.number().int().min(0).optional(),
  maxLength: z.number().int().min(0).optional(),
  pattern: z.string().optional(),
  format: z.string().optional(),
  items: z.lazy(() => JSONSchemaPropertySchema.optional()),
  properties: z.record(z.lazy(() => JSONSchemaPropertySchema)).optional(),
});

// Content item structure definition
export const ContentItemStructureSchema = z.object({
  id: UUIDSchema,
  name: z.string()
    .min(1, { message: "Structure name is required" })
    .max(100, { message: "Structure name must not exceed 100 characters" }),
  description: z.string()
    .max(500, { message: "Description must not exceed 500 characters" })
    .optional(),
  jsonSchema: z.object({
    type: z.literal('object'),
    properties: z.record(JSONSchemaPropertySchema)
      .refine(props => Object.keys(props).length > 0, {
        message: "At least one property is required"
      }),
    required: z.array(z.string()).default([]),
    additionalProperties: z.boolean().default(false),
  }),
  uiSchema: z.record(z.unknown()).default({}),
  version: z.number().int().min(1).default(1),
  isActive: z.boolean().default(true),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// View transformation configuration
export const ViewTransformationConfigSchema = z.object({
  sortFields: z.array(z.object({
    field: z.string().min(1),
    order: z.enum(['asc', 'desc']).default('asc'),
  })).default([]),
  filterRules: z.array(z.object({
    field: z.string().min(1),
    operator: z.enum(['eq', 'ne', 'gt', 'gte', 'lt', 'lte', 'contains', 'startsWith', 'endsWith']),
    value: z.unknown(),
  })).default([]),
  groupByFields: z.array(z.string()).default([]),
  pagination: z.object({
    enabled: z.boolean().default(false),
    pageSize: z.number().int().min(1).max(1000).default(10),
    maxPages: z.number().int().min(1).optional(),
  }).default({ enabled: false, pageSize: 10 }),
  stringConcatenation: z.array(z.object({
    outputField: z.string().min(1),
    sourceFields: z.array(z.string().min(1)).min(1),
    separator: z.string().default(' '),
  })).default([]),
});

// Content list view structure
export const ContentListViewStructureSchema = z.object({
  id: UUIDSchema,
  contentListStructureId: UUIDSchema,
  name: z.string()
    .min(1, { message: "View structure name is required" })
    .max(100, { message: "View structure name must not exceed 100 characters" }),
  description: z.string()
    .max(500, { message: "Description must not exceed 500 characters" })
    .optional(),
  transformationConfig: ViewTransformationConfigSchema,
  outputFormat: z.enum(['json', 'markdown'], { message: "Output format must be json or markdown" }).default('json'),
  isActive: z.boolean().default(true),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Main content list structure
export const ContentListStructureSchema = z.object({
  id: UUIDSchema,
  workspaceId: UUIDSchema,
  name: z.string()
    .min(1, { message: "Content list structure name is required" })
    .max(100, { message: "Content list structure name must not exceed 100 characters" }),
  description: z.string()
    .max(500, { message: "Description must not exceed 500 characters" })
    .optional(),
  itemStructure: ContentItemStructureSchema,
  viewStructures: z.array(UUIDSchema).default([]),
  version: z.number().int().min(1).default(1),
  isActive: z.boolean().default(true),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type JSONSchemaProperty = z.infer<typeof JSONSchemaPropertySchema>;
export type ContentItemStructure = z.infer<typeof ContentItemStructureSchema>;
export type ViewTransformationConfig = z.infer<typeof ViewTransformationConfigSchema>;
export type ContentListViewStructure = z.infer<typeof ContentListViewStructureSchema>;
export type ContentListStructure = z.infer<typeof ContentListStructureSchema>;
```

### Step 5: SSG Data Transformation
**File**: `src/domain/page-content-view/entities.ts`

**Implementation**:
```typescript
import { z } from 'zod';
import { UUIDSchema } from '../workspace/entities.js';

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
  fieldMappings: z.record(z.string()).default({}), // field rename mappings
  includeFields: z.array(z.string()).optional(), // whitelist fields
  excludeFields: z.array(z.string()).default([]), // blacklist fields
});

// Transformation result
export const ViewTransformationResultSchema = z.object({
  data: z.array(z.record(z.unknown())),
  metadata: z.object({
    totalCount: z.number().int().min(0),
    pageCount: z.number().int().min(0).optional(),
    currentPage: z.number().int().min(0).optional(),
    hasNextPage: z.boolean().optional(),
    hasPreviousPage: z.boolean().optional(),
    transformedAt: z.date(),
  }),
});

// Page content view entity
export const PageContentViewSchema = z.object({
  id: UUIDSchema,
  contentListId: UUIDSchema,
  viewStructureId: UUIDSchema,
  name: z.string()
    .min(1, { message: "Page content view name is required" })
    .max(100, { message: "Page content view name must not exceed 100 characters" }),
  description: z.string()
    .max(500, { message: "Description must not exceed 500 characters" })
    .optional(),
  slug: z.string()
    .min(1, { message: "Slug is required" })
    .max(100, { message: "Slug must not exceed 100 characters" })
    .regex(/^[a-z0-9\-_/]+$/, { message: "Slug must contain only lowercase letters, numbers, hyphens, underscores, and slashes" }),
  transformationParameters: ViewTransformationParametersSchema,
  outputPath: z.string()
    .min(1, { message: "Output path is required" })
    .regex(/^[a-zA-Z0-9\-_/\.]+$/, { message: "Invalid output path format" }),
  isActive: z.boolean().default(true),
  lastGenerated: z.date().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type SortOperation = z.infer<typeof SortOperationSchema>;
export type FilterOperation = z.infer<typeof FilterOperationSchema>;
export type PaginationConfig = z.infer<typeof PaginationConfigSchema>;
export type GroupByConfig = z.infer<typeof GroupByConfigSchema>;
export type StringConcatenation = z.infer<typeof StringConcatenationSchema>;
export type ViewTransformationParameters = z.infer<typeof ViewTransformationParametersSchema>;
export type ViewTransformationResult = z.infer<typeof ViewTransformationResultSchema>;
export type PageContentView = z.infer<typeof PageContentViewSchema>;
```

### Step 6: Unified Website Structure Refactoring
**File**: `src/domain/website-structure/entities.ts`

**Breaking Change Implementation**:
```typescript
import { z } from 'zod';
import { UUIDSchema, generateUUID } from '../workspace/entities.js';

// Updated with UUID-based architecture
export const PageContentViewStructureSchema = z.object({
  id: UUIDSchema,
  pageContentViewId: UUIDSchema,
  name: z.string()
    .min(1, { message: "View structure name is required" })
    .max(100, { message: "View structure name must not exceed 100 characters" }),
  slug: z.string()
    .min(1, { message: "Slug is required" })
    .regex(/^[a-z0-9\-_/]+$/, { message: "Invalid slug format" }),
  outputPath: z.string().min(1, { message: "Output path is required" }),
  isActive: z.boolean().default(true),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const WebsiteStructureSchema = z.object({
  id: UUIDSchema,
  workspaceId: UUIDSchema,
  name: z.string()
    .min(1, { message: "Website structure name is required" })
    .max(100, { message: "Website structure name must not exceed 100 characters" }),
  domain: z.string()
    .url({ message: "Invalid domain URL format" })
    .optional(),
  baseUrl: z.string()
    .url({ message: "Invalid base URL format" })
    .default('/'),
  pageContentViews: z.array(PageContentViewStructureSchema).default([]),
  globalSettings: z.record(z.unknown()).default({}),
  seoSettings: z.object({
    defaultTitle: z.string().optional(),
    defaultDescription: z.string().optional(),
    defaultKeywords: z.array(z.string()).default([]),
    ogImage: z.string().url().optional(),
  }).default({}),
  isActive: z.boolean().default(true),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const WebsiteSchema = z.object({
  id: UUIDSchema,
  projectId: UUIDSchema,
  name: z.string()
    .min(1, { message: "Website name is required" })
    .max(100, { message: "Website name must not exceed 100 characters" }),
  description: z.string()
    .max(500, { message: "Description must not exceed 500 characters" })
    .optional(),
  structure: WebsiteStructureSchema,
  deploymentSettings: z.record(z.unknown()).default({}),
  isActive: z.boolean().default(true),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type PageContentViewStructure = z.infer<typeof PageContentViewStructureSchema>;
export type WebsiteStructure = z.infer<typeof WebsiteStructureSchema>;
export type Website = z.infer<typeof WebsiteSchema>;

// UUID-based helper functions
export function createWebsite(projectId: string, name: string): Website {
  const now = new Date();
  return {
    id: generateUUID(),
    projectId,
    name,
    structure: {
      id: generateUUID(),
      workspaceId: generateUUID(), // This should be provided from actual workspace
      name: `${name} Structure`,
      baseUrl: '/',
      pageContentViews: [],
      globalSettings: {},
      seoSettings: {},
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
    deploymentSettings: {},
    isActive: true,
    createdAt: now,
    updatedAt: now,
  };
}
```

### Step 7: Unified Type Export
**File**: `src/index.ts`

**Complete Export Integration**:
```typescript
// UUID utilities and common schemas
export {
  UUIDSchema,
  generateUUID,
  type Project,
  type Workspace,
  ProjectSchema,
  WorkspaceSchema,
} from './domain/workspace/entities.js';

// Content management entities
export {
  type ContentPropertyValue,
  type ContentItemProperty,
  type ContentItemMetadata,
  type ContentItem,
  ContentPropertyValueSchema,
  ContentItemPropertySchema,
  ContentItemMetadataSchema,
  ContentItemSchema,
} from './domain/content-item/entities.js';

// Content list management
export {
  type ContentListConfiguration,
  type ContentList,
  type ContentListSummary,
  ContentListConfigurationSchema,
  ContentListSchema,
  ContentListSummarySchema,
} from './domain/content-list/entities.js';

// Structure definitions
export {
  type JSONSchemaProperty,
  type ContentItemStructure,
  type ViewTransformationConfig,
  type ContentListViewStructure,
  type ContentListStructure,
  JSONSchemaPropertySchema,
  ContentItemStructureSchema,
  ViewTransformationConfigSchema,
  ContentListViewStructureSchema,
  ContentListStructureSchema,
} from './domain/content-list-structure/entities.js';

// Data transformation for SSG
export {
  type SortOperation,
  type FilterOperation,
  type PaginationConfig,
  type GroupByConfig,
  type StringConcatenation,
  type ViewTransformationParameters,
  type ViewTransformationResult,
  type PageContentView,
  SortOperationSchema,
  FilterOperationSchema,
  PaginationConfigSchema,
  GroupByConfigSchema,
  StringConcatenationSchema,
  ViewTransformationParametersSchema,
  ViewTransformationResultSchema,
  PageContentViewSchema,
} from './domain/page-content-view/entities.js';

// Website structure (updated with UUID)
export {
  type PageContentViewStructure,
  type WebsiteStructure,
  type Website,
  PageContentViewStructureSchema,
  WebsiteStructureSchema,
  WebsiteSchema,
  createWebsite,
} from './domain/website-structure/entities.js';
```

## Implementation Notes

### Breaking Changes
- All entity IDs converted from custom formats to UUID
- `website-structure` entities completely refactored
- New validation messages in English only
- Removed backward compatibility for old data formats

### Error Handling Strategy
- Basic try-catch for UUID generation failures
- Comprehensive Zod validation with descriptive error messages
- Graceful degradation for optional properties

### Data Migration Requirements
- All existing data must be migrated to new UUID format
- Sample data should be updated to reflect new entity schemas
- Documentation should reference new entity structure

### Future Extensibility
- Pluggable storage interfaces can be added later
- Authentication entities can be integrated as separate domain
- Additional transformation operations can be extended in page-content-view

This plan provides a complete, type-safe, UUID-based entity system for the PortaCMS headless CMS with detailed validation and SSG integration capabilities.
