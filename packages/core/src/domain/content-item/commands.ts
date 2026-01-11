// ========================================
// Commands for Content Item Management
// ========================================

import type { ContentItem, ContentItemField } from './entities.js';
import type { ContentItemSlug } from '../shared/entities.js';

// Type alias for ContentItem ID (string with ContentItemId brand)
type ContentItemIdType = ContentItem['id'];

// ========================================
// Error Definitions
// ========================================

export class ContentItemNotFoundError extends Error {
  constructor(identifier: string) {
    super(`Content item '${identifier}' not found.`);
    this.name = 'ContentItemNotFoundError';
  }
}

export class ContentItemAlreadyExistsError extends Error {
  constructor(slug: ContentItemSlug) {
    super(`Content item with slug '${slug}' already exists.`);
    this.name = 'ContentItemAlreadyExistsError';
  }
}

export class InvalidFieldValueError extends Error {
  constructor(fieldSlug: string, message: string) {
    super(`Invalid value for field '${fieldSlug}': ${message}`);
    this.name = 'InvalidFieldValueError';
  }
}

export class RequiredFieldMissingError extends Error {
  constructor(fieldSlug: string) {
    super(`Required field '${fieldSlug}' is missing or empty.`);
    this.name = 'RequiredFieldMissingError';
  }
}

export class FieldNotInModelError extends Error {
  constructor(fieldSlug: string) {
    super(`Field '${fieldSlug}' is not defined in the content model.`);
    this.name = 'FieldNotInModelError';
  }
}

// ========================================
// Create Content Item Command
// ========================================

export interface CreateContentItemParams {
  id: ContentItemIdType;
  slug: ContentItemSlug;
  fields: ContentItemField[];
  categories?: string[];
  tags?: string[];
  status?: 'draft' | 'published' | 'archived';
  publishedAt?: Date;
  expiresAt?: Date;
  createdAt: Date;
  createdBy?: string;
}

export interface CreateContentItemResult {
  nextState: ContentItem;
}

export function createContentItem(
  params: CreateContentItemParams
): CreateContentItemResult {
  const nextState: ContentItem = {
    id: params.id,
    slug: params.slug,
    fields: params.fields,
    categories: params.categories ?? [],
    tags: params.tags ?? [],
    status: params.status ?? 'draft',
    publishedAt: params.publishedAt,
    expiresAt: params.expiresAt,
    version: 1,
    createdAt: params.createdAt,
    updatedAt: params.createdAt,
    createdBy: params.createdBy,
  };

  return { nextState };
}

// ========================================
// Update Content Item Command
// ========================================

export interface UpdateContentItemParams {
  fields?: ContentItemField[];
  categories?: string[];
  tags?: string[];
  updatedAt: Date;
  updatedBy?: string;
}

export interface UpdateContentItemResult {
  nextState: ContentItem;
  patch: Partial<ContentItem>;
}

export function updateContentItem(
  prevState: ContentItem,
  params: UpdateContentItemParams
): UpdateContentItemResult {
  const patch: Partial<ContentItem> = {
    ...(params.fields !== undefined && { fields: params.fields }),
    ...(params.categories !== undefined && { categories: params.categories }),
    ...(params.tags !== undefined && { tags: params.tags }),
    updatedAt: params.updatedAt,
    ...(params.updatedBy !== undefined && { updatedBy: params.updatedBy }),
    version: prevState.version + 1,
  };

  const nextState: ContentItem = {
    id: prevState.id,
    slug: prevState.slug,
    fields: params.fields !== undefined ? params.fields : prevState.fields,
    categories: params.categories !== undefined ? params.categories : prevState.categories,
    tags: params.tags !== undefined ? params.tags : prevState.tags,
    status: prevState.status,
    publishedAt: prevState.publishedAt,
    expiresAt: prevState.expiresAt,
    version: prevState.version + 1,
    createdAt: prevState.createdAt,
    updatedAt: params.updatedAt,
    createdBy: prevState.createdBy,
    updatedBy: params.updatedBy !== undefined ? params.updatedBy : prevState.updatedBy,
  };

  return { nextState, patch };
}

// ========================================
// Update Content Item Status Command
// ========================================

export interface UpdateContentItemStatusParams {
  status: 'draft' | 'published' | 'archived';
  publishedAt?: Date;
  expiresAt?: Date;
  updatedAt: Date;
  updatedBy?: string;
}

export interface UpdateContentItemStatusResult {
  nextState: ContentItem;
  patch: Partial<ContentItem>;
}

export function updateContentItemStatus(
  prevState: ContentItem,
  params: UpdateContentItemStatusParams
): UpdateContentItemStatusResult {
  const patch: Partial<ContentItem> = {
    status: params.status,
    ...(params.publishedAt !== undefined && { publishedAt: params.publishedAt }),
    ...(params.expiresAt !== undefined && { expiresAt: params.expiresAt }),
    updatedAt: params.updatedAt,
    ...(params.updatedBy !== undefined && { updatedBy: params.updatedBy }),
    version: prevState.version + 1,
  };

  const nextState: ContentItem = {
    id: prevState.id,
    slug: prevState.slug,
    fields: prevState.fields,
    categories: prevState.categories,
    tags: prevState.tags,
    status: params.status,
    publishedAt: params.publishedAt !== undefined ? params.publishedAt : prevState.publishedAt,
    expiresAt: params.expiresAt !== undefined ? params.expiresAt : prevState.expiresAt,
    version: prevState.version + 1,
    createdAt: prevState.createdAt,
    updatedAt: params.updatedAt,
    createdBy: prevState.createdBy,
    updatedBy: params.updatedBy !== undefined ? params.updatedBy : prevState.updatedBy,
  };

  return { nextState, patch };
}
