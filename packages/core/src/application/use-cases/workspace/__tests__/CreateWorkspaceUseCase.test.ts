import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CreateWorkspaceUseCase } from '../CreateWorkspaceUseCase.js';
import { WorkspaceRepository } from '../../../driven-ports/WorkspaceRepository.js';
import { ProjectRepository } from '../../../driven-ports/ProjectRepository.js';
import { Workspace } from '../../../../domain/workspace/entities.js';
import { Project } from '../../../../domain/project/entities.js';
import { WorkspaceSlug } from '../../../../domain/shared/entities.js';
import { WorkspaceAlreadyExistsError } from '../../../../domain/project/commands.js';

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
  clear(): void {
    this.workspaces.clear();
  }
}

class MockProjectRepository implements ProjectRepository {
  private project: Project | null = null;

  async get(): Promise<Project | null> {
    return this.project;
  }

  async save(project: Project): Promise<void> {
    this.project = project;
  }

  async exists(): Promise<boolean> {
    return this.project !== null;
  }

  // Helper method for testing
  clear(): void {
    this.project = null;
  }
}

// ========================================
// Tests
// ========================================

describe('CreateWorkspaceUseCase', () => {
  let useCase: CreateWorkspaceUseCase;
  let workspaceRepository: MockWorkspaceRepository;
  let projectRepository: MockProjectRepository;

  beforeEach(() => {
    workspaceRepository = new MockWorkspaceRepository();
    projectRepository = new MockProjectRepository();
    useCase = new CreateWorkspaceUseCase(workspaceRepository, projectRepository);
  });

  describe('execute', () => {
    it('should create a new workspace successfully', async () => {
      // Arrange
      const input = { slug: 'production' as WorkspaceSlug };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.workspace).toEqual({ slug: 'production' });
    });

    it('should save the workspace to the repository', async () => {
      // Arrange
      const input = { slug: 'staging' as WorkspaceSlug };

      // Act
      await useCase.execute(input);

      // Assert
      const savedWorkspace = await workspaceRepository.findBySlug('staging' as WorkspaceSlug);
      expect(savedWorkspace).toEqual({ slug: 'staging' });
    });

    it('should add the workspace to the project', async () => {
      // Arrange
      const input = { slug: 'development' as WorkspaceSlug };

      // Act
      await useCase.execute(input);

      // Assert
      const project = await projectRepository.get();
      expect(project).not.toBeNull();
      expect(project?.workspaces).toContain('development');
    });

    it('should initialize project with default workspace if project does not exist', async () => {
      // Arrange
      const input = { slug: 'production' as WorkspaceSlug };

      // Act
      await useCase.execute(input);

      // Assert
      const project = await projectRepository.get();
      expect(project).not.toBeNull();
      expect(project?.workspaces).toEqual(['default', 'production']);
    });

    it('should add workspace to existing project', async () => {
      // Arrange
      await projectRepository.save({
        workspaces: ['default' as WorkspaceSlug, 'staging' as WorkspaceSlug],
      });
      const input = { slug: 'production' as WorkspaceSlug };

      // Act
      await useCase.execute(input);

      // Assert
      const project = await projectRepository.get();
      expect(project?.workspaces).toEqual(['default', 'staging', 'production']);
    });

    it('should throw WorkspaceAlreadyExistsError when workspace already exists', async () => {
      // Arrange
      const slug = 'production' as WorkspaceSlug;
      await workspaceRepository.save({ slug });
      const input = { slug };

      // Act & Assert
      await expect(useCase.execute(input)).rejects.toThrow(WorkspaceAlreadyExistsError);
      await expect(useCase.execute(input)).rejects.toThrow(
        "Workspace with slug 'production' already exists in the project."
      );
    });

    it('should throw WorkspaceAlreadyExistsError when workspace is in project but not in repository', async () => {
      // Arrange
      await projectRepository.save({
        workspaces: ['default' as WorkspaceSlug, 'production' as WorkspaceSlug],
      });
      const input = { slug: 'production' as WorkspaceSlug };

      // Note: This is an inconsistent state, but we test the use case behavior
      // The workspace exists in the project but not in the workspace repository
      // However, our use case checks the workspace repository first
      // So it would try to create it, then fail when adding to project

      // Act & Assert
      await expect(useCase.execute(input)).rejects.toThrow(WorkspaceAlreadyExistsError);
    });

    it('should validate input schema', async () => {
      // Arrange
      const invalidInput = { slug: '' } as any;

      // Act & Assert
      await expect(useCase.execute(invalidInput)).rejects.toThrow();
    });

    it('should return validated output', async () => {
      // Arrange
      const input = { slug: 'qa' as WorkspaceSlug };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result).toHaveProperty('workspace');
      expect(result.workspace).toHaveProperty('slug');
      expect(result.workspace.slug).toBe('qa');
    });
  });
});
