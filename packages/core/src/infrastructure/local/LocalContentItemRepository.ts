/**
 * Local file-based implementation of ContentItemRepository
 * Stores content items per workspace and content model
 * File structure: content-items/{workspaceSlug}/{contentModelSlug}/{itemId}.json
 */

import { join } from 'path';
import type {
  ContentItemRepository,
  ContentItemQueryOptions,
  ContentItemIdType,
} from '../../application/ports/ContentItemRepository.js';
import type { ContentItem } from '../../domain/content-item/entities.js';
import type { ContentModelSlug, ContentItemSlug, WorkspaceSlug } from '../../domain/shared/entities.js';
import type { LocalStorageConfig, StorageFiles } from './types.js';
import {
  readJsonFile,
  writeJsonFile,
  deleteFile,
  fileExists,
  listFiles,
  ensureDirectory,
  deserialize,
  serialize,
} from './utils.js';

const DATE_FIELDS = ['createdAt', 'updatedAt', 'publishedAt', 'expiresAt'];

export class LocalContentItemRepository implements ContentItemRepository {
  constructor(
    private readonly storageFiles: StorageFiles,
    private readonly config: LocalStorageConfig
  ) {}

  async findById(
    workspaceSlug: WorkspaceSlug,
    contentModelSlug: ContentModelSlug,
    id: ContentItemIdType
  ): Promise<ContentItem | null> {
    const data = await readJsonFile<unknown>(
      this.storageFiles.contentModelItemFile(workspaceSlug, contentModelSlug, id)
    );

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
    const itemsDir = this.storageFiles.contentModelItemsDir(workspaceSlug, contentModelSlug);
    const files = await listFiles(itemsDir);

    for (const file of files) {
      if (file.endsWith('.json')) {
        const filePath = join(itemsDir, file);
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
    const itemsDir = this.storageFiles.contentModelItemsDir(workspaceSlug, contentModelSlug);

    if (this.config.autoCreateDirectories) {
      await ensureDirectory(itemsDir);
    }

    const files = await listFiles(itemsDir);
    let contentItems: ContentItem[] = [];

    for (const file of files) {
      if (file.endsWith('.json')) {
        const filePath = join(itemsDir, file);
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
    const serialized = serialize(contentItem);
    await writeJsonFile(
      this.storageFiles.contentModelItemFile(workspaceSlug, contentModelSlug, contentItem.id),
      serialized,
      this.config
    );
  }

  async delete(
    workspaceSlug: WorkspaceSlug,
    contentModelSlug: ContentModelSlug,
    id: ContentItemIdType
  ): Promise<void> {
    await deleteFile(this.storageFiles.contentModelItemFile(workspaceSlug, contentModelSlug, id));
  }

  async exists(
    workspaceSlug: WorkspaceSlug,
    contentModelSlug: ContentModelSlug,
    id: ContentItemIdType
  ): Promise<boolean> {
    return await fileExists(
      this.storageFiles.contentModelItemFile(workspaceSlug, contentModelSlug, id)
    );
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
