import { describe, it, expect, beforeEach } from 'vitest';
import { ListContentModelsUseCase } from '../ListContentModelsUseCase.js';
import { WorkspaceNotFoundError } from '../CreateContentModelUseCase.js';
import { WorkspaceRepository } from '../../../driven-ports/WorkspaceRepository.js';
import { ContentModelRepository } from '../../../driven-ports/ContentModelRepository.js';
import { Workspace } from '../../../../domain/workspace/entities.js';
import { ContentModel, ListContentModel, ObjectContentModel } from '../../../../domain/content-model/entities.js';
import { WorkspaceSlug, ContentModelSlug } from '../../../../domain/shared/entities.js';

// ========================================
// Mock Repositories
// ========================================

class MockWorkspaceRepository implements WorkspaceRepository {
  private workspaces: Map<WorkspaceSlug, Workspace> = new Map();

  async findBySlug(slug: WorkspaceSlug): Promise<Workspace | null> {
    return this.workspaces.get(slug) || null;
  }

  async findAll(): Promise<Workspace[]> {
    return Array.from(this.workspaces.values());
  }

  async save(workspace: Workspace): Promise<void> {
    this.workspaces.set(workspace.slug, workspace);
  }

  async delete(slug: WorkspaceSlug): Promise<void> {
    this.workspaces.delete(slug);
  }

  async exists(slug: WorkspaceSlug): Promise<boolean> {
    return this.workspaces.has(slug);
  }

  // Helper method for testing
  addWorkspace(slug: WorkspaceSlug): void {
    this.workspaces.set(slug, { slug });
  }

  clear(): void {
    this.workspaces.clear();
  }
}

class MockContentModelRepository implements ContentModelRepository {
  private models: Map<string, ContentModel> = new Map();

  private getKey(workspaceSlug: WorkspaceSlug, modelSlug: ContentModelSlug): string {
    return `${workspaceSlug}:${modelSlug}`;
  }

  async findBySlug(workspaceSlug: WorkspaceSlug, slug: ContentModelSlug): Promise<ContentModel | null> {
    return this.models.get(this.getKey(workspaceSlug, slug)) || null;
  }

  async findAll(workspaceSlug: WorkspaceSlug): Promise<ContentModel[]> {
    const prefix = `${workspaceSlug}:`;
    return Array.from(this.models.entries())
      .filter(([key]) => key.startsWith(prefix))
      .map(([, model]) => model);
  }

  async findAllListModels(workspaceSlug: WorkspaceSlug): Promise<ListContentModel[]> {
    const models = await this.findAll(workspaceSlug);
    return models.filter(m => m.modelType === 'list') as ListContentModel[];
  }

  async findAllObjectModels(workspaceSlug: WorkspaceSlug): Promise<ObjectContentModel[]> {
    const models = await this.findAll(workspaceSlug);
    return models.filter(m => m.modelType === 'object') as ObjectContentModel[];
  }

  async save(workspaceSlug: WorkspaceSlug, contentModel: ContentModel): Promise<void> {
    this.models.set(this.getKey(workspaceSlug, contentModel.slug), contentModel);
  }

  async delete(workspaceSlug: WorkspaceSlug, slug: ContentModelSlug): Promise<void> {
    this.models.delete(this.getKey(workspaceSlug, slug));
  }

  async exists(workspaceSlug: WorkspaceSlug, slug: ContentModelSlug): Promise<boolean> {
    return this.models.has(this.getKey(workspaceSlug, slug));
  }

  // Helper method for testing
  addModel(workspaceSlug: WorkspaceSlug, model: ContentModel): void {
    this.models.set(this.getKey(workspaceSlug, model.slug), model);
  }

  clear(): void {
    this.models.clear();
  }
}

// ========================================
// Tests
// ========================================

describe('ListContentModelsUseCase', () => {
  let useCase: ListContentModelsUseCase;
  let workspaceRepository: MockWorkspaceRepository;
  let contentModelRepository: MockContentModelRepository;

  beforeEach(() => {
    workspaceRepository = new MockWorkspaceRepository();
    contentModelRepository = new MockContentModelRepository();
    useCase = new ListContentModelsUseCase(workspaceRepository, contentModelRepository);
  });

  describe('execute - Success Cases', () => {
    it('should list all content models successfully', async () => {
      // Arrange
      workspaceRepository.addWorkspace('default' as WorkspaceSlug);

      const now = new Date();
      const listModel: ListContentModel = {
        slug: 'blog-posts' as ContentModelSlug,
        label: 'Blog Posts',
        isActive: true,
        enablePublishScheduling: false,
        orderValue: 0,
        version: 1,
        createdAt: now,
        updatedAt: now,
        modelType: 'list',
        enableCategories: false,
        contentItemStructure: {
          groups: [],
          fields: [],
          virtualFields: [],
          categories: [],
          version: 1,
          createdAt: now,
          updatedAt: now,
        },
        contentListViewStructure: [],
      };

      const objectModel: ObjectContentModel = {
        slug: 'settings' as ContentModelSlug,
        label: 'Settings',
        description: 'Site settings',
        isActive: true,
        enablePublishScheduling: false,
        orderValue: 0,
        version: 1,
        createdAt: now,
        updatedAt: now,
        modelType: 'object',
        contentItemStructure: {
          groups: [],
          fields: [],
          virtualFields: [],
          categories: [],
          version: 1,
          createdAt: now,
          updatedAt: now,
        },
      };

      contentModelRepository.addModel('default' as WorkspaceSlug, listModel);
      contentModelRepository.addModel('default' as WorkspaceSlug, objectModel);

      const input = {
        workspaceSlug: 'default' as WorkspaceSlug,
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.totalCount).toBe(2);
      expect(result.listCount).toBe(1);
      expect(result.objectCount).toBe(1);
      expect(result.contentModels).toHaveLength(2);
      expect(result.contentModels[0].slug).toBe('blog-posts');
      expect(result.contentModels[1].slug).toBe('settings');
    });

    it('should return empty list for workspace with no content models', async () => {
      // Arrange
      workspaceRepository.addWorkspace('empty' as WorkspaceSlug);

      const input = {
        workspaceSlug: 'empty' as WorkspaceSlug,
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.totalCount).toBe(0);
      expect(result.listCount).toBe(0);
      expect(result.objectCount).toBe(0);
      expect(result.contentModels).toHaveLength(0);
    });

    it('should include description in summaries when present', async () => {
      // Arrange
      workspaceRepository.addWorkspace('default' as WorkspaceSlug);

      const now = new Date();
      const modelWithDescription: ListContentModel = {
        slug: 'news' as ContentModelSlug,
        label: 'News',
        description: 'Latest news articles',
        isActive: true,
        enablePublishScheduling: false,
        orderValue: 0,
        version: 1,
        createdAt: now,
        updatedAt: now,
        modelType: 'list',
        enableCategories: false,
        contentItemStructure: {
          groups: [],
          fields: [],
          virtualFields: [],
          categories: [],
          version: 1,
          createdAt: now,
          updatedAt: now,
        },
        contentListViewStructure: [],
      };

      contentModelRepository.addModel('default' as WorkspaceSlug, modelWithDescription);

      const input = {
        workspaceSlug: 'default' as WorkspaceSlug,
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.contentModels[0].description).toBe('Latest news articles');
    });

    it('should correctly count list and object models', async () => {
      // Arrange
      workspaceRepository.addWorkspace('default' as WorkspaceSlug);

      const now = new Date();

      // Add 3 list models
      for (let i = 0; i < 3; i++) {
        const listModel: ListContentModel = {
          slug: `list-${i}` as ContentModelSlug,
          label: `List ${i}`,
          isActive: true,
          enablePublishScheduling: false,
          orderValue: 0,
          version: 1,
          createdAt: now,
          updatedAt: now,
          modelType: 'list',
          enableCategories: false,
          contentItemStructure: {
            groups: [],
            fields: [],
            virtualFields: [],
            categories: [],
            version: 1,
            createdAt: now,
            updatedAt: now,
          },
          contentListViewStructure: [],
        };
        contentModelRepository.addModel('default' as WorkspaceSlug, listModel);
      }

      // Add 2 object models
      for (let i = 0; i < 2; i++) {
        const objectModel: ObjectContentModel = {
          slug: `object-${i}` as ContentModelSlug,
          label: `Object ${i}`,
          isActive: true,
          enablePublishScheduling: false,
          orderValue: 0,
          version: 1,
          createdAt: now,
          updatedAt: now,
          modelType: 'object',
          contentItemStructure: {
            groups: [],
            fields: [],
            virtualFields: [],
            categories: [],
            version: 1,
            createdAt: now,
            updatedAt: now,
          },
        };
        contentModelRepository.addModel('default' as WorkspaceSlug, objectModel);
      }

      const input = {
        workspaceSlug: 'default' as WorkspaceSlug,
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.totalCount).toBe(5);
      expect(result.listCount).toBe(3);
      expect(result.objectCount).toBe(2);
    });
  });

  describe('execute - Error Cases', () => {
    it('should throw WorkspaceNotFoundError when workspace does not exist', async () => {
      // Arrange
      const input = {
        workspaceSlug: 'nonexistent' as WorkspaceSlug,
      };

      // Act & Assert
      await expect(useCase.execute(input)).rejects.toThrow(WorkspaceNotFoundError);
      await expect(useCase.execute(input)).rejects.toThrow(
        "Workspace with slug 'nonexistent' not found."
      );
    });

    it('should validate input schema - empty workspace slug', async () => {
      // Arrange
      const invalidInput = {
        workspaceSlug: '' as any,
      };

      // Act & Assert
      await expect(useCase.execute(invalidInput)).rejects.toThrow();
    });
  });

  describe('execute - Multiple Workspaces', () => {
    it('should list models only from specified workspace', async () => {
      // Arrange
      workspaceRepository.addWorkspace('workspace1' as WorkspaceSlug);
      workspaceRepository.addWorkspace('workspace2' as WorkspaceSlug);

      const now = new Date();

      const model1: ListContentModel = {
        slug: 'model1' as ContentModelSlug,
        label: 'Model 1',
        isActive: true,
        enablePublishScheduling: false,
        orderValue: 0,
        version: 1,
        createdAt: now,
        updatedAt: now,
        modelType: 'list',
        enableCategories: false,
        contentItemStructure: {
          groups: [],
          fields: [],
          virtualFields: [],
          categories: [],
          version: 1,
          createdAt: now,
          updatedAt: now,
        },
        contentListViewStructure: [],
      };

      const model2: ObjectContentModel = {
        slug: 'model2' as ContentModelSlug,
        label: 'Model 2',
        isActive: true,
        enablePublishScheduling: false,
        orderValue: 0,
        version: 1,
        createdAt: now,
        updatedAt: now,
        modelType: 'object',
        contentItemStructure: {
          groups: [],
          fields: [],
          virtualFields: [],
          categories: [],
          version: 1,
          createdAt: now,
          updatedAt: now,
        },
      };

      contentModelRepository.addModel('workspace1' as WorkspaceSlug, model1);
      contentModelRepository.addModel('workspace2' as WorkspaceSlug, model2);

      const input = {
        workspaceSlug: 'workspace1' as WorkspaceSlug,
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.totalCount).toBe(1);
      expect(result.contentModels[0].slug).toBe('model1');
    });
  });

  describe('execute - Output Validation', () => {
    it('should return validated output with correct structure', async () => {
      // Arrange
      workspaceRepository.addWorkspace('default' as WorkspaceSlug);

      const now = new Date();
      const model: ListContentModel = {
        slug: 'test' as ContentModelSlug,
        label: 'Test',
        isActive: true,
        enablePublishScheduling: false,
        orderValue: 0,
        version: 1,
        createdAt: now,
        updatedAt: now,
        modelType: 'list',
        enableCategories: false,
        contentItemStructure: {
          groups: [],
          fields: [],
          virtualFields: [],
          categories: [],
          version: 1,
          createdAt: now,
          updatedAt: now,
        },
        contentListViewStructure: [],
      };

      contentModelRepository.addModel('default' as WorkspaceSlug, model);

      const input = {
        workspaceSlug: 'default' as WorkspaceSlug,
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result).toHaveProperty('workspaceSlug');
      expect(result).toHaveProperty('contentModels');
      expect(result).toHaveProperty('totalCount');
      expect(result).toHaveProperty('listCount');
      expect(result).toHaveProperty('objectCount');
      expect(result.contentModels[0]).toHaveProperty('slug');
      expect(result.contentModels[0]).toHaveProperty('label');
      expect(result.contentModels[0]).toHaveProperty('modelType');
      expect(result.contentModels[0]).toHaveProperty('isActive');
      expect(result.contentModels[0]).toHaveProperty('createdAt');
      expect(result.contentModels[0]).toHaveProperty('updatedAt');
    });
  });
});
