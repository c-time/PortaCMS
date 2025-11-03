/**
 * Tests for LocalContentItemRepository
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'fs';
import { join } from 'path';
import { LocalContentItemRepository } from './LocalContentItemRepository.js';
import type { ContentItem } from '../../domain/content-item/entities.js';
import type { WorkspaceSlug, ContentModelSlug, ContentItemSlug } from '../../domain/shared/entities.js';
import type { ContentItemIdType } from '../../application/ports/ContentItemRepository.js';

const TEST_BASE_DIR = join(process.cwd(), 'test-data', 'content-item-repo');

describe('LocalContentItemRepository', () => {
  let repository: LocalContentItemRepository;
  const workspaceSlug = 'default' as WorkspaceSlug;
  const contentModelSlug = 'articles' as ContentModelSlug;

  beforeEach(async () => {
    try {
      await fs.rm(TEST_BASE_DIR, { recursive: true, force: true });
    } catch {
      // Ignore if directory doesn't exist
    }

    repository = new LocalContentItemRepository({
      baseDir: TEST_BASE_DIR,
    });
  });

  afterEach(async () => {
    try {
      await fs.rm(TEST_BASE_DIR, { recursive: true, force: true });
    } catch {
      // Ignore errors
    }
  });

  const createTestContentItem = (id: string, slug: string): ContentItem => ({
    id: id as ContentItemIdType,
    slug: slug as ContentItemSlug,
    fields: [
      {
        slug: 'title' as ContentItemSlug,
        value: ['Test Article'],
        schema: { type: 'String' },
      },
    ],
    status: 'draft',
    categories: ['tech'],
    tags: ['typescript', 'testing'],
    version: 1,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-02'),
  });

  describe('exists', () => {
    it('should return false when content item does not exist', async () => {
      const exists = await repository.exists(
        workspaceSlug,
        contentModelSlug,
        'item-1' as ContentItemIdType
      );
      expect(exists).toBe(false);
    });

    it('should return true when content item exists', async () => {
      const item = createTestContentItem('item-1', 'test-article');
      await repository.save(workspaceSlug, contentModelSlug, item);

      const exists = await repository.exists(workspaceSlug, contentModelSlug, item.id);
      expect(exists).toBe(true);
    });
  });

  describe('existsBySlug', () => {
    it('should return false when content item does not exist', async () => {
      const exists = await repository.existsBySlug(
        workspaceSlug,
        contentModelSlug,
        'test-article' as ContentItemSlug
      );
      expect(exists).toBe(false);
    });

    it('should return true when content item exists', async () => {
      const item = createTestContentItem('item-1', 'test-article');
      await repository.save(workspaceSlug, contentModelSlug, item);

      const exists = await repository.existsBySlug(
        workspaceSlug,
        contentModelSlug,
        'test-article' as ContentItemSlug
      );
      expect(exists).toBe(true);
    });
  });

  describe('findById', () => {
    it('should return null when content item does not exist', async () => {
      const item = await repository.findById(
        workspaceSlug,
        contentModelSlug,
        'item-1' as ContentItemIdType
      );
      expect(item).toBeNull();
    });

    it('should return content item when it exists', async () => {
      const item = createTestContentItem('item-1', 'test-article');
      await repository.save(workspaceSlug, contentModelSlug, item);

      const retrieved = await repository.findById(workspaceSlug, contentModelSlug, item.id);
      expect(retrieved).toEqual(item);
    });

    it('should correctly deserialize date fields', async () => {
      const item = createTestContentItem('item-1', 'test-article');
      await repository.save(workspaceSlug, contentModelSlug, item);

      const retrieved = await repository.findById(workspaceSlug, contentModelSlug, item.id);
      expect(retrieved?.createdAt).toBeInstanceOf(Date);
      expect(retrieved?.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe('findBySlug', () => {
    it('should return null when content item does not exist', async () => {
      const item = await repository.findBySlug(
        workspaceSlug,
        contentModelSlug,
        'test-article' as ContentItemSlug
      );
      expect(item).toBeNull();
    });

    it('should return content item when it exists', async () => {
      const item = createTestContentItem('item-1', 'test-article');
      await repository.save(workspaceSlug, contentModelSlug, item);

      const retrieved = await repository.findBySlug(
        workspaceSlug,
        contentModelSlug,
        'test-article' as ContentItemSlug
      );
      expect(retrieved).toEqual(item);
    });
  });

  describe('findAll', () => {
    it('should return empty array when no content items exist', async () => {
      const items = await repository.findAll(workspaceSlug, contentModelSlug);
      expect(items).toEqual([]);
    });

    it('should return all content items', async () => {
      const item1 = createTestContentItem('item-1', 'article-1');
      const item2 = createTestContentItem('item-2', 'article-2');

      await repository.save(workspaceSlug, contentModelSlug, item1);
      await repository.save(workspaceSlug, contentModelSlug, item2);

      const items = await repository.findAll(workspaceSlug, contentModelSlug);
      expect(items).toHaveLength(2);
    });

    it('should filter by status', async () => {
      const item1 = { ...createTestContentItem('item-1', 'article-1'), status: 'draft' as const };
      const item2 = {
        ...createTestContentItem('item-2', 'article-2'),
        status: 'published' as const,
      };

      await repository.save(workspaceSlug, contentModelSlug, item1);
      await repository.save(workspaceSlug, contentModelSlug, item2);

      const draftItems = await repository.findAll(workspaceSlug, contentModelSlug, {
        status: 'draft',
      });
      expect(draftItems).toHaveLength(1);
      expect(draftItems[0].id).toBe(item1.id);
    });

    it('should filter by categories', async () => {
      const item1 = { ...createTestContentItem('item-1', 'article-1'), categories: ['tech'] };
      const item2 = { ...createTestContentItem('item-2', 'article-2'), categories: ['news'] };

      await repository.save(workspaceSlug, contentModelSlug, item1);
      await repository.save(workspaceSlug, contentModelSlug, item2);

      const techItems = await repository.findAll(workspaceSlug, contentModelSlug, {
        categories: ['tech'],
      });
      expect(techItems).toHaveLength(1);
      expect(techItems[0].id).toBe(item1.id);
    });

    it('should filter by tags', async () => {
      const item1 = { ...createTestContentItem('item-1', 'article-1'), tags: ['typescript'] };
      const item2 = { ...createTestContentItem('item-2', 'article-2'), tags: ['javascript'] };

      await repository.save(workspaceSlug, contentModelSlug, item1);
      await repository.save(workspaceSlug, contentModelSlug, item2);

      const tsItems = await repository.findAll(workspaceSlug, contentModelSlug, {
        tags: ['typescript'],
      });
      expect(tsItems).toHaveLength(1);
      expect(tsItems[0].id).toBe(item1.id);
    });

    it('should apply pagination', async () => {
      const item1 = createTestContentItem('item-1', 'article-1');
      const item2 = createTestContentItem('item-2', 'article-2');
      const item3 = createTestContentItem('item-3', 'article-3');

      await repository.save(workspaceSlug, contentModelSlug, item1);
      await repository.save(workspaceSlug, contentModelSlug, item2);
      await repository.save(workspaceSlug, contentModelSlug, item3);

      const page1 = await repository.findAll(workspaceSlug, contentModelSlug, {
        limit: 2,
        offset: 0,
      });
      expect(page1).toHaveLength(2);

      const page2 = await repository.findAll(workspaceSlug, contentModelSlug, {
        limit: 2,
        offset: 2,
      });
      expect(page2).toHaveLength(1);
    });
  });

  describe('count', () => {
    it('should return 0 when no content items exist', async () => {
      const count = await repository.count(workspaceSlug, contentModelSlug);
      expect(count).toBe(0);
    });

    it('should return correct count', async () => {
      const item1 = createTestContentItem('item-1', 'article-1');
      const item2 = createTestContentItem('item-2', 'article-2');

      await repository.save(workspaceSlug, contentModelSlug, item1);
      await repository.save(workspaceSlug, contentModelSlug, item2);

      const count = await repository.count(workspaceSlug, contentModelSlug);
      expect(count).toBe(2);
    });

    it('should count with filters', async () => {
      const item1 = { ...createTestContentItem('item-1', 'article-1'), status: 'draft' as const };
      const item2 = {
        ...createTestContentItem('item-2', 'article-2'),
        status: 'published' as const,
      };

      await repository.save(workspaceSlug, contentModelSlug, item1);
      await repository.save(workspaceSlug, contentModelSlug, item2);

      const draftCount = await repository.count(workspaceSlug, contentModelSlug, {
        status: 'draft',
      });
      expect(draftCount).toBe(1);
    });
  });

  describe('findByCategory', () => {
    it('should return items with specified category', async () => {
      const item1 = { ...createTestContentItem('item-1', 'article-1'), categories: ['tech'] };
      const item2 = { ...createTestContentItem('item-2', 'article-2'), categories: ['news'] };

      await repository.save(workspaceSlug, contentModelSlug, item1);
      await repository.save(workspaceSlug, contentModelSlug, item2);

      const techItems = await repository.findByCategory(workspaceSlug, contentModelSlug, 'tech');
      expect(techItems).toHaveLength(1);
      expect(techItems[0].id).toBe(item1.id);
    });
  });

  describe('findByTag', () => {
    it('should return items with specified tag', async () => {
      const item1 = { ...createTestContentItem('item-1', 'article-1'), tags: ['typescript'] };
      const item2 = { ...createTestContentItem('item-2', 'article-2'), tags: ['javascript'] };

      await repository.save(workspaceSlug, contentModelSlug, item1);
      await repository.save(workspaceSlug, contentModelSlug, item2);

      const tsItems = await repository.findByTag(workspaceSlug, contentModelSlug, 'typescript');
      expect(tsItems).toHaveLength(1);
      expect(tsItems[0].id).toBe(item1.id);
    });
  });

  describe('save', () => {
    it('should save a new content item', async () => {
      const item = createTestContentItem('item-1', 'test-article');
      await repository.save(workspaceSlug, contentModelSlug, item);

      const retrieved = await repository.findById(workspaceSlug, contentModelSlug, item.id);
      expect(retrieved).toEqual(item);
    });

    it('should update an existing content item', async () => {
      const item = createTestContentItem('item-1', 'test-article');
      await repository.save(workspaceSlug, contentModelSlug, item);

      const updatedItem = {
        ...item,
        fields: [
          {
            slug: 'title' as ContentItemSlug,
            value: ['Updated Title'],
            schema: { type: 'String' },
          },
        ],
      };
      await repository.save(workspaceSlug, contentModelSlug, updatedItem);

      const retrieved = await repository.findById(workspaceSlug, contentModelSlug, item.id);
      expect(retrieved?.fields[0].value[0]).toBe('Updated Title');
    });
  });

  describe('delete', () => {
    it('should delete an existing content item', async () => {
      const item = createTestContentItem('item-1', 'test-article');
      await repository.save(workspaceSlug, contentModelSlug, item);
      await repository.delete(workspaceSlug, contentModelSlug, item.id);

      const exists = await repository.exists(workspaceSlug, contentModelSlug, item.id);
      expect(exists).toBe(false);
    });

    it('should not throw error when deleting non-existent item', async () => {
      await expect(
        repository.delete(workspaceSlug, contentModelSlug, 'non-existent' as ContentItemIdType)
      ).resolves.not.toThrow();
    });
  });
});
