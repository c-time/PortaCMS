// ========================================
// Commands for Content Model Management
// ========================================

import {
  ContentModel,
  ListContentModel,
  ObjectContentModel,
  ListContentModelSchema,
  ObjectContentModelSchema,
  FieldDefinition,
  FieldDefinitionSchema,
  DataType,
  FieldUIMetadata,
  FieldUIMetadataSchema,
  Group,
  GroupSchema,
  CategoryDefinition,
  CategoryDefinitionSchema,
  ContentListViewStructure,
  ContentListViewStructureSchema,
  SortField,
  FilterRule,
  PaginationConfig,
} from './entities.js';
import { FieldSlug, CategorySlug, ContentListViewSlug, ContentModelSlug, VirtualFieldSchema } from '../shared/entities.js';
import { FieldGroupId } from '../shared/ids.js';
import { z } from 'zod';

// ========================================
// Error Definitions
// ========================================

export class ContentModelNotFoundError extends Error {
  constructor(slug: ContentModelSlug) {
    super(`Content model with slug '${slug}' not found.`);
    this.name = 'ContentModelNotFoundError';
  }
}

export class FieldNotFoundError extends Error {
  constructor(fieldSlug: FieldSlug) {
    super(`Field '${fieldSlug}' not found in content model.`);
    this.name = 'FieldNotFoundError';
  }
}

export class FieldAlreadyExistsError extends Error {
  constructor(fieldSlug: FieldSlug) {
    super(`Field '${fieldSlug}' already exists in content model.`);
    this.name = 'FieldAlreadyExistsError';
  }
}

export class GroupNotFoundError extends Error {
  constructor(groupId: string) {
    super(`Group with id '${groupId}' not found.`);
    this.name = 'GroupNotFoundError';
  }
}

export class GroupAlreadyExistsError extends Error {
  constructor(groupId: string) {
    super(`Group with id '${groupId}' already exists.`);
    this.name = 'GroupAlreadyExistsError';
  }
}

export class CategoryNotFoundError extends Error {
  constructor(categorySlug: CategorySlug) {
    super(`Category '${categorySlug}' not found.`);
    this.name = 'CategoryNotFoundError';
  }
}

export class CategoryAlreadyExistsError extends Error {
  constructor(categorySlug: CategorySlug) {
    super(`Category '${categorySlug}' already exists.`);
    this.name = 'CategoryAlreadyExistsError';
  }
}

export class VirtualFieldNotFoundError extends Error {
  constructor(fieldSlug: FieldSlug) {
    super(`Virtual field '${fieldSlug}' not found.`);
    this.name = 'VirtualFieldNotFoundError';
  }
}

export class VirtualFieldAlreadyExistsError extends Error {
  constructor(fieldSlug: FieldSlug) {
    super(`Virtual field '${fieldSlug}' already exists.`);
    this.name = 'VirtualFieldAlreadyExistsError';
  }
}

export class ContentListViewNotFoundError extends Error {
  constructor(viewSlug: ContentListViewSlug) {
    super(`Content list view '${viewSlug}' not found.`);
    this.name = 'ContentListViewNotFoundError';
  }
}

export class ContentListViewAlreadyExistsError extends Error {
  constructor(viewSlug: ContentListViewSlug) {
    super(`Content list view '${viewSlug}' already exists.`);
    this.name = 'ContentListViewAlreadyExistsError';
  }
}

export class InvalidModelTypeError extends Error {
  constructor(operation: string, modelType: string) {
    super(`Cannot perform '${operation}' on model type '${modelType}'.`);
    this.name = 'InvalidModelTypeError';
  }
}

// ========================================
// Basic Content Model Commands
// ========================================

// Create List Content Model Command (Factory Function)
export interface CreateListContentModelParams {
  slug: ContentModelSlug;
  label: string;
  description?: string;
  documentUrl?: string;
  isActive?: boolean;
  enablePublishScheduling?: boolean;
  enableCategories?: boolean;
  orderValue?: number;
  createdAt: Date;
}

export interface CreateListContentModelResult {
  nextState: ListContentModel;
}

export function createListContentModel(
  params: CreateListContentModelParams
): CreateListContentModelResult {
  const nextState = ListContentModelSchema.parse({
    slug: params.slug,
    label: params.label,
    description: params.description,
    documentUrl: params.documentUrl,
    isActive: params.isActive ?? true,
    enablePublishScheduling: params.enablePublishScheduling ?? false,
    enableCategories: params.enableCategories ?? false,
    orderValue: params.orderValue ?? 0,
    modelType: 'list',
    version: 1,
    createdAt: params.createdAt,
    updatedAt: params.createdAt,
    contentItemStructure: {
      groups: [],
      fields: [],
      virtualFields: [],
      categories: [],
      version: 1,
      createdAt: params.createdAt,
      updatedAt: params.createdAt,
    },
    contentListViewStructure: [],
  });

  return { nextState };
}

// Create Object Content Model Command (Factory Function)
export interface CreateObjectContentModelParams {
  slug: ContentModelSlug;
  label: string;
  description?: string;
  documentUrl?: string;
  isActive?: boolean;
  enablePublishScheduling?: boolean;
  orderValue?: number;
  createdAt: Date;
}

export interface CreateObjectContentModelResult {
  nextState: ObjectContentModel;
}

export function createObjectContentModel(
  params: CreateObjectContentModelParams
): CreateObjectContentModelResult {
  const nextState = ObjectContentModelSchema.parse({
    slug: params.slug,
    label: params.label,
    description: params.description,
    documentUrl: params.documentUrl,
    isActive: params.isActive ?? true,
    enablePublishScheduling: params.enablePublishScheduling ?? false,
    orderValue: params.orderValue ?? 0,
    modelType: 'object',
    version: 1,
    createdAt: params.createdAt,
    updatedAt: params.createdAt,
    contentItemStructure: {
      groups: [],
      fields: [],
      virtualFields: [],
      categories: [],
      version: 1,
      createdAt: params.createdAt,
      updatedAt: params.createdAt,
    },
  });

  return { nextState };
}

// Delete Content Model Command (marks as inactive)
export interface DeleteContentModelParams {
  updatedAt: Date;
}

export interface DeleteContentModelResult {
  nextState: ContentModel;
  patch: Partial<ContentModel>;
}

export function deleteContentModel(
  prevState: ContentModel,
  params: DeleteContentModelParams
): DeleteContentModelResult {
  const patch: Partial<ContentModel> = {
    isActive: false,
    updatedAt: params.updatedAt,
  };

  let nextState: ContentModel;
  if (prevState.modelType === 'list') {
    nextState = ListContentModelSchema.parse({
      slug: prevState.slug,
      label: prevState.label,
      description: prevState.description,
      documentUrl: prevState.documentUrl,
      isActive: false,
      enablePublishScheduling: prevState.enablePublishScheduling,
      enableCategories: prevState.enableCategories,
      orderValue: prevState.orderValue,
      modelType: 'list',
      version: prevState.version,
      createdAt: prevState.createdAt,
      updatedAt: params.updatedAt,
      contentItemStructure: prevState.contentItemStructure,
      contentListViewStructure: prevState.contentListViewStructure,
    });
  } else {
    nextState = ObjectContentModelSchema.parse({
      slug: prevState.slug,
      label: prevState.label,
      description: prevState.description,
      documentUrl: prevState.documentUrl,
      isActive: false,
      enablePublishScheduling: prevState.enablePublishScheduling,
      orderValue: prevState.orderValue,
      modelType: 'object',
      version: prevState.version,
      createdAt: prevState.createdAt,
      updatedAt: params.updatedAt,
      contentItemStructure: prevState.contentItemStructure,
    });
  }

  return { nextState, patch };
}

// Update Content Model Properties Command
export interface UpdateContentModelPropertiesParams {
  label?: string;
  description?: string;
  documentUrl?: string;
  isActive?: boolean;
  enablePublishScheduling?: boolean;
  orderValue?: number;
  updatedAt: Date;
}

export interface UpdateContentModelPropertiesResult {
  nextState: ContentModel;
  patch: Partial<ContentModel>;
}

export function updateContentModelProperties(
  prevState: ContentModel,
  params: UpdateContentModelPropertiesParams
): UpdateContentModelPropertiesResult {
  const patch: Partial<ContentModel> = {
    ...(params.label !== undefined && { label: params.label }),
    ...(params.description !== undefined && { description: params.description }),
    ...(params.documentUrl !== undefined && { documentUrl: params.documentUrl }),
    ...(params.isActive !== undefined && { isActive: params.isActive }),
    ...(params.enablePublishScheduling !== undefined && { enablePublishScheduling: params.enablePublishScheduling }),
    ...(params.orderValue !== undefined && { orderValue: params.orderValue }),
    updatedAt: params.updatedAt,
  };

  let nextState: ContentModel;
  if (prevState.modelType === 'list') {
    nextState = ListContentModelSchema.parse({
      slug: prevState.slug,
      label: params.label !== undefined ? params.label : prevState.label,
      description: params.description !== undefined ? params.description : prevState.description,
      documentUrl: params.documentUrl !== undefined ? params.documentUrl : prevState.documentUrl,
      isActive: params.isActive !== undefined ? params.isActive : prevState.isActive,
      enablePublishScheduling: params.enablePublishScheduling !== undefined ? params.enablePublishScheduling : prevState.enablePublishScheduling,
      enableCategories: prevState.enableCategories,
      orderValue: params.orderValue !== undefined ? params.orderValue : prevState.orderValue,
      modelType: 'list',
      version: prevState.version,
      createdAt: prevState.createdAt,
      updatedAt: params.updatedAt,
      contentItemStructure: prevState.contentItemStructure,
      contentListViewStructure: prevState.contentListViewStructure,
    });
  } else {
    nextState = ObjectContentModelSchema.parse({
      slug: prevState.slug,
      label: params.label !== undefined ? params.label : prevState.label,
      description: params.description !== undefined ? params.description : prevState.description,
      documentUrl: params.documentUrl !== undefined ? params.documentUrl : prevState.documentUrl,
      isActive: params.isActive !== undefined ? params.isActive : prevState.isActive,
      enablePublishScheduling: params.enablePublishScheduling !== undefined ? params.enablePublishScheduling : prevState.enablePublishScheduling,
      orderValue: params.orderValue !== undefined ? params.orderValue : prevState.orderValue,
      modelType: 'object',
      version: prevState.version,
      createdAt: prevState.createdAt,
      updatedAt: params.updatedAt,
      contentItemStructure: prevState.contentItemStructure,
    });
  }

  return { nextState, patch };
}

// ========================================
// Field Management Commands
// ========================================

// Add Field to Content Model Command
export interface AddFieldParams {
  field: FieldDefinition;
  updatedAt: Date;
}

export interface AddFieldResult {
  nextState: ContentModel;
  patch: Partial<ContentModel>;
}

export function addField(
  prevState: ContentModel,
  params: AddFieldParams
): AddFieldResult {
  const validatedField = FieldDefinitionSchema.parse(params.field);

  const fieldExists = prevState.contentItemStructure.fields.some(
    (f) => f.slug === validatedField.slug
  );

  if (fieldExists) {
    throw new FieldAlreadyExistsError(validatedField.slug);
  }

  const nextFields = [...prevState.contentItemStructure.fields, validatedField];
  const nextContentItemStructure = {
    groups: prevState.contentItemStructure.groups,
    fields: nextFields,
    virtualFields: prevState.contentItemStructure.virtualFields,
    categories: prevState.contentItemStructure.categories,
    version: prevState.contentItemStructure.version,
    createdAt: prevState.contentItemStructure.createdAt,
    updatedAt: params.updatedAt,
  };

  const patch: Partial<ContentModel> = {
    contentItemStructure: nextContentItemStructure,
    updatedAt: params.updatedAt,
  };

  let nextState: ContentModel;
  if (prevState.modelType === 'list') {
    nextState = {
      slug: prevState.slug,
      label: prevState.label,
      description: prevState.description,
      documentUrl: prevState.documentUrl,
      isActive: prevState.isActive,
      enablePublishScheduling: prevState.enablePublishScheduling,
      enableCategories: prevState.enableCategories,
      orderValue: prevState.orderValue,
      modelType: 'list',
      version: prevState.version,
      createdAt: prevState.createdAt,
      updatedAt: params.updatedAt,
      contentItemStructure: nextContentItemStructure,
      contentListViewStructure: prevState.contentListViewStructure,
    };
  } else {
    nextState = {
      slug: prevState.slug,
      label: prevState.label,
      description: prevState.description,
      documentUrl: prevState.documentUrl,
      isActive: prevState.isActive,
      enablePublishScheduling: prevState.enablePublishScheduling,
      orderValue: prevState.orderValue,
      modelType: 'object',
      version: prevState.version,
      createdAt: prevState.createdAt,
      updatedAt: params.updatedAt,
      contentItemStructure: nextContentItemStructure,
    };
  }

  return { nextState, patch };
}

// Remove Field from Content Model Command
export interface RemoveFieldParams {
  fieldSlug: FieldSlug;
  updatedAt: Date;
}

export interface RemoveFieldResult {
  nextState: ContentModel;
  patch: Partial<ContentModel>;
}

export function removeField(
  prevState: ContentModel,
  params: RemoveFieldParams
): RemoveFieldResult {
  const fieldIndex = prevState.contentItemStructure.fields.findIndex(
    (f) => f.slug === params.fieldSlug
  );

  if (fieldIndex === -1) {
    throw new FieldNotFoundError(params.fieldSlug);
  }

  const nextFields = prevState.contentItemStructure.fields.filter(
    (f) => f.slug !== params.fieldSlug
  );

  const nextContentItemStructure = {
    groups: prevState.contentItemStructure.groups,
    fields: nextFields,
    virtualFields: prevState.contentItemStructure.virtualFields,
    categories: prevState.contentItemStructure.categories,
    version: prevState.contentItemStructure.version,
    createdAt: prevState.contentItemStructure.createdAt,
    updatedAt: params.updatedAt,
  };

  const patch: Partial<ContentModel> = {
    contentItemStructure: nextContentItemStructure,
    updatedAt: params.updatedAt,
  };

  let nextState: ContentModel;
  if (prevState.modelType === 'list') {
    nextState = {
      slug: prevState.slug,
      label: prevState.label,
      description: prevState.description,
      documentUrl: prevState.documentUrl,
      isActive: prevState.isActive,
      enablePublishScheduling: prevState.enablePublishScheduling,
      enableCategories: prevState.enableCategories,
      orderValue: prevState.orderValue,
      modelType: 'list',
      version: prevState.version,
      createdAt: prevState.createdAt,
      updatedAt: params.updatedAt,
      contentItemStructure: nextContentItemStructure,
      contentListViewStructure: prevState.contentListViewStructure,
    };
  } else {
    nextState = {
      slug: prevState.slug,
      label: prevState.label,
      description: prevState.description,
      documentUrl: prevState.documentUrl,
      isActive: prevState.isActive,
      enablePublishScheduling: prevState.enablePublishScheduling,
      orderValue: prevState.orderValue,
      modelType: 'object',
      version: prevState.version,
      createdAt: prevState.createdAt,
      updatedAt: params.updatedAt,
      contentItemStructure: nextContentItemStructure,
    };
  }

  return { nextState, patch };
}

// Change Order of Fields Command
export interface ChangeFieldOrderParams {
  orderedFieldSlugs: FieldSlug[];
  updatedAt: Date;
}

export interface ChangeFieldOrderResult {
  nextState: ContentModel;
  patch: Partial<ContentModel>;
}

export function changeFieldOrder(
  prevState: ContentModel,
  params: ChangeFieldOrderParams
): ChangeFieldOrderResult {
  const currentFieldSlugs = new Set(prevState.contentItemStructure.fields.map(f => f.slug));
  const orderedFieldSlugsSet = new Set(params.orderedFieldSlugs);

  if (currentFieldSlugs.size !== orderedFieldSlugsSet.size) {
    throw new Error('Field count mismatch: orderedFieldSlugs must contain all existing fields.');
  }

  for (const slug of params.orderedFieldSlugs) {
    if (!currentFieldSlugs.has(slug)) {
      throw new FieldNotFoundError(slug);
    }
  }

  const fieldMap = new Map(prevState.contentItemStructure.fields.map(f => [f.slug, f]));
  const nextFields = params.orderedFieldSlugs.map(slug => fieldMap.get(slug)!);

  const nextContentItemStructure = {
    groups: prevState.contentItemStructure.groups,
    fields: nextFields,
    virtualFields: prevState.contentItemStructure.virtualFields,
    categories: prevState.contentItemStructure.categories,
    version: prevState.contentItemStructure.version,
    createdAt: prevState.contentItemStructure.createdAt,
    updatedAt: params.updatedAt,
  };

  const patch: Partial<ContentModel> = {
    contentItemStructure: nextContentItemStructure,
    updatedAt: params.updatedAt,
  };

  let nextState: ContentModel;
  if (prevState.modelType === 'list') {
    nextState = {
      slug: prevState.slug,
      label: prevState.label,
      description: prevState.description,
      documentUrl: prevState.documentUrl,
      isActive: prevState.isActive,
      enablePublishScheduling: prevState.enablePublishScheduling,
      enableCategories: prevState.enableCategories,
      orderValue: prevState.orderValue,
      modelType: 'list',
      version: prevState.version,
      createdAt: prevState.createdAt,
      updatedAt: params.updatedAt,
      contentItemStructure: nextContentItemStructure,
      contentListViewStructure: prevState.contentListViewStructure,
    };
  } else {
    nextState = {
      slug: prevState.slug,
      label: prevState.label,
      description: prevState.description,
      documentUrl: prevState.documentUrl,
      isActive: prevState.isActive,
      enablePublishScheduling: prevState.enablePublishScheduling,
      orderValue: prevState.orderValue,
      modelType: 'object',
      version: prevState.version,
      createdAt: prevState.createdAt,
      updatedAt: params.updatedAt,
      contentItemStructure: nextContentItemStructure,
    };
  }

  return { nextState, patch };
}

// Change Data Type of Field Command
export interface ChangeFieldDataTypeParams {
  fieldSlug: FieldSlug;
  newDataType: DataType;
  updatedAt: Date;
}

export interface ChangeFieldDataTypeResult {
  nextState: ContentModel;
  patch: Partial<ContentModel>;
}

export function changeFieldDataType(
  prevState: ContentModel,
  params: ChangeFieldDataTypeParams
): ChangeFieldDataTypeResult {
  const fieldIndex = prevState.contentItemStructure.fields.findIndex(
    (f) => f.slug === params.fieldSlug
  );

  if (fieldIndex === -1) {
    throw new FieldNotFoundError(params.fieldSlug);
  }

  const currentField = prevState.contentItemStructure.fields[fieldIndex]!;
  const updatedField: FieldDefinition = {
    slug: currentField.slug,
    label: currentField.label,
    schema: params.newDataType,
    uiMetadata: currentField.uiMetadata,
  };

  const nextFields = prevState.contentItemStructure.fields.map((f, idx) =>
    idx === fieldIndex ? updatedField : f
  );

  const nextContentItemStructure = {
    groups: prevState.contentItemStructure.groups,
    fields: nextFields,
    virtualFields: prevState.contentItemStructure.virtualFields,
    categories: prevState.contentItemStructure.categories,
    version: prevState.contentItemStructure.version,
    createdAt: prevState.contentItemStructure.createdAt,
    updatedAt: params.updatedAt,
  };

  const patch: Partial<ContentModel> = {
    contentItemStructure: nextContentItemStructure,
    updatedAt: params.updatedAt,
  };

  let nextState: ContentModel;
  if (prevState.modelType === 'list') {
    nextState = {
      slug: prevState.slug,
      label: prevState.label,
      description: prevState.description,
      documentUrl: prevState.documentUrl,
      isActive: prevState.isActive,
      enablePublishScheduling: prevState.enablePublishScheduling,
      enableCategories: prevState.enableCategories,
      orderValue: prevState.orderValue,
      modelType: 'list',
      version: prevState.version,
      createdAt: prevState.createdAt,
      updatedAt: params.updatedAt,
      contentItemStructure: nextContentItemStructure,
      contentListViewStructure: prevState.contentListViewStructure,
    };
  } else {
    nextState = {
      slug: prevState.slug,
      label: prevState.label,
      description: prevState.description,
      documentUrl: prevState.documentUrl,
      isActive: prevState.isActive,
      enablePublishScheduling: prevState.enablePublishScheduling,
      orderValue: prevState.orderValue,
      modelType: 'object',
      version: prevState.version,
      createdAt: prevState.createdAt,
      updatedAt: params.updatedAt,
      contentItemStructure: nextContentItemStructure,
    };
  }

  return { nextState, patch };
}

// Update Field UI Metadata Command
export interface UpdateFieldUIMetadataParams {
  fieldSlug: FieldSlug;
  uiMetadata: Partial<FieldUIMetadata>;
  updatedAt: Date;
}

export interface UpdateFieldUIMetadataResult {
  nextState: ContentModel;
  patch: Partial<ContentModel>;
}

export function updateFieldUIMetadata(
  prevState: ContentModel,
  params: UpdateFieldUIMetadataParams
): UpdateFieldUIMetadataResult {
  const fieldIndex = prevState.contentItemStructure.fields.findIndex(
    (f) => f.slug === params.fieldSlug
  );

  if (fieldIndex === -1) {
    throw new FieldNotFoundError(params.fieldSlug);
  }

  const currentField = prevState.contentItemStructure.fields[fieldIndex]!;
  const mergedUIMetadata = FieldUIMetadataSchema.parse({
    type: params.uiMetadata.type !== undefined ? params.uiMetadata.type : currentField.uiMetadata.type,
    label: params.uiMetadata.label !== undefined ? params.uiMetadata.label : currentField.uiMetadata.label,
    maxLength: params.uiMetadata.maxLength !== undefined ? params.uiMetadata.maxLength : currentField.uiMetadata.maxLength,
    minLength: params.uiMetadata.minLength !== undefined ? params.uiMetadata.minLength : currentField.uiMetadata.minLength,
    size: params.uiMetadata.size !== undefined ? params.uiMetadata.size : currentField.uiMetadata.size,
    description: params.uiMetadata.description !== undefined ? params.uiMetadata.description : currentField.uiMetadata.description,
    required: params.uiMetadata.required !== undefined ? params.uiMetadata.required : currentField.uiMetadata.required,
    defaultValue: params.uiMetadata.defaultValue !== undefined ? params.uiMetadata.defaultValue : currentField.uiMetadata.defaultValue,
    autoFill: params.uiMetadata.autoFill !== undefined ? params.uiMetadata.autoFill : currentField.uiMetadata.autoFill,
    display: params.uiMetadata.display !== undefined ? params.uiMetadata.display : currentField.uiMetadata.display,
    placeholder: params.uiMetadata.placeholder !== undefined ? params.uiMetadata.placeholder : currentField.uiMetadata.placeholder,
    color: params.uiMetadata.color !== undefined ? params.uiMetadata.color : currentField.uiMetadata.color,
    documentUrl: params.uiMetadata.documentUrl !== undefined ? params.uiMetadata.documentUrl : currentField.uiMetadata.documentUrl,
    prefix: params.uiMetadata.prefix !== undefined ? params.uiMetadata.prefix : currentField.uiMetadata.prefix,
    suffix: params.uiMetadata.suffix !== undefined ? params.uiMetadata.suffix : currentField.uiMetadata.suffix,
    format: params.uiMetadata.format !== undefined ? params.uiMetadata.format : currentField.uiMetadata.format,
    fieldGroupId: params.uiMetadata.fieldGroupId !== undefined ? params.uiMetadata.fieldGroupId : currentField.uiMetadata.fieldGroupId,
  });

  const updatedField: FieldDefinition = {
    slug: currentField.slug,
    label: currentField.label,
    schema: currentField.schema,
    uiMetadata: mergedUIMetadata,
  };

  const nextFields = prevState.contentItemStructure.fields.map((f, idx) =>
    idx === fieldIndex ? updatedField : f
  );

  const nextContentItemStructure = {
    groups: prevState.contentItemStructure.groups,
    fields: nextFields,
    virtualFields: prevState.contentItemStructure.virtualFields,
    categories: prevState.contentItemStructure.categories,
    version: prevState.contentItemStructure.version,
    createdAt: prevState.contentItemStructure.createdAt,
    updatedAt: params.updatedAt,
  };

  const patch: Partial<ContentModel> = {
    contentItemStructure: nextContentItemStructure,
    updatedAt: params.updatedAt,
  };

  let nextState: ContentModel;
  if (prevState.modelType === 'list') {
    nextState = {
      slug: prevState.slug,
      label: prevState.label,
      description: prevState.description,
      documentUrl: prevState.documentUrl,
      isActive: prevState.isActive,
      enablePublishScheduling: prevState.enablePublishScheduling,
      enableCategories: prevState.enableCategories,
      orderValue: prevState.orderValue,
      modelType: 'list',
      version: prevState.version,
      createdAt: prevState.createdAt,
      updatedAt: params.updatedAt,
      contentItemStructure: nextContentItemStructure,
      contentListViewStructure: prevState.contentListViewStructure,
    };
  } else {
    nextState = {
      slug: prevState.slug,
      label: prevState.label,
      description: prevState.description,
      documentUrl: prevState.documentUrl,
      isActive: prevState.isActive,
      enablePublishScheduling: prevState.enablePublishScheduling,
      orderValue: prevState.orderValue,
      modelType: 'object',
      version: prevState.version,
      createdAt: prevState.createdAt,
      updatedAt: params.updatedAt,
      contentItemStructure: nextContentItemStructure,
    };
  }

  return { nextState, patch };
}

// ========================================
// Group Management Commands
// ========================================

// Assign Group to a Field Command
export interface AssignGroupToFieldParams {
  fieldSlug: FieldSlug;
  groupId: string;
  updatedAt: Date;
}

export interface AssignGroupToFieldResult {
  nextState: ContentModel;
  patch: Partial<ContentModel>;
}

export function assignGroupToField(
  prevState: ContentModel,
  params: AssignGroupToFieldParams
): AssignGroupToFieldResult {
  const fieldIndex = prevState.contentItemStructure.fields.findIndex(
    (f) => f.slug === params.fieldSlug
  );

  if (fieldIndex === -1) {
    throw new FieldNotFoundError(params.fieldSlug);
  }

  const groupExists = prevState.contentItemStructure.groups.some(
    (g) => g.id === params.groupId
  );

  if (!groupExists) {
    throw new GroupNotFoundError(params.groupId);
  }

  const currentField = prevState.contentItemStructure.fields[fieldIndex]!;
  const updatedField: FieldDefinition = {
    slug: currentField.slug,
    label: currentField.label,
    schema: currentField.schema,
    uiMetadata: {
      type: currentField.uiMetadata.type,
      label: currentField.uiMetadata.label,
      maxLength: currentField.uiMetadata.maxLength,
      minLength: currentField.uiMetadata.minLength,
      size: currentField.uiMetadata.size,
      description: currentField.uiMetadata.description,
      required: currentField.uiMetadata.required,
      defaultValue: currentField.uiMetadata.defaultValue,
      autoFill: currentField.uiMetadata.autoFill,
      display: currentField.uiMetadata.display,
      placeholder: currentField.uiMetadata.placeholder,
      color: currentField.uiMetadata.color,
      documentUrl: currentField.uiMetadata.documentUrl,
      prefix: currentField.uiMetadata.prefix,
      suffix: currentField.uiMetadata.suffix,
      format: currentField.uiMetadata.format,
      fieldGroupId: params.groupId as z.infer<typeof FieldGroupId>,
    },
  };

  const nextFields = prevState.contentItemStructure.fields.map((f, idx) =>
    idx === fieldIndex ? updatedField : f
  );

  const nextContentItemStructure = {
    groups: prevState.contentItemStructure.groups,
    fields: nextFields,
    virtualFields: prevState.contentItemStructure.virtualFields,
    categories: prevState.contentItemStructure.categories,
    version: prevState.contentItemStructure.version,
    createdAt: prevState.contentItemStructure.createdAt,
    updatedAt: params.updatedAt,
  };

  const patch: Partial<ContentModel> = {
    contentItemStructure: nextContentItemStructure,
    updatedAt: params.updatedAt,
  };

  let nextState: ContentModel;
  if (prevState.modelType === 'list') {
    nextState = {
      slug: prevState.slug,
      label: prevState.label,
      description: prevState.description,
      documentUrl: prevState.documentUrl,
      isActive: prevState.isActive,
      enablePublishScheduling: prevState.enablePublishScheduling,
      enableCategories: prevState.enableCategories,
      orderValue: prevState.orderValue,
      modelType: 'list',
      version: prevState.version,
      createdAt: prevState.createdAt,
      updatedAt: params.updatedAt,
      contentItemStructure: nextContentItemStructure,
      contentListViewStructure: prevState.contentListViewStructure,
    };
  } else {
    nextState = {
      slug: prevState.slug,
      label: prevState.label,
      description: prevState.description,
      documentUrl: prevState.documentUrl,
      isActive: prevState.isActive,
      enablePublishScheduling: prevState.enablePublishScheduling,
      orderValue: prevState.orderValue,
      modelType: 'object',
      version: prevState.version,
      createdAt: prevState.createdAt,
      updatedAt: params.updatedAt,
      contentItemStructure: nextContentItemStructure,
    };
  }

  return { nextState, patch };
}

// Resign Field from a Group Command
export interface ResignFieldFromGroupParams {
  fieldSlug: FieldSlug;
  updatedAt: Date;
}

export interface ResignFieldFromGroupResult {
  nextState: ContentModel;
  patch: Partial<ContentModel>;
}

export function resignFieldFromGroup(
  prevState: ContentModel,
  params: ResignFieldFromGroupParams
): ResignFieldFromGroupResult {
  const fieldIndex = prevState.contentItemStructure.fields.findIndex(
    (f) => f.slug === params.fieldSlug
  );

  if (fieldIndex === -1) {
    throw new FieldNotFoundError(params.fieldSlug);
  }

  const currentField = prevState.contentItemStructure.fields[fieldIndex]!;
  const updatedField: FieldDefinition = {
    slug: currentField.slug,
    label: currentField.label,
    schema: currentField.schema,
    uiMetadata: {
      type: currentField.uiMetadata.type,
      label: currentField.uiMetadata.label,
      maxLength: currentField.uiMetadata.maxLength,
      minLength: currentField.uiMetadata.minLength,
      size: currentField.uiMetadata.size,
      description: currentField.uiMetadata.description,
      required: currentField.uiMetadata.required,
      defaultValue: currentField.uiMetadata.defaultValue,
      autoFill: currentField.uiMetadata.autoFill,
      display: currentField.uiMetadata.display,
      placeholder: currentField.uiMetadata.placeholder,
      color: currentField.uiMetadata.color,
      documentUrl: currentField.uiMetadata.documentUrl,
      prefix: currentField.uiMetadata.prefix,
      suffix: currentField.uiMetadata.suffix,
      format: currentField.uiMetadata.format,
    },
  };

  const nextFields = prevState.contentItemStructure.fields.map((f, idx) =>
    idx === fieldIndex ? updatedField : f
  );

  const nextContentItemStructure = {
    groups: prevState.contentItemStructure.groups,
    fields: nextFields,
    virtualFields: prevState.contentItemStructure.virtualFields,
    categories: prevState.contentItemStructure.categories,
    version: prevState.contentItemStructure.version,
    createdAt: prevState.contentItemStructure.createdAt,
    updatedAt: params.updatedAt,
  };

  const patch: Partial<ContentModel> = {
    contentItemStructure: nextContentItemStructure,
    updatedAt: params.updatedAt,
  };

  let nextState: ContentModel;
  if (prevState.modelType === 'list') {
    nextState = {
      slug: prevState.slug,
      label: prevState.label,
      description: prevState.description,
      documentUrl: prevState.documentUrl,
      isActive: prevState.isActive,
      enablePublishScheduling: prevState.enablePublishScheduling,
      enableCategories: prevState.enableCategories,
      orderValue: prevState.orderValue,
      modelType: 'list',
      version: prevState.version,
      createdAt: prevState.createdAt,
      updatedAt: params.updatedAt,
      contentItemStructure: nextContentItemStructure,
      contentListViewStructure: prevState.contentListViewStructure,
    };
  } else {
    nextState = {
      slug: prevState.slug,
      label: prevState.label,
      description: prevState.description,
      documentUrl: prevState.documentUrl,
      isActive: prevState.isActive,
      enablePublishScheduling: prevState.enablePublishScheduling,
      orderValue: prevState.orderValue,
      modelType: 'object',
      version: prevState.version,
      createdAt: prevState.createdAt,
      updatedAt: params.updatedAt,
      contentItemStructure: nextContentItemStructure,
    };
  }

  return { nextState, patch };
}

// Add a Group Command
export interface AddGroupParams {
  group: Group;
  updatedAt: Date;
}

export interface AddGroupResult {
  nextState: ContentModel;
  patch: Partial<ContentModel>;
}

export function addGroup(
  prevState: ContentModel,
  params: AddGroupParams
): AddGroupResult {
  const validatedGroup = GroupSchema.parse(params.group);

  const groupExists = prevState.contentItemStructure.groups.some(
    (g) => g.id === validatedGroup.id
  );

  if (groupExists) {
    throw new GroupAlreadyExistsError(validatedGroup.id);
  }

  const nextGroups = [...prevState.contentItemStructure.groups, validatedGroup];

  const nextContentItemStructure = {
    groups: nextGroups,
    fields: prevState.contentItemStructure.fields,
    virtualFields: prevState.contentItemStructure.virtualFields,
    categories: prevState.contentItemStructure.categories,
    version: prevState.contentItemStructure.version,
    createdAt: prevState.contentItemStructure.createdAt,
    updatedAt: params.updatedAt,
  };

  const patch: Partial<ContentModel> = {
    contentItemStructure: nextContentItemStructure,
    updatedAt: params.updatedAt,
  };

  let nextState: ContentModel;
  if (prevState.modelType === 'list') {
    nextState = {
      slug: prevState.slug,
      label: prevState.label,
      description: prevState.description,
      documentUrl: prevState.documentUrl,
      isActive: prevState.isActive,
      enablePublishScheduling: prevState.enablePublishScheduling,
      enableCategories: prevState.enableCategories,
      orderValue: prevState.orderValue,
      modelType: 'list',
      version: prevState.version,
      createdAt: prevState.createdAt,
      updatedAt: params.updatedAt,
      contentItemStructure: nextContentItemStructure,
      contentListViewStructure: prevState.contentListViewStructure,
    };
  } else {
    nextState = {
      slug: prevState.slug,
      label: prevState.label,
      description: prevState.description,
      documentUrl: prevState.documentUrl,
      isActive: prevState.isActive,
      enablePublishScheduling: prevState.enablePublishScheduling,
      orderValue: prevState.orderValue,
      modelType: 'object',
      version: prevState.version,
      createdAt: prevState.createdAt,
      updatedAt: params.updatedAt,
      contentItemStructure: nextContentItemStructure,
    };
  }

  return { nextState, patch };
}

// Remove a Group Command
export interface RemoveGroupParams {
  groupId: string;
  updatedAt: Date;
}

export interface RemoveGroupResult {
  nextState: ContentModel;
  patch: Partial<ContentModel>;
}

export function removeGroup(
  prevState: ContentModel,
  params: RemoveGroupParams
): RemoveGroupResult {
  const groupIndex = prevState.contentItemStructure.groups.findIndex(
    (g) => g.id === params.groupId
  );

  if (groupIndex === -1) {
    throw new GroupNotFoundError(params.groupId);
  }

  const nextGroups = prevState.contentItemStructure.groups.filter(
    (g) => g.id !== params.groupId
  );

  const nextFields = prevState.contentItemStructure.fields.map((field) => {
    if (field.uiMetadata.fieldGroupId === params.groupId) {
      return {
        slug: field.slug,
        label: field.label,
        schema: field.schema,
        uiMetadata: {
          type: field.uiMetadata.type,
          label: field.uiMetadata.label,
          maxLength: field.uiMetadata.maxLength,
          minLength: field.uiMetadata.minLength,
          size: field.uiMetadata.size,
          description: field.uiMetadata.description,
          required: field.uiMetadata.required,
          defaultValue: field.uiMetadata.defaultValue,
          autoFill: field.uiMetadata.autoFill,
          display: field.uiMetadata.display,
          placeholder: field.uiMetadata.placeholder,
          color: field.uiMetadata.color,
          documentUrl: field.uiMetadata.documentUrl,
          prefix: field.uiMetadata.prefix,
          suffix: field.uiMetadata.suffix,
          format: field.uiMetadata.format,
        },
      };
    }
    return field;
  });

  const nextContentItemStructure = {
    groups: nextGroups,
    fields: nextFields,
    virtualFields: prevState.contentItemStructure.virtualFields,
    categories: prevState.contentItemStructure.categories,
    version: prevState.contentItemStructure.version,
    createdAt: prevState.contentItemStructure.createdAt,
    updatedAt: params.updatedAt,
  };

  const patch: Partial<ContentModel> = {
    contentItemStructure: nextContentItemStructure,
    updatedAt: params.updatedAt,
  };

  let nextState: ContentModel;
  if (prevState.modelType === 'list') {
    nextState = {
      slug: prevState.slug,
      label: prevState.label,
      description: prevState.description,
      documentUrl: prevState.documentUrl,
      isActive: prevState.isActive,
      enablePublishScheduling: prevState.enablePublishScheduling,
      enableCategories: prevState.enableCategories,
      orderValue: prevState.orderValue,
      modelType: 'list',
      version: prevState.version,
      createdAt: prevState.createdAt,
      updatedAt: params.updatedAt,
      contentItemStructure: nextContentItemStructure,
      contentListViewStructure: prevState.contentListViewStructure,
    };
  } else {
    nextState = {
      slug: prevState.slug,
      label: prevState.label,
      description: prevState.description,
      documentUrl: prevState.documentUrl,
      isActive: prevState.isActive,
      enablePublishScheduling: prevState.enablePublishScheduling,
      orderValue: prevState.orderValue,
      modelType: 'object',
      version: prevState.version,
      createdAt: prevState.createdAt,
      updatedAt: params.updatedAt,
      contentItemStructure: nextContentItemStructure,
    };
  }

  return { nextState, patch };
}

// Update Group Properties Command
export interface UpdateGroupPropertiesParams {
  groupId: string;
  label?: string;
  description?: string;
  documentUrl?: string;
  updatedAt: Date;
}

export interface UpdateGroupPropertiesResult {
  nextState: ContentModel;
  patch: Partial<ContentModel>;
}

export function updateGroupProperties(
  prevState: ContentModel,
  params: UpdateGroupPropertiesParams
): UpdateGroupPropertiesResult {
  const groupIndex = prevState.contentItemStructure.groups.findIndex(
    (g) => g.id === params.groupId
  );

  if (groupIndex === -1) {
    throw new GroupNotFoundError(params.groupId);
  }

  const currentGroup = prevState.contentItemStructure.groups[groupIndex]!;
  const updatedGroup: Group = {
    id: currentGroup.id,
    label: params.label !== undefined ? params.label : currentGroup.label,
    description: params.description !== undefined ? params.description : currentGroup.description,
    documentUrl: params.documentUrl !== undefined ? params.documentUrl : currentGroup.documentUrl,
  };

  const nextGroups = prevState.contentItemStructure.groups.map((g, idx) =>
    idx === groupIndex ? updatedGroup : g
  );

  const nextContentItemStructure = {
    groups: nextGroups,
    fields: prevState.contentItemStructure.fields,
    virtualFields: prevState.contentItemStructure.virtualFields,
    categories: prevState.contentItemStructure.categories,
    version: prevState.contentItemStructure.version,
    createdAt: prevState.contentItemStructure.createdAt,
    updatedAt: params.updatedAt,
  };

  const patch: Partial<ContentModel> = {
    contentItemStructure: nextContentItemStructure,
    updatedAt: params.updatedAt,
  };

  let nextState: ContentModel;
  if (prevState.modelType === 'list') {
    nextState = {
      slug: prevState.slug,
      label: prevState.label,
      description: prevState.description,
      documentUrl: prevState.documentUrl,
      isActive: prevState.isActive,
      enablePublishScheduling: prevState.enablePublishScheduling,
      enableCategories: prevState.enableCategories,
      orderValue: prevState.orderValue,
      modelType: 'list',
      version: prevState.version,
      createdAt: prevState.createdAt,
      updatedAt: params.updatedAt,
      contentItemStructure: nextContentItemStructure,
      contentListViewStructure: prevState.contentListViewStructure,
    };
  } else {
    nextState = {
      slug: prevState.slug,
      label: prevState.label,
      description: prevState.description,
      documentUrl: prevState.documentUrl,
      isActive: prevState.isActive,
      enablePublishScheduling: prevState.enablePublishScheduling,
      orderValue: prevState.orderValue,
      modelType: 'object',
      version: prevState.version,
      createdAt: prevState.createdAt,
      updatedAt: params.updatedAt,
      contentItemStructure: nextContentItemStructure,
    };
  }

  return { nextState, patch };
}

// Change Order of Groups Command
export interface ChangeGroupOrderParams {
  orderedGroupIds: string[];
  updatedAt: Date;
}

export interface ChangeGroupOrderResult {
  nextState: ContentModel;
  patch: Partial<ContentModel>;
}

export function changeGroupOrder(
  prevState: ContentModel,
  params: ChangeGroupOrderParams
): ChangeGroupOrderResult {
  const currentGroupIds = new Set(prevState.contentItemStructure.groups.map(g => g.id));
  const orderedGroupIdsSet = new Set(params.orderedGroupIds);

  if (currentGroupIds.size !== orderedGroupIdsSet.size) {
    throw new Error('Group count mismatch: orderedGroupIds must contain all existing groups.');
  }

  for (const id of params.orderedGroupIds) {
    if (!currentGroupIds.has(id as z.infer<typeof FieldGroupId>)) {
      throw new GroupNotFoundError(id);
    }
  }

  const groupMap = new Map(prevState.contentItemStructure.groups.map(g => [g.id, g]));
  const nextGroups = params.orderedGroupIds.map(id => groupMap.get(id as z.infer<typeof FieldGroupId>)!);

  const nextContentItemStructure = {
    groups: nextGroups,
    fields: prevState.contentItemStructure.fields,
    virtualFields: prevState.contentItemStructure.virtualFields,
    categories: prevState.contentItemStructure.categories,
    version: prevState.contentItemStructure.version,
    createdAt: prevState.contentItemStructure.createdAt,
    updatedAt: params.updatedAt,
  };

  const patch: Partial<ContentModel> = {
    contentItemStructure: nextContentItemStructure,
    updatedAt: params.updatedAt,
  };

  let nextState: ContentModel;
  if (prevState.modelType === 'list') {
    nextState = {
      slug: prevState.slug,
      label: prevState.label,
      description: prevState.description,
      documentUrl: prevState.documentUrl,
      isActive: prevState.isActive,
      enablePublishScheduling: prevState.enablePublishScheduling,
      enableCategories: prevState.enableCategories,
      orderValue: prevState.orderValue,
      modelType: 'list',
      version: prevState.version,
      createdAt: prevState.createdAt,
      updatedAt: params.updatedAt,
      contentItemStructure: nextContentItemStructure,
      contentListViewStructure: prevState.contentListViewStructure,
    };
  } else {
    nextState = {
      slug: prevState.slug,
      label: prevState.label,
      description: prevState.description,
      documentUrl: prevState.documentUrl,
      isActive: prevState.isActive,
      enablePublishScheduling: prevState.enablePublishScheduling,
      orderValue: prevState.orderValue,
      modelType: 'object',
      version: prevState.version,
      createdAt: prevState.createdAt,
      updatedAt: params.updatedAt,
      contentItemStructure: nextContentItemStructure,
    };
  }

  return { nextState, patch };
}

// ========================================
// Category Management Commands
// ========================================

// Add Category Command
export interface AddCategoryParams {
  category: CategoryDefinition;
  updatedAt: Date;
}

export interface AddCategoryResult {
  nextState: ContentModel;
  patch: Partial<ContentModel>;
}

export function addCategory(
  prevState: ContentModel,
  params: AddCategoryParams
): AddCategoryResult {
  const validatedCategory = CategoryDefinitionSchema.parse(params.category);

  const categoryExists = prevState.contentItemStructure.categories.some(
    (c) => c.slug === validatedCategory.slug
  );

  if (categoryExists) {
    throw new CategoryAlreadyExistsError(validatedCategory.slug);
  }

  const nextCategories = [...prevState.contentItemStructure.categories, validatedCategory];

  const nextContentItemStructure = {
    groups: prevState.contentItemStructure.groups,
    fields: prevState.contentItemStructure.fields,
    virtualFields: prevState.contentItemStructure.virtualFields,
    categories: nextCategories,
    version: prevState.contentItemStructure.version,
    createdAt: prevState.contentItemStructure.createdAt,
    updatedAt: params.updatedAt,
  };

  const patch: Partial<ContentModel> = {
    contentItemStructure: nextContentItemStructure,
    updatedAt: params.updatedAt,
  };

  let nextState: ContentModel;
  if (prevState.modelType === 'list') {
    nextState = {
      slug: prevState.slug,
      label: prevState.label,
      description: prevState.description,
      documentUrl: prevState.documentUrl,
      isActive: prevState.isActive,
      enablePublishScheduling: prevState.enablePublishScheduling,
      enableCategories: prevState.enableCategories,
      orderValue: prevState.orderValue,
      modelType: 'list',
      version: prevState.version,
      createdAt: prevState.createdAt,
      updatedAt: params.updatedAt,
      contentItemStructure: nextContentItemStructure,
      contentListViewStructure: prevState.contentListViewStructure,
    };
  } else {
    nextState = {
      slug: prevState.slug,
      label: prevState.label,
      description: prevState.description,
      documentUrl: prevState.documentUrl,
      isActive: prevState.isActive,
      enablePublishScheduling: prevState.enablePublishScheduling,
      orderValue: prevState.orderValue,
      modelType: 'object',
      version: prevState.version,
      createdAt: prevState.createdAt,
      updatedAt: params.updatedAt,
      contentItemStructure: nextContentItemStructure,
    };
  }

  return { nextState, patch };
}

// Remove Category Command
export interface RemoveCategoryParams {
  categorySlug: CategorySlug;
  updatedAt: Date;
}

export interface RemoveCategoryResult {
  nextState: ContentModel;
  patch: Partial<ContentModel>;
}

export function removeCategory(
  prevState: ContentModel,
  params: RemoveCategoryParams
): RemoveCategoryResult {
  const categoryIndex = prevState.contentItemStructure.categories.findIndex(
    (c) => c.slug === params.categorySlug
  );

  if (categoryIndex === -1) {
    throw new CategoryNotFoundError(params.categorySlug);
  }

  const nextCategories = prevState.contentItemStructure.categories.filter(
    (c) => c.slug !== params.categorySlug
  );

  const nextContentItemStructure = {
    groups: prevState.contentItemStructure.groups,
    fields: prevState.contentItemStructure.fields,
    virtualFields: prevState.contentItemStructure.virtualFields,
    categories: nextCategories,
    version: prevState.contentItemStructure.version,
    createdAt: prevState.contentItemStructure.createdAt,
    updatedAt: params.updatedAt,
  };

  const patch: Partial<ContentModel> = {
    contentItemStructure: nextContentItemStructure,
    updatedAt: params.updatedAt,
  };

  let nextState: ContentModel;
  if (prevState.modelType === 'list') {
    nextState = {
      slug: prevState.slug,
      label: prevState.label,
      description: prevState.description,
      documentUrl: prevState.documentUrl,
      isActive: prevState.isActive,
      enablePublishScheduling: prevState.enablePublishScheduling,
      enableCategories: prevState.enableCategories,
      orderValue: prevState.orderValue,
      modelType: 'list',
      version: prevState.version,
      createdAt: prevState.createdAt,
      updatedAt: params.updatedAt,
      contentItemStructure: nextContentItemStructure,
      contentListViewStructure: prevState.contentListViewStructure,
    };
  } else {
    nextState = {
      slug: prevState.slug,
      label: prevState.label,
      description: prevState.description,
      documentUrl: prevState.documentUrl,
      isActive: prevState.isActive,
      enablePublishScheduling: prevState.enablePublishScheduling,
      orderValue: prevState.orderValue,
      modelType: 'object',
      version: prevState.version,
      createdAt: prevState.createdAt,
      updatedAt: params.updatedAt,
      contentItemStructure: nextContentItemStructure,
    };
  }

  return { nextState, patch };
}

// Update Category Command
export interface UpdateCategoryParams {
  categorySlug: CategorySlug;
  label?: string;
  updatedAt: Date;
}

export interface UpdateCategoryResult {
  nextState: ContentModel;
  patch: Partial<ContentModel>;
}

export function updateCategory(
  prevState: ContentModel,
  params: UpdateCategoryParams
): UpdateCategoryResult {
  const categoryIndex = prevState.contentItemStructure.categories.findIndex(
    (c) => c.slug === params.categorySlug
  );

  if (categoryIndex === -1) {
    throw new CategoryNotFoundError(params.categorySlug);
  }

  const currentCategory = prevState.contentItemStructure.categories[categoryIndex]!;
  const updatedCategory: CategoryDefinition = {
    slug: currentCategory.slug,
    label: params.label !== undefined ? params.label : currentCategory.label,
  };

  const nextCategories = prevState.contentItemStructure.categories.map((c, idx) =>
    idx === categoryIndex ? updatedCategory : c
  );

  const nextContentItemStructure = {
    groups: prevState.contentItemStructure.groups,
    fields: prevState.contentItemStructure.fields,
    virtualFields: prevState.contentItemStructure.virtualFields,
    categories: nextCategories,
    version: prevState.contentItemStructure.version,
    createdAt: prevState.contentItemStructure.createdAt,
    updatedAt: params.updatedAt,
  };

  const patch: Partial<ContentModel> = {
    contentItemStructure: nextContentItemStructure,
    updatedAt: params.updatedAt,
  };

  let nextState: ContentModel;
  if (prevState.modelType === 'list') {
    nextState = {
      slug: prevState.slug,
      label: prevState.label,
      description: prevState.description,
      documentUrl: prevState.documentUrl,
      isActive: prevState.isActive,
      enablePublishScheduling: prevState.enablePublishScheduling,
      enableCategories: prevState.enableCategories,
      orderValue: prevState.orderValue,
      modelType: 'list',
      version: prevState.version,
      createdAt: prevState.createdAt,
      updatedAt: params.updatedAt,
      contentItemStructure: nextContentItemStructure,
      contentListViewStructure: prevState.contentListViewStructure,
    };
  } else {
    nextState = {
      slug: prevState.slug,
      label: prevState.label,
      description: prevState.description,
      documentUrl: prevState.documentUrl,
      isActive: prevState.isActive,
      enablePublishScheduling: prevState.enablePublishScheduling,
      orderValue: prevState.orderValue,
      modelType: 'object',
      version: prevState.version,
      createdAt: prevState.createdAt,
      updatedAt: params.updatedAt,
      contentItemStructure: nextContentItemStructure,
    };
  }

  return { nextState, patch };
}

// ========================================
// Virtual Field Management Commands
// ========================================

// Add Virtual Field Command
export interface AddVirtualFieldParams {
  virtualField: z.infer<typeof VirtualFieldSchema>;
  updatedAt: Date;
}

export interface AddVirtualFieldResult {
  nextState: ContentModel;
  patch: Partial<ContentModel>;
}

export function addVirtualField(
  prevState: ContentModel,
  params: AddVirtualFieldParams
): AddVirtualFieldResult {
  const validatedVirtualField = VirtualFieldSchema.parse(params.virtualField);

  const virtualFieldExists = prevState.contentItemStructure.virtualFields.some(
    (vf) => vf.slug === validatedVirtualField.slug
  );

  if (virtualFieldExists) {
    throw new VirtualFieldAlreadyExistsError(validatedVirtualField.slug);
  }

  const nextVirtualFields = [...prevState.contentItemStructure.virtualFields, validatedVirtualField];

  const nextContentItemStructure = {
    groups: prevState.contentItemStructure.groups,
    fields: prevState.contentItemStructure.fields,
    virtualFields: nextVirtualFields,
    categories: prevState.contentItemStructure.categories,
    version: prevState.contentItemStructure.version,
    createdAt: prevState.contentItemStructure.createdAt,
    updatedAt: params.updatedAt,
  };

  const patch: Partial<ContentModel> = {
    contentItemStructure: nextContentItemStructure,
    updatedAt: params.updatedAt,
  };

  let nextState: ContentModel;
  if (prevState.modelType === 'list') {
    nextState = {
      slug: prevState.slug,
      label: prevState.label,
      description: prevState.description,
      documentUrl: prevState.documentUrl,
      isActive: prevState.isActive,
      enablePublishScheduling: prevState.enablePublishScheduling,
      enableCategories: prevState.enableCategories,
      orderValue: prevState.orderValue,
      modelType: 'list',
      version: prevState.version,
      createdAt: prevState.createdAt,
      updatedAt: params.updatedAt,
      contentItemStructure: nextContentItemStructure,
      contentListViewStructure: prevState.contentListViewStructure,
    };
  } else {
    nextState = {
      slug: prevState.slug,
      label: prevState.label,
      description: prevState.description,
      documentUrl: prevState.documentUrl,
      isActive: prevState.isActive,
      enablePublishScheduling: prevState.enablePublishScheduling,
      orderValue: prevState.orderValue,
      modelType: 'object',
      version: prevState.version,
      createdAt: prevState.createdAt,
      updatedAt: params.updatedAt,
      contentItemStructure: nextContentItemStructure,
    };
  }

  return { nextState, patch };
}

// Remove Virtual Field Command
export interface RemoveVirtualFieldParams {
  virtualFieldSlug: FieldSlug;
  updatedAt: Date;
}

export interface RemoveVirtualFieldResult {
  nextState: ContentModel;
  patch: Partial<ContentModel>;
}

export function removeVirtualField(
  prevState: ContentModel,
  params: RemoveVirtualFieldParams
): RemoveVirtualFieldResult {
  const virtualFieldIndex = prevState.contentItemStructure.virtualFields.findIndex(
    (vf) => vf.slug === params.virtualFieldSlug
  );

  if (virtualFieldIndex === -1) {
    throw new VirtualFieldNotFoundError(params.virtualFieldSlug);
  }

  const nextVirtualFields = prevState.contentItemStructure.virtualFields.filter(
    (vf) => vf.slug !== params.virtualFieldSlug
  );

  const nextContentItemStructure = {
    groups: prevState.contentItemStructure.groups,
    fields: prevState.contentItemStructure.fields,
    virtualFields: nextVirtualFields,
    categories: prevState.contentItemStructure.categories,
    version: prevState.contentItemStructure.version,
    createdAt: prevState.contentItemStructure.createdAt,
    updatedAt: params.updatedAt,
  };

  const patch: Partial<ContentModel> = {
    contentItemStructure: nextContentItemStructure,
    updatedAt: params.updatedAt,
  };

  let nextState: ContentModel;
  if (prevState.modelType === 'list') {
    nextState = {
      slug: prevState.slug,
      label: prevState.label,
      description: prevState.description,
      documentUrl: prevState.documentUrl,
      isActive: prevState.isActive,
      enablePublishScheduling: prevState.enablePublishScheduling,
      enableCategories: prevState.enableCategories,
      orderValue: prevState.orderValue,
      modelType: 'list',
      version: prevState.version,
      createdAt: prevState.createdAt,
      updatedAt: params.updatedAt,
      contentItemStructure: nextContentItemStructure,
      contentListViewStructure: prevState.contentListViewStructure,
    };
  } else {
    nextState = {
      slug: prevState.slug,
      label: prevState.label,
      description: prevState.description,
      documentUrl: prevState.documentUrl,
      isActive: prevState.isActive,
      enablePublishScheduling: prevState.enablePublishScheduling,
      orderValue: prevState.orderValue,
      modelType: 'object',
      version: prevState.version,
      createdAt: prevState.createdAt,
      updatedAt: params.updatedAt,
      contentItemStructure: nextContentItemStructure,
    };
  }

  return { nextState, patch };
}

// Update Virtual Field Command
export interface UpdateVirtualFieldParams {
  virtualFieldSlug: FieldSlug;
  label?: string;
  expression?: z.infer<typeof VirtualFieldSchema>['expression'];
  updatedAt: Date;
}

export interface UpdateVirtualFieldResult {
  nextState: ContentModel;
  patch: Partial<ContentModel>;
}

export function updateVirtualField(
  prevState: ContentModel,
  params: UpdateVirtualFieldParams
): UpdateVirtualFieldResult {
  const virtualFieldIndex = prevState.contentItemStructure.virtualFields.findIndex(
    (vf) => vf.slug === params.virtualFieldSlug
  );

  if (virtualFieldIndex === -1) {
    throw new VirtualFieldNotFoundError(params.virtualFieldSlug);
  }

  const currentVirtualField = prevState.contentItemStructure.virtualFields[virtualFieldIndex]!;
  const updatedVirtualField = VirtualFieldSchema.parse({
    slug: currentVirtualField.slug,
    label: params.label !== undefined ? params.label : currentVirtualField.label,
    expression: params.expression !== undefined ? params.expression : currentVirtualField.expression,
  });

  const nextVirtualFields = prevState.contentItemStructure.virtualFields.map((vf, idx) =>
    idx === virtualFieldIndex ? updatedVirtualField : vf
  );

  const nextContentItemStructure = {
    groups: prevState.contentItemStructure.groups,
    fields: prevState.contentItemStructure.fields,
    virtualFields: nextVirtualFields,
    categories: prevState.contentItemStructure.categories,
    version: prevState.contentItemStructure.version,
    createdAt: prevState.contentItemStructure.createdAt,
    updatedAt: params.updatedAt,
  };

  const patch: Partial<ContentModel> = {
    contentItemStructure: nextContentItemStructure,
    updatedAt: params.updatedAt,
  };

  let nextState: ContentModel;
  if (prevState.modelType === 'list') {
    nextState = {
      slug: prevState.slug,
      label: prevState.label,
      description: prevState.description,
      documentUrl: prevState.documentUrl,
      isActive: prevState.isActive,
      enablePublishScheduling: prevState.enablePublishScheduling,
      enableCategories: prevState.enableCategories,
      orderValue: prevState.orderValue,
      modelType: 'list',
      version: prevState.version,
      createdAt: prevState.createdAt,
      updatedAt: params.updatedAt,
      contentItemStructure: nextContentItemStructure,
      contentListViewStructure: prevState.contentListViewStructure,
    };
  } else {
    nextState = {
      slug: prevState.slug,
      label: prevState.label,
      description: prevState.description,
      documentUrl: prevState.documentUrl,
      isActive: prevState.isActive,
      enablePublishScheduling: prevState.enablePublishScheduling,
      orderValue: prevState.orderValue,
      modelType: 'object',
      version: prevState.version,
      createdAt: prevState.createdAt,
      updatedAt: params.updatedAt,
      contentItemStructure: nextContentItemStructure,
    };
  }

  return { nextState, patch };
}

// ========================================
// Content List View Commands
// ========================================

// Add Content List View Command
export interface AddContentListViewParams {
  view: ContentListViewStructure;
  updatedAt: Date;
}

export interface AddContentListViewResult {
  nextState: ListContentModel;
  patch: Partial<ListContentModel>;
}

export function addContentListView(
  prevState: ContentModel,
  params: AddContentListViewParams
): AddContentListViewResult {
  if (prevState.modelType !== 'list') {
    throw new InvalidModelTypeError('addContentListView', prevState.modelType);
  }

  const validatedView = ContentListViewStructureSchema.parse(params.view);

  const viewExists = prevState.contentListViewStructure.some(
    (v) => v.slug === validatedView.slug
  );

  if (viewExists) {
    throw new ContentListViewAlreadyExistsError(validatedView.slug);
  }

  const nextViews = [...prevState.contentListViewStructure, validatedView];

  const patch: Partial<ListContentModel> = {
    contentListViewStructure: nextViews,
    updatedAt: params.updatedAt,
  };

  const nextState: ListContentModel = {
    slug: prevState.slug,
    label: prevState.label,
    description: prevState.description,
    documentUrl: prevState.documentUrl,
    isActive: prevState.isActive,
    enablePublishScheduling: prevState.enablePublishScheduling,
    enableCategories: prevState.enableCategories,
    orderValue: prevState.orderValue,
    modelType: 'list',
    version: prevState.version,
    createdAt: prevState.createdAt,
    updatedAt: params.updatedAt,
    contentItemStructure: prevState.contentItemStructure,
    contentListViewStructure: nextViews,
  };

  return { nextState, patch };
}

// Remove Content List View Command
export interface RemoveContentListViewParams {
  viewSlug: ContentListViewSlug;
  updatedAt: Date;
}

export interface RemoveContentListViewResult {
  nextState: ListContentModel;
  patch: Partial<ListContentModel>;
}

export function removeContentListView(
  prevState: ContentModel,
  params: RemoveContentListViewParams
): RemoveContentListViewResult {
  if (prevState.modelType !== 'list') {
    throw new InvalidModelTypeError('removeContentListView', prevState.modelType);
  }

  const viewIndex = prevState.contentListViewStructure.findIndex(
    (v) => v.slug === params.viewSlug
  );

  if (viewIndex === -1) {
    throw new ContentListViewNotFoundError(params.viewSlug);
  }

  const nextViews = prevState.contentListViewStructure.filter(
    (v) => v.slug !== params.viewSlug
  );

  const patch: Partial<ListContentModel> = {
    contentListViewStructure: nextViews,
    updatedAt: params.updatedAt,
  };

  const nextState: ListContentModel = {
    slug: prevState.slug,
    label: prevState.label,
    description: prevState.description,
    documentUrl: prevState.documentUrl,
    isActive: prevState.isActive,
    enablePublishScheduling: prevState.enablePublishScheduling,
    enableCategories: prevState.enableCategories,
    orderValue: prevState.orderValue,
    modelType: 'list',
    version: prevState.version,
    createdAt: prevState.createdAt,
    updatedAt: params.updatedAt,
    contentItemStructure: prevState.contentItemStructure,
    contentListViewStructure: nextViews,
  };

  return { nextState, patch };
}

// Update Content List View Command
export interface UpdateContentListViewParams {
  viewSlug: ContentListViewSlug;
  name?: string;
  description?: string;
  isActive?: boolean;
  updatedAt: Date;
}

export interface UpdateContentListViewResult {
  nextState: ListContentModel;
  patch: Partial<ListContentModel>;
}

export function updateContentListView(
  prevState: ContentModel,
  params: UpdateContentListViewParams
): UpdateContentListViewResult {
  if (prevState.modelType !== 'list') {
    throw new InvalidModelTypeError('updateContentListView', prevState.modelType);
  }

  const viewIndex = prevState.contentListViewStructure.findIndex(
    (v) => v.slug === params.viewSlug
  );

  if (viewIndex === -1) {
    throw new ContentListViewNotFoundError(params.viewSlug);
  }

  const currentView = prevState.contentListViewStructure[viewIndex]!;
  const updatedView: ContentListViewStructure = {
    slug: currentView.slug,
    name: params.name !== undefined ? params.name : currentView.name,
    description: params.description !== undefined ? params.description : currentView.description,
    fields: currentView.fields,
    sortFields: currentView.sortFields,
    filterRules: currentView.filterRules,
    groupByFields: currentView.groupByFields,
    pagination: currentView.pagination,
    isActive: params.isActive !== undefined ? params.isActive : currentView.isActive,
    createdAt: currentView.createdAt,
    updatedAt: params.updatedAt,
  };

  const nextViews = prevState.contentListViewStructure.map((v, idx) =>
    idx === viewIndex ? updatedView : v
  );

  const patch: Partial<ListContentModel> = {
    contentListViewStructure: nextViews,
    updatedAt: params.updatedAt,
  };

  const nextState: ListContentModel = {
    slug: prevState.slug,
    label: prevState.label,
    description: prevState.description,
    documentUrl: prevState.documentUrl,
    isActive: prevState.isActive,
    enablePublishScheduling: prevState.enablePublishScheduling,
    enableCategories: prevState.enableCategories,
    orderValue: prevState.orderValue,
    modelType: 'list',
    version: prevState.version,
    createdAt: prevState.createdAt,
    updatedAt: params.updatedAt,
    contentItemStructure: prevState.contentItemStructure,
    contentListViewStructure: nextViews,
  };

  return { nextState, patch };
}

// Update Sort Fields Command
export interface UpdateSortFieldsParams {
  viewSlug: ContentListViewSlug;
  sortFields: SortField[];
  updatedAt: Date;
}

export interface UpdateSortFieldsResult {
  nextState: ListContentModel;
  patch: Partial<ListContentModel>;
}

export function updateSortFields(
  prevState: ContentModel,
  params: UpdateSortFieldsParams
): UpdateSortFieldsResult {
  if (prevState.modelType !== 'list') {
    throw new InvalidModelTypeError('updateSortFields', prevState.modelType);
  }

  const viewIndex = prevState.contentListViewStructure.findIndex(
    (v) => v.slug === params.viewSlug
  );

  if (viewIndex === -1) {
    throw new ContentListViewNotFoundError(params.viewSlug);
  }

  const currentView = prevState.contentListViewStructure[viewIndex]!;
  const updatedView: ContentListViewStructure = {
    slug: currentView.slug,
    name: currentView.name,
    description: currentView.description,
    fields: currentView.fields,
    sortFields: params.sortFields,
    filterRules: currentView.filterRules,
    groupByFields: currentView.groupByFields,
    pagination: currentView.pagination,
    isActive: currentView.isActive,
    createdAt: currentView.createdAt,
    updatedAt: params.updatedAt,
  };

  const nextViews = prevState.contentListViewStructure.map((v, idx) =>
    idx === viewIndex ? updatedView : v
  );

  const patch: Partial<ListContentModel> = {
    contentListViewStructure: nextViews,
    updatedAt: params.updatedAt,
  };

  const nextState: ListContentModel = {
    slug: prevState.slug,
    label: prevState.label,
    description: prevState.description,
    documentUrl: prevState.documentUrl,
    isActive: prevState.isActive,
    enablePublishScheduling: prevState.enablePublishScheduling,
    enableCategories: prevState.enableCategories,
    orderValue: prevState.orderValue,
    modelType: 'list',
    version: prevState.version,
    createdAt: prevState.createdAt,
    updatedAt: params.updatedAt,
    contentItemStructure: prevState.contentItemStructure,
    contentListViewStructure: nextViews,
  };

  return { nextState, patch };
}

// Update Filter Rules Command
export interface UpdateFilterRulesParams {
  viewSlug: ContentListViewSlug;
  filterRules: FilterRule[];
  updatedAt: Date;
}

export interface UpdateFilterRulesResult {
  nextState: ListContentModel;
  patch: Partial<ListContentModel>;
}

export function updateFilterRules(
  prevState: ContentModel,
  params: UpdateFilterRulesParams
): UpdateFilterRulesResult {
  if (prevState.modelType !== 'list') {
    throw new InvalidModelTypeError('updateFilterRules', prevState.modelType);
  }

  const viewIndex = prevState.contentListViewStructure.findIndex(
    (v) => v.slug === params.viewSlug
  );

  if (viewIndex === -1) {
    throw new ContentListViewNotFoundError(params.viewSlug);
  }

  const currentView = prevState.contentListViewStructure[viewIndex]!;
  const updatedView: ContentListViewStructure = {
    slug: currentView.slug,
    name: currentView.name,
    description: currentView.description,
    fields: currentView.fields,
    sortFields: currentView.sortFields,
    filterRules: params.filterRules,
    groupByFields: currentView.groupByFields,
    pagination: currentView.pagination,
    isActive: currentView.isActive,
    createdAt: currentView.createdAt,
    updatedAt: params.updatedAt,
  };

  const nextViews = prevState.contentListViewStructure.map((v, idx) =>
    idx === viewIndex ? updatedView : v
  );

  const patch: Partial<ListContentModel> = {
    contentListViewStructure: nextViews,
    updatedAt: params.updatedAt,
  };

  const nextState: ListContentModel = {
    slug: prevState.slug,
    label: prevState.label,
    description: prevState.description,
    documentUrl: prevState.documentUrl,
    isActive: prevState.isActive,
    enablePublishScheduling: prevState.enablePublishScheduling,
    enableCategories: prevState.enableCategories,
    orderValue: prevState.orderValue,
    modelType: 'list',
    version: prevState.version,
    createdAt: prevState.createdAt,
    updatedAt: params.updatedAt,
    contentItemStructure: prevState.contentItemStructure,
    contentListViewStructure: nextViews,
  };

  return { nextState, patch };
}

// Update Pagination Config Command
export interface UpdatePaginationConfigParams {
  viewSlug: ContentListViewSlug;
  paginationConfig: PaginationConfig;
  updatedAt: Date;
}

export interface UpdatePaginationConfigResult {
  nextState: ListContentModel;
  patch: Partial<ListContentModel>;
}

export function updatePaginationConfig(
  prevState: ContentModel,
  params: UpdatePaginationConfigParams
): UpdatePaginationConfigResult {
  if (prevState.modelType !== 'list') {
    throw new InvalidModelTypeError('updatePaginationConfig', prevState.modelType);
  }

  const viewIndex = prevState.contentListViewStructure.findIndex(
    (v) => v.slug === params.viewSlug
  );

  if (viewIndex === -1) {
    throw new ContentListViewNotFoundError(params.viewSlug);
  }

  const currentView = prevState.contentListViewStructure[viewIndex]!;
  const updatedView: ContentListViewStructure = {
    slug: currentView.slug,
    name: currentView.name,
    description: currentView.description,
    fields: currentView.fields,
    sortFields: currentView.sortFields,
    filterRules: currentView.filterRules,
    groupByFields: currentView.groupByFields,
    pagination: params.paginationConfig,
    isActive: currentView.isActive,
    createdAt: currentView.createdAt,
    updatedAt: params.updatedAt,
  };

  const nextViews = prevState.contentListViewStructure.map((v, idx) =>
    idx === viewIndex ? updatedView : v
  );

  const patch: Partial<ListContentModel> = {
    contentListViewStructure: nextViews,
    updatedAt: params.updatedAt,
  };

  const nextState: ListContentModel = {
    slug: prevState.slug,
    label: prevState.label,
    description: prevState.description,
    documentUrl: prevState.documentUrl,
    isActive: prevState.isActive,
    enablePublishScheduling: prevState.enablePublishScheduling,
    enableCategories: prevState.enableCategories,
    orderValue: prevState.orderValue,
    modelType: 'list',
    version: prevState.version,
    createdAt: prevState.createdAt,
    updatedAt: params.updatedAt,
    contentItemStructure: prevState.contentItemStructure,
    contentListViewStructure: nextViews,
  };

  return { nextState, patch };
}

// Change Order of Fields in Content List View Command
export interface ChangeContentListViewFieldOrderParams {
  viewSlug: ContentListViewSlug;
  orderedFieldSlugs: FieldSlug[];
  updatedAt: Date;
}

export interface ChangeContentListViewFieldOrderResult {
  nextState: ListContentModel;
  patch: Partial<ListContentModel>;
}

export function changeContentListViewFieldOrder(
  prevState: ContentModel,
  params: ChangeContentListViewFieldOrderParams
): ChangeContentListViewFieldOrderResult {
  if (prevState.modelType !== 'list') {
    throw new InvalidModelTypeError('changeContentListViewFieldOrder', prevState.modelType);
  }

  const viewIndex = prevState.contentListViewStructure.findIndex(
    (v) => v.slug === params.viewSlug
  );

  if (viewIndex === -1) {
    throw new ContentListViewNotFoundError(params.viewSlug);
  }

  const currentView = prevState.contentListViewStructure[viewIndex]!;
  const updatedView: ContentListViewStructure = {
    slug: currentView.slug,
    name: currentView.name,
    description: currentView.description,
    fields: params.orderedFieldSlugs,
    sortFields: currentView.sortFields,
    filterRules: currentView.filterRules,
    groupByFields: currentView.groupByFields,
    pagination: currentView.pagination,
    isActive: currentView.isActive,
    createdAt: currentView.createdAt,
    updatedAt: params.updatedAt,
  };

  const nextViews = prevState.contentListViewStructure.map((v, idx) =>
    idx === viewIndex ? updatedView : v
  );

  const patch: Partial<ListContentModel> = {
    contentListViewStructure: nextViews,
    updatedAt: params.updatedAt,
  };

  const nextState: ListContentModel = {
    slug: prevState.slug,
    label: prevState.label,
    description: prevState.description,
    documentUrl: prevState.documentUrl,
    isActive: prevState.isActive,
    enablePublishScheduling: prevState.enablePublishScheduling,
    enableCategories: prevState.enableCategories,
    orderValue: prevState.orderValue,
    modelType: 'list',
    version: prevState.version,
    createdAt: prevState.createdAt,
    updatedAt: params.updatedAt,
    contentItemStructure: prevState.contentItemStructure,
    contentListViewStructure: nextViews,
  };

  return { nextState, patch };
}
