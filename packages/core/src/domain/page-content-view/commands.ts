// ========================================
// Commands for Page Content View Creation
// ========================================

import {
  StaticPageContentView,
  IndexPageContentView,
  ItemPageContentView,
  PageContentViewSchema,
} from './entities.js';
import type { PaginationContext } from '../shared/entities.js';

// ========================================
// Error Definitions
// ========================================

export class InvalidPageContentViewTypeError extends Error {
  constructor(type: string) {
    super(`Invalid page content view type: '${type}'.`);
    this.name = 'InvalidPageContentViewTypeError';
  }
}

// ========================================
// Create Static Page Content View Command (Factory Function)
// ========================================

export interface CreateStaticPageContentViewParams {
  title?: string;
  description?: string;
  constants?: Record<string, unknown>;
  properties?: Record<string, unknown>;
  objectContents?: Record<string, unknown>;
  listViews?: Record<string, Record<string, unknown>>;
}

export interface CreateStaticPageContentViewResult {
  nextState: StaticPageContentView;
}

/**
 * Creates a static page content view
 * Pure function: (params) => { nextState }
 *
 * @param params - Parameters for creating a static page content view
 * @returns Result containing the created static page content view
 */
export function createStaticPageContentView(
  params: CreateStaticPageContentViewParams
): CreateStaticPageContentViewResult {
  const nextState = PageContentViewSchema.parse({
    type: 'static',
    pageContext: {
      title: params.title ?? '',
      description: params.description ?? '',
      constants: params.constants ?? {},
      properties: params.properties ?? {},
    },
    objectContents: params.objectContents ?? {},
    listViews: params.listViews ?? {},
  }) as StaticPageContentView;

  return { nextState };
}

// ========================================
// Create Index Page Content View Command (Factory Function)
// ========================================

export interface CreateIndexPageContentViewParams {
  title?: string;
  description?: string;
  constants?: Record<string, unknown>;
  properties?: Record<string, unknown>;
  objectContents?: Record<string, unknown>;
  listViews?: Record<string, Record<string, unknown>>;
  paginationContext: PaginationContext;
}

export interface CreateIndexPageContentViewResult {
  nextState: IndexPageContentView;
}

/**
 * Creates an index page content view with pagination
 * Pure function: (params) => { nextState }
 *
 * @param params - Parameters for creating an index page content view
 * @returns Result containing the created index page content view
 */
export function createIndexPageContentView(
  params: CreateIndexPageContentViewParams
): CreateIndexPageContentViewResult {
  const nextState = PageContentViewSchema.parse({
    type: 'index',
    pageContext: {
      title: params.title ?? '',
      description: params.description ?? '',
      constants: params.constants ?? {},
      properties: params.properties ?? {},
    },
    objectContents: params.objectContents ?? {},
    listViews: params.listViews ?? {},
    paginationContext: params.paginationContext,
  }) as IndexPageContentView;

  return { nextState };
}

// ========================================
// Create Item Page Content View Command (Factory Function)
// ========================================

export interface CreateItemPageContentViewParams {
  title?: string;
  description?: string;
  constants?: Record<string, unknown>;
  properties?: Record<string, unknown>;
  objectContents?: Record<string, unknown>;
  listViews?: Record<string, Record<string, unknown>>;
  fields: Record<string, unknown>;
}

export interface CreateItemPageContentViewResult {
  nextState: ItemPageContentView;
}

/**
 * Creates an item page content view with fields
 * Pure function: (params) => { nextState }
 *
 * @param params - Parameters for creating an item page content view
 * @returns Result containing the created item page content view
 */
export function createItemPageContentView(
  params: CreateItemPageContentViewParams
): CreateItemPageContentViewResult {
  const nextState = PageContentViewSchema.parse({
    type: 'item',
    pageContext: {
      title: params.title ?? '',
      description: params.description ?? '',
      constants: params.constants ?? {},
      properties: params.properties ?? {},
    },
    objectContents: params.objectContents ?? {},
    listViews: params.listViews ?? {},
    fields: params.fields,
  }) as ItemPageContentView;

  return { nextState };
}
