/**
 * Tests for LocalProjectRepository
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'fs';
import { join } from 'path';
import { LocalProjectRepository } from '../LocalProjectRepository.js';
import { TestStorageFiles, createTestConfig } from './test-helpers.js';
import type { Project } from '../../domain/workspace/entities.js';
import type { WorkspaceSlug } from '../../domain/shared/entities.js';

const TEST_BASE_DIR = join(process.cwd(), 'test-data', 'project-repo');

describe('LocalProjectRepository', () => {
  let repository: LocalProjectRepository;

  beforeEach(async () => {
    // Clean up test directory
    try {
      await fs.rm(TEST_BASE_DIR, { recursive: true, force: true });
    } catch {
      // Ignore if directory doesn't exist
    }

    const storageFiles = new TestStorageFiles(TEST_BASE_DIR);
    const config = createTestConfig(TEST_BASE_DIR);
    repository = new LocalProjectRepository(storageFiles, config);
  });

  afterEach(async () => {
    // Clean up test directory
    try {
      await fs.rm(TEST_BASE_DIR, { recursive: true, force: true });
    } catch {
      // Ignore errors
    }
  });

  describe('exists', () => {
    it('should return false when project does not exist', async () => {
      const exists = await repository.exists();
      expect(exists).toBe(false);
    });

    it('should return true when project exists', async () => {
      const project: Project = {
        workspaces: ['default' as WorkspaceSlug],
      };

      await repository.save(project);
      const exists = await repository.exists();
      expect(exists).toBe(true);
    });
  });

  describe('get', () => {
    it('should return null when project does not exist', async () => {
      const project = await repository.get();
      expect(project).toBeNull();
    });

    it('should return project when it exists', async () => {
      const project: Project = {
        workspaces: ['default' as WorkspaceSlug, 'staging' as WorkspaceSlug],
      };

      await repository.save(project);
      const retrieved = await repository.get();
      expect(retrieved).toEqual(project);
    });
  });

  describe('save', () => {
    it('should save a new project', async () => {
      const project: Project = {
        workspaces: ['default' as WorkspaceSlug],
      };

      await repository.save(project);
      const retrieved = await repository.get();
      expect(retrieved).toEqual(project);
    });

    it('should update an existing project', async () => {
      const project: Project = {
        workspaces: ['default' as WorkspaceSlug],
      };

      await repository.save(project);

      const updatedProject: Project = {
        workspaces: ['default' as WorkspaceSlug, 'production' as WorkspaceSlug],
      };

      await repository.save(updatedProject);
      const retrieved = await repository.get();
      expect(retrieved).toEqual(updatedProject);
    });
  });
});
