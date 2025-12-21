import { describe, it, expect, beforeEach } from 'vitest';
import { ValidateContentModelsUseCase } from '../ValidateContentModelsUseCase.js';
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
  addModel(workspaceSlug: WorkspaceSlug, model: any): void {
    this.models.set(this.getKey(workspaceSlug, model.slug), model);
  }

  clear(): void {
    this.models.clear();
  }
}

// ========================================
// Tests
// ========================================

describe('ValidateContentModelsUseCase', () => {
  let useCase: ValidateContentModelsUseCase;
  let workspaceRepository: MockWorkspaceRepository;
  let contentModelRepository: MockContentModelRepository;

  beforeEach(() => {
    workspaceRepository = new MockWorkspaceRepository();
    contentModelRepository = new MockContentModelRepository();
    useCase = new ValidateContentModelsUseCase(workspaceRepository, contentModelRepository);
  });

  describe('execute - Success Cases', () => {
    it('should validate all content models successfully when all are valid', async () => {
      // Arrange
      workspaceRepository.addWorkspace('default' as WorkspaceSlug);

      const now = new Date();
      const validListModel: ListContentModel = {
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

      const validObjectModel: ObjectContentModel = {
        slug: 'settings' as ContentModelSlug,
        label: 'Settings',
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

      contentModelRepository.addModel('default' as WorkspaceSlug, validListModel);
      contentModelRepository.addModel('default' as WorkspaceSlug, validObjectModel);

      const input = {
        workspaceSlug: 'default' as WorkspaceSlug,
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.totalModels).toBe(2);
      expect(result.validModels).toBe(2);
      expect(result.invalidModels).toBe(0);
      expect(result.results).toHaveLength(2);
      expect(result.results.every(r => r.isValid)).toBe(true);
    });

    it('should return empty results for workspace with no content models', async () => {
      // Arrange
      workspaceRepository.addWorkspace('empty' as WorkspaceSlug);

      const input = {
        workspaceSlug: 'empty' as WorkspaceSlug,
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.totalModels).toBe(0);
      expect(result.validModels).toBe(0);
      expect(result.invalidModels).toBe(0);
      expect(result.results).toHaveLength(0);
    });
  });

  describe('execute - Invalid Models', () => {
    it('should detect invalid content models with missing required fields', async () => {
      // Arrange
      workspaceRepository.addWorkspace('default' as WorkspaceSlug);

      // Invalid model - missing required fields
      const invalidModel = {
        slug: 'invalid' as ContentModelSlug,
        modelType: 'list',
        // Missing: label, isActive, version, createdAt, updatedAt, etc.
      };

      contentModelRepository.addModel('default' as WorkspaceSlug, invalidModel);

      const input = {
        workspaceSlug: 'default' as WorkspaceSlug,
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.totalModels).toBe(1);
      expect(result.validModels).toBe(0);
      expect(result.invalidModels).toBe(1);
      expect(result.results[0].isValid).toBe(false);
      expect(result.results[0].errors.length).toBeGreaterThan(0);
    });

    it('should detect invalid model type', async () => {
      // Arrange
      workspaceRepository.addWorkspace('default' as WorkspaceSlug);

      const invalidModel = {
        slug: 'bad-type' as ContentModelSlug,
        modelType: 'invalid-type',
      };

      contentModelRepository.addModel('default' as WorkspaceSlug, invalidModel);

      const input = {
        workspaceSlug: 'default' as WorkspaceSlug,
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.totalModels).toBe(1);
      expect(result.validModels).toBe(0);
      expect(result.invalidModels).toBe(1);
      expect(result.results[0].errors.some(e => e.includes('Invalid model type'))).toBe(true);
    });

    it('should report specific validation errors for each invalid field', async () => {
      // Arrange
      workspaceRepository.addWorkspace('default' as WorkspaceSlug);

      const now = new Date();
      const invalidModel = {
        slug: 'test' as ContentModelSlug,
        label: '', // Empty label - should fail validation
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

      contentModelRepository.addModel('default' as WorkspaceSlug, invalidModel);

      const input = {
        workspaceSlug: 'default' as WorkspaceSlug,
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.invalidModels).toBe(1);
      expect(result.results[0].errors.length).toBeGreaterThan(0);
    });
  });

  describe('execute - Mixed Valid and Invalid', () => {
    it('should correctly categorize mix of valid and invalid models', async () => {
      // Arrange
      workspaceRepository.addWorkspace('default' as WorkspaceSlug);

      const now = new Date();

      // Valid model
      const validModel: ListContentModel = {
        slug: 'valid' as ContentModelSlug,
        label: 'Valid Model',
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

      // Invalid model
      const invalidModel = {
        slug: 'invalid' as ContentModelSlug,
        modelType: 'list',
        // Missing required fields
      };

      contentModelRepository.addModel('default' as WorkspaceSlug, validModel);
      contentModelRepository.addModel('default' as WorkspaceSlug, invalidModel);

      const input = {
        workspaceSlug: 'default' as WorkspaceSlug,
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.totalModels).toBe(2);
      expect(result.validModels).toBe(1);
      expect(result.invalidModels).toBe(1);

      const validResult = result.results.find(r => r.slug === 'valid');
      const invalidResult = result.results.find(r => r.slug === 'invalid');

      expect(validResult?.isValid).toBe(true);
      expect(invalidResult?.isValid).toBe(false);
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
      expect(result).toHaveProperty('totalModels');
      expect(result).toHaveProperty('validModels');
      expect(result).toHaveProperty('invalidModels');
      expect(result).toHaveProperty('results');
      expect(result.results[0]).toHaveProperty('slug');
      expect(result.results[0]).toHaveProperty('modelType');
      expect(result.results[0]).toHaveProperty('isValid');
      expect(result.results[0]).toHaveProperty('errors');
    });
  });
});
