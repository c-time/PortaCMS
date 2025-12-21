import { describe, it, expect, beforeEach } from 'vitest';
import { CreateContentModelUseCase, WorkspaceNotFoundError, ContentModelAlreadyExistsError } from '../CreateContentModelUseCase.js';
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
    return Array.from(this.models.values()).filter(
      model => this.models.has(this.getKey(workspaceSlug, model.slug))
    );
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
  clear(): void {
    this.models.clear();
  }
}

// ========================================
// Tests
// ========================================

describe('CreateContentModelUseCase', () => {
  let useCase: CreateContentModelUseCase;
  let workspaceRepository: MockWorkspaceRepository;
  let contentModelRepository: MockContentModelRepository;

  beforeEach(() => {
    workspaceRepository = new MockWorkspaceRepository();
    contentModelRepository = new MockContentModelRepository();
    useCase = new CreateContentModelUseCase(workspaceRepository, contentModelRepository);
  });

  describe('execute - List Content Model', () => {
    it('should create a new list content model successfully', async () => {
      // Arrange
      workspaceRepository.addWorkspace('default' as WorkspaceSlug);
      const input = {
        workspaceSlug: 'default' as WorkspaceSlug,
        slug: 'blog-posts' as ContentModelSlug,
        label: 'Blog Posts',
        modelType: 'list' as const,
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.contentModel.slug).toBe('blog-posts');
      expect(result.contentModel.label).toBe('Blog Posts');
      expect(result.contentModel.modelType).toBe('list');
      expect(result.contentModel.isActive).toBe(true);
    });

    it('should save the list content model to the repository', async () => {
      // Arrange
      workspaceRepository.addWorkspace('default' as WorkspaceSlug);
      const input = {
        workspaceSlug: 'default' as WorkspaceSlug,
        slug: 'news' as ContentModelSlug,
        label: 'News Articles',
        modelType: 'list' as const,
        description: 'Latest news articles',
      };

      // Act
      await useCase.execute(input);

      // Assert
      const savedModel = await contentModelRepository.findBySlug(
        'default' as WorkspaceSlug,
        'news' as ContentModelSlug
      );
      expect(savedModel).not.toBeNull();
      expect(savedModel?.slug).toBe('news');
      expect(savedModel?.label).toBe('News Articles');
      expect(savedModel?.description).toBe('Latest news articles');
      expect(savedModel?.modelType).toBe('list');
    });

    it('should include list-specific fields', async () => {
      // Arrange
      workspaceRepository.addWorkspace('default' as WorkspaceSlug);
      const input = {
        workspaceSlug: 'default' as WorkspaceSlug,
        slug: 'products' as ContentModelSlug,
        label: 'Products',
        modelType: 'list' as const,
        enableCategories: true,
        enablePublishScheduling: true,
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      const savedModel = await contentModelRepository.findBySlug(
        'default' as WorkspaceSlug,
        'products' as ContentModelSlug
      ) as ListContentModel;

      expect(savedModel).not.toBeNull();
      expect(savedModel.modelType).toBe('list');
      expect(savedModel.enableCategories).toBe(true);
      expect(savedModel.enablePublishScheduling).toBe(true);
      expect(savedModel.contentListViewStructure).toEqual([]);
    });
  });

  describe('execute - Object Content Model', () => {
    it('should create a new object content model successfully', async () => {
      // Arrange
      workspaceRepository.addWorkspace('default' as WorkspaceSlug);
      const input = {
        workspaceSlug: 'default' as WorkspaceSlug,
        slug: 'site-settings' as ContentModelSlug,
        label: 'Site Settings',
        modelType: 'object' as const,
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.contentModel.slug).toBe('site-settings');
      expect(result.contentModel.label).toBe('Site Settings');
      expect(result.contentModel.modelType).toBe('object');
      expect(result.contentModel.isActive).toBe(true);
    });

    it('should save the object content model to the repository', async () => {
      // Arrange
      workspaceRepository.addWorkspace('default' as WorkspaceSlug);
      const input = {
        workspaceSlug: 'default' as WorkspaceSlug,
        slug: 'homepage' as ContentModelSlug,
        label: 'Homepage',
        modelType: 'object' as const,
        description: 'Homepage content',
      };

      // Act
      await useCase.execute(input);

      // Assert
      const savedModel = await contentModelRepository.findBySlug(
        'default' as WorkspaceSlug,
        'homepage' as ContentModelSlug
      );
      expect(savedModel).not.toBeNull();
      expect(savedModel?.slug).toBe('homepage');
      expect(savedModel?.label).toBe('Homepage');
      expect(savedModel?.description).toBe('Homepage content');
      expect(savedModel?.modelType).toBe('object');
    });

    it('should not include list-specific fields for object type', async () => {
      // Arrange
      workspaceRepository.addWorkspace('default' as WorkspaceSlug);
      const input = {
        workspaceSlug: 'default' as WorkspaceSlug,
        slug: 'footer' as ContentModelSlug,
        label: 'Footer',
        modelType: 'object' as const,
      };

      // Act
      await useCase.execute(input);

      // Assert
      const savedModel = await contentModelRepository.findBySlug(
        'default' as WorkspaceSlug,
        'footer' as ContentModelSlug
      ) as ObjectContentModel;

      expect(savedModel).not.toBeNull();
      expect(savedModel.modelType).toBe('object');
      expect(savedModel).not.toHaveProperty('enableCategories');
      expect(savedModel).not.toHaveProperty('contentListViewStructure');
    });
  });

  describe('execute - Optional Parameters', () => {
    it('should handle optional description parameter', async () => {
      // Arrange
      workspaceRepository.addWorkspace('default' as WorkspaceSlug);
      const input = {
        workspaceSlug: 'default' as WorkspaceSlug,
        slug: 'test' as ContentModelSlug,
        label: 'Test',
        modelType: 'list' as const,
        description: 'Test description',
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.contentModel.description).toBe('Test description');
    });

    it('should handle optional documentUrl parameter', async () => {
      // Arrange
      workspaceRepository.addWorkspace('default' as WorkspaceSlug);
      const input = {
        workspaceSlug: 'default' as WorkspaceSlug,
        slug: 'test' as ContentModelSlug,
        label: 'Test',
        modelType: 'list' as const,
        documentUrl: 'https://docs.example.com/test',
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.contentModel.documentUrl).toBe('https://docs.example.com/test');
    });

    it('should handle optional orderValue parameter', async () => {
      // Arrange
      workspaceRepository.addWorkspace('default' as WorkspaceSlug);
      const input = {
        workspaceSlug: 'default' as WorkspaceSlug,
        slug: 'test' as ContentModelSlug,
        label: 'Test',
        modelType: 'list' as const,
        orderValue: 10,
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.contentModel.orderValue).toBe(10);
    });
  });

  describe('execute - Error Cases', () => {
    it('should throw WorkspaceNotFoundError when workspace does not exist', async () => {
      // Arrange
      const input = {
        workspaceSlug: 'nonexistent' as WorkspaceSlug,
        slug: 'blog-posts' as ContentModelSlug,
        label: 'Blog Posts',
        modelType: 'list' as const,
      };

      // Act & Assert
      await expect(useCase.execute(input)).rejects.toThrow(WorkspaceNotFoundError);
      await expect(useCase.execute(input)).rejects.toThrow(
        "Workspace with slug 'nonexistent' not found."
      );
    });

    it('should throw ContentModelAlreadyExistsError when content model already exists', async () => {
      // Arrange
      workspaceRepository.addWorkspace('default' as WorkspaceSlug);
      const slug = 'blog-posts' as ContentModelSlug;

      // Create initial content model
      await useCase.execute({
        workspaceSlug: 'default' as WorkspaceSlug,
        slug,
        label: 'Blog Posts',
        modelType: 'list' as const,
      });

      const input = {
        workspaceSlug: 'default' as WorkspaceSlug,
        slug,
        label: 'Duplicate Blog Posts',
        modelType: 'list' as const,
      };

      // Act & Assert
      await expect(useCase.execute(input)).rejects.toThrow(ContentModelAlreadyExistsError);
      await expect(useCase.execute(input)).rejects.toThrow(
        "Content model with slug 'blog-posts' already exists."
      );
    });

    it('should validate input schema - empty slug', async () => {
      // Arrange
      const invalidInput = {
        workspaceSlug: 'default' as WorkspaceSlug,
        slug: '' as any,
        label: 'Test',
        modelType: 'list' as const,
      };

      // Act & Assert
      await expect(useCase.execute(invalidInput)).rejects.toThrow();
    });

    it('should validate input schema - empty label', async () => {
      // Arrange
      const invalidInput = {
        workspaceSlug: 'default' as WorkspaceSlug,
        slug: 'test' as ContentModelSlug,
        label: '',
        modelType: 'list' as const,
      };

      // Act & Assert
      await expect(useCase.execute(invalidInput)).rejects.toThrow('Label is required');
    });

    it('should validate input schema - invalid model type', async () => {
      // Arrange
      const invalidInput = {
        workspaceSlug: 'default' as WorkspaceSlug,
        slug: 'test' as ContentModelSlug,
        label: 'Test',
        modelType: 'invalid' as any,
      };

      // Act & Assert
      await expect(useCase.execute(invalidInput)).rejects.toThrow();
    });
  });

  describe('execute - Multiple Workspaces', () => {
    it('should create content models in different workspaces independently', async () => {
      // Arrange
      workspaceRepository.addWorkspace('workspace1' as WorkspaceSlug);
      workspaceRepository.addWorkspace('workspace2' as WorkspaceSlug);

      // Act
      await useCase.execute({
        workspaceSlug: 'workspace1' as WorkspaceSlug,
        slug: 'blog-posts' as ContentModelSlug,
        label: 'Workspace 1 Blog',
        modelType: 'list' as const,
      });

      await useCase.execute({
        workspaceSlug: 'workspace2' as WorkspaceSlug,
        slug: 'blog-posts' as ContentModelSlug,
        label: 'Workspace 2 Blog',
        modelType: 'list' as const,
      });

      // Assert
      const model1 = await contentModelRepository.findBySlug(
        'workspace1' as WorkspaceSlug,
        'blog-posts' as ContentModelSlug
      );
      const model2 = await contentModelRepository.findBySlug(
        'workspace2' as WorkspaceSlug,
        'blog-posts' as ContentModelSlug
      );

      expect(model1?.label).toBe('Workspace 1 Blog');
      expect(model2?.label).toBe('Workspace 2 Blog');
    });
  });

  describe('execute - Output Validation', () => {
    it('should return validated output', async () => {
      // Arrange
      workspaceRepository.addWorkspace('default' as WorkspaceSlug);
      const input = {
        workspaceSlug: 'default' as WorkspaceSlug,
        slug: 'test' as ContentModelSlug,
        label: 'Test Model',
        modelType: 'list' as const,
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result).toHaveProperty('contentModel');
      expect(result.contentModel).toHaveProperty('slug');
      expect(result.contentModel).toHaveProperty('label');
      expect(result.contentModel).toHaveProperty('modelType');
      expect(result.contentModel).toHaveProperty('isActive');
      expect(result.contentModel).toHaveProperty('enablePublishScheduling');
      expect(result.contentModel).toHaveProperty('orderValue');
    });
  });
});
