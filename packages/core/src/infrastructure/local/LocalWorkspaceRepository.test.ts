/**
 * Tests for LocalWorkspaceRepository
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'fs';
import { join } from 'path';
import { LocalWorkspaceRepository } from './LocalWorkspaceRepository.js';
import { TestStorageFiles, createTestConfig } from './test-helpers.js';
import type { Workspace } from '../../domain/workspace/entities.js';
import type { WorkspaceSlug } from '../../domain/shared/entities.js';

const TEST_BASE_DIR = join(process.cwd(), 'test-data', 'workspace-repo');

describe('LocalWorkspaceRepository', () => {
  let repository: LocalWorkspaceRepository;

  beforeEach(async () => {
    try {
      await fs.rm(TEST_BASE_DIR, { recursive: true, force: true });
    } catch {
      // Ignore if directory doesn't exist
    }

    const storageFiles = new TestStorageFiles(TEST_BASE_DIR);
    const config = createTestConfig(TEST_BASE_DIR);
    repository = new LocalWorkspaceRepository(storageFiles, config);
  });

  afterEach(async () => {
    try {
      await fs.rm(TEST_BASE_DIR, { recursive: true, force: true });
    } catch {
      // Ignore errors
    }
  });

  describe('exists', () => {
    it('should return false when workspace does not exist', async () => {
      const exists = await repository.exists('default' as WorkspaceSlug);
      expect(exists).toBe(false);
    });

    it('should return true when workspace exists', async () => {
      const workspace: Workspace = {
        slug: 'default' as WorkspaceSlug,
      };

      await repository.save(workspace);
      const exists = await repository.exists('default' as WorkspaceSlug);
      expect(exists).toBe(true);
    });
  });

  describe('findBySlug', () => {
    it('should return null when workspace does not exist', async () => {
      const workspace = await repository.findBySlug('default' as WorkspaceSlug);
      expect(workspace).toBeNull();
    });

    it('should return workspace when it exists', async () => {
      const workspace: Workspace = {
        slug: 'production' as WorkspaceSlug,
      };

      await repository.save(workspace);
      const retrieved = await repository.findBySlug('production' as WorkspaceSlug);
      expect(retrieved).toEqual(workspace);
    });
  });

  describe('findAll', () => {
    it('should return empty array when no workspaces exist', async () => {
      const workspaces = await repository.findAll();
      expect(workspaces).toEqual([]);
    });

    it('should return all workspaces', async () => {
      const workspace1: Workspace = {
        slug: 'default' as WorkspaceSlug,
      };
      const workspace2: Workspace = {
        slug: 'staging' as WorkspaceSlug,
      };

      await repository.save(workspace1);
      await repository.save(workspace2);

      const workspaces = await repository.findAll();
      expect(workspaces).toHaveLength(2);
      expect(workspaces).toContainEqual(workspace1);
      expect(workspaces).toContainEqual(workspace2);
    });
  });

  describe('save', () => {
    it('should save a new workspace', async () => {
      const workspace: Workspace = {
        slug: 'default' as WorkspaceSlug,
      };

      await repository.save(workspace);
      const retrieved = await repository.findBySlug('default' as WorkspaceSlug);
      expect(retrieved).toEqual(workspace);
    });

    it('should update an existing workspace', async () => {
      const workspace: Workspace = {
        slug: 'default' as WorkspaceSlug,
      };

      await repository.save(workspace);
      await repository.save(workspace);

      const retrieved = await repository.findBySlug('default' as WorkspaceSlug);
      expect(retrieved).toEqual(workspace);
    });
  });

  describe('delete', () => {
    it('should delete an existing workspace', async () => {
      const workspace: Workspace = {
        slug: 'default' as WorkspaceSlug,
      };

      await repository.save(workspace);
      await repository.delete('default' as WorkspaceSlug);

      const exists = await repository.exists('default' as WorkspaceSlug);
      expect(exists).toBe(false);
    });

    it('should not throw error when deleting non-existent workspace', async () => {
      await expect(
        repository.delete('non-existent' as WorkspaceSlug)
      ).resolves.not.toThrow();
    });
  });
});
