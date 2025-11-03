/**
 * Local file-based implementation of ContentItemRepository
 * Stores content items per workspace and content model
 * File structure: content-items/{workspaceSlug}/{contentModelSlug}/{itemId}.json
 */

import type {
  ContentItemRepository,
  ContentItemQueryOptions,
  ContentItemIdType,
} from '../../application/ports/ContentItemRepository.js';
import type { ContentItem } from '../../domain/content-item/entities.js';
import type { ContentModelSlug, ContentItemSlug, WorkspaceSlug } from '../../domain/shared/entities.js';
import type { LocalStorageConfig } from './types.js';
import { DEFAULT_LOCAL_STORAGE_CONFIG, LOCAL_STORAGE_PATHS } from './types.js';
import {
  readJsonFile,
  writeJsonFile,
  deleteFile,
  fileExists,
  listFiles,
  buildPath,
  ensureDirectory,
  deserialize,
  serialize,
} from './utils.js';

const DATE_FIELDS = ['createdAt', 'updatedAt', 'publishedAt', 'expiresAt'];

export class LocalContentItemRepository implements ContentItemRepository {
  private readonly config: LocalStorageConfig;
  private readonly contentItemsDir: string;

  constructor(config: Partial<LocalStorageConfig> = {}) {
    this.config = { ...DEFAULT_LOCAL_STORAGE_CONFIG, ...config };
    this.contentItemsDir = buildPath(this.config.baseDir, LOCAL_STORAGE_PATHS.CONTENT_ITEMS);
  }

  private getModelDir(workspaceSlug: WorkspaceSlug, contentModelSlug: ContentModelSlug): string {
    return buildPath(this.contentItemsDir, workspaceSlug, contentModelSlug);
  }

  private getContentItemFilePath(
    workspaceSlug: WorkspaceSlug,
    contentModelSlug: ContentModelSlug,
    id: ContentItemIdType
  ): string {
    return buildPath(this.getModelDir(workspaceSlug, contentModelSlug), `${id}.json`);
  }

  async findById(
    workspaceSlug: WorkspaceSlug,
    contentModelSlug: ContentModelSlug,
    id: ContentItemIdType
  ): Promise<ContentItem | null> {
    const filePath = this.getContentItemFilePath(workspaceSlug, contentModelSlug, id);
    const data = await readJsonFile<unknown>(filePath);

    if (!data) {
      return null;
    }

    return deserialize<ContentItem>(data, DATE_FIELDS);
  }

  async findBySlug(
    workspaceSlug: WorkspaceSlug,
    contentModelSlug: ContentModelSlug,
    slug: ContentItemSlug
  ): Promise<ContentItem | null> {
    const modelDir = this.getModelDir(workspaceSlug, contentModelSlug);
    const files = await listFiles(modelDir);

    for (const file of files) {
      if (file.endsWith('.json')) {
        const filePath = buildPath(modelDir, file);
        const data = await readJsonFile<unknown>(filePath);
        if (data) {
          const item = deserialize<ContentItem>(data, DATE_FIELDS);
          if (item.slug === slug) {
            return item;
          }
        }
      }
    }

    return null;
  }

  async findAll(
    workspaceSlug: WorkspaceSlug,
    contentModelSlug: ContentModelSlug,
    options?: ContentItemQueryOptions
  ): Promise<ContentItem[]> {
    const modelDir = this.getModelDir(workspaceSlug, contentModelSlug);

    if (this.config.autoCreateDirectories) {
      await ensureDirectory(modelDir);
    }

    const files = await listFiles(modelDir);
    let contentItems: ContentItem[] = [];

    for (const file of files) {
      if (file.endsWith('.json')) {
        const filePath = buildPath(modelDir, file);
        const data = await readJsonFile<unknown>(filePath);
        if (data) {
          const item = deserialize<ContentItem>(data, DATE_FIELDS);
          contentItems.push(item);
        }
      }
    }

    // Apply filters
    if (options) {
      contentItems = this.applyFilters(contentItems, options);
    }

    return contentItems;
  }

  private applyFilters(
    items: ContentItem[],
    options: ContentItemQueryOptions
  ): ContentItem[] {
    let filtered = [...items];

    // Filter by status
    if (options.status) {
      filtered = filtered.filter((item) => item.status === options.status);
    }

    // Filter by categories
    if (options.categories && options.categories.length > 0) {
      filtered = filtered.filter((item) =>
        options.categories!.some((cat) => item.categories.includes(cat))
      );
    }

    // Filter by tags
    if (options.tags && options.tags.length > 0) {
      filtered = filtered.filter((item) =>
        options.tags!.some((tag) => item.tags.includes(tag))
      );
    }

    // Sort
    if (options.sortBy) {
      const sortField = options.sortBy;
      const sortOrder = options.sortOrder || 'asc';

      filtered.sort((a, b) => {
        const aVal = a[sortField];
        const bVal = b[sortField];

        if (!aVal && !bVal) return 0;
        if (!aVal) return sortOrder === 'asc' ? 1 : -1;
        if (!bVal) return sortOrder === 'asc' ? -1 : 1;

        const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
        return sortOrder === 'asc' ? comparison : -comparison;
      });
    }

    // Pagination
    if (options.offset !== undefined || options.limit !== undefined) {
      const offset = options.offset || 0;
      const limit = options.limit || filtered.length;
      filtered = filtered.slice(offset, offset + limit);
    }

    return filtered;
  }

  async count(
    workspaceSlug: WorkspaceSlug,
    contentModelSlug: ContentModelSlug,
    options?: Omit<ContentItemQueryOptions, 'limit' | 'offset' | 'sortBy' | 'sortOrder'>
  ): Promise<number> {
    const items = await this.findAll(workspaceSlug, contentModelSlug, options);
    return items.length;
  }

  async findByCategory(
    workspaceSlug: WorkspaceSlug,
    contentModelSlug: ContentModelSlug,
    category: string
  ): Promise<ContentItem[]> {
    return await this.findAll(workspaceSlug, contentModelSlug, {
      categories: [category],
    });
  }

  async findByTag(
    workspaceSlug: WorkspaceSlug,
    contentModelSlug: ContentModelSlug,
    tag: string
  ): Promise<ContentItem[]> {
    return await this.findAll(workspaceSlug, contentModelSlug, {
      tags: [tag],
    });
  }

  async save(
    workspaceSlug: WorkspaceSlug,
    contentModelSlug: ContentModelSlug,
    contentItem: ContentItem
  ): Promise<void> {
    const filePath = this.getContentItemFilePath(workspaceSlug, contentModelSlug, contentItem.id);
    const serialized = serialize(contentItem);
    await writeJsonFile(filePath, serialized, this.config);
  }

  async delete(
    workspaceSlug: WorkspaceSlug,
    contentModelSlug: ContentModelSlug,
    id: ContentItemIdType
  ): Promise<void> {
    const filePath = this.getContentItemFilePath(workspaceSlug, contentModelSlug, id);
    await deleteFile(filePath);
  }

  async exists(
    workspaceSlug: WorkspaceSlug,
    contentModelSlug: ContentModelSlug,
    id: ContentItemIdType
  ): Promise<boolean> {
    const filePath = this.getContentItemFilePath(workspaceSlug, contentModelSlug, id);
    return await fileExists(filePath);
  }

  async existsBySlug(
    workspaceSlug: WorkspaceSlug,
    contentModelSlug: ContentModelSlug,
    slug: ContentItemSlug
  ): Promise<boolean> {
    const item = await this.findBySlug(workspaceSlug, contentModelSlug, slug);
    return item !== null;
  }
}
