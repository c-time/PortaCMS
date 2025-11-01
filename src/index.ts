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