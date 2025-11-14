/**
 * Local file-based implementation of ContentModelRepository
 * Stores content models per workspace in the content-models directory
 * File structure: content-models/{workspaceSlug}/{contentModelSlug}.json
 */

import { join } from 'path';
import type { ContentModelRepository } from '../../application/driven-ports/ContentModelRepository.js';
import type {
  ContentModel,
  ListContentModel,
  ObjectContentModel,
} from '../../domain/content-model/entities.js';
import type { ContentModelSlug, WorkspaceSlug } from '../../domain/shared/entities.js';
import type { LocalStorageConfig, StorageFiles } from './types.js';
import {
  readJsonFile,
  writeJsonFile,
  deleteFile,
  fileExists,
  listFiles,
  ensureDirectory,
  serialize,
} from './utils.js';

/**
 * Helper function to determine the date fields based on content model type
 */
function getContentModelDateFields(data: unknown): string[] {
  const dateFields = ['createdAt', 'updatedAt'];
  const model = data as { modelType?: string };

  if (model.modelType === 'list') {
    // List content models have nested date fields in structures
    return [
      ...dateFields,
      'listContentModelStructure.contentItemStructure.createdAt',
      'listContentModelStructure.contentItemStructure.updatedAt',
      'listContentModelStructure.contentListViewStructure.*.createdAt',
      'listContentModelStructure.contentListViewStructure.*.updatedAt',
    ];
  } else if (model.modelType === 'object') {
    return [
      ...dateFields,
      'objectContentModelStructure.contentItemStructure.createdAt',
      'objectContentModelStructure.contentItemStructure.updatedAt',
    ];
  }

  return dateFields;
}

/**
 * Deep date conversion for nested structures
 */
function convertDates(obj: unknown, paths: string[]): unknown {
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }

  const result = { ...obj } as Record<string, unknown>;

  for (const path of paths) {
    const parts = path.split('.');
    let current: unknown = result;

    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (!part) continue;

      if (part === '*') {
        // Handle array iteration
        if (Array.isArray(current)) {
          const remaining = parts.slice(i + 1).join('.');
          for (let j = 0; j < current.length; j++) {
            current[j] = convertDates(current[j], [remaining]);
          }
        }
        break;
      }

      if (typeof current === 'object' && current !== null && part in current) {
        current = (current as Record<string, unknown>)[part];
      } else {
        break;
      }
    }

    // Convert the final field if we reached it
    if (typeof current === 'object' && current !== null) {
      const lastPart = parts[parts.length - 1];
      if (lastPart && lastPart !== '*' && lastPart in current) {
        const value = (current as Record<string, unknown>)[lastPart];
        if (typeof value === 'string') {
          (current as Record<string, unknown>)[lastPart] = new Date(value);
        }
      }
    }
  }

  return result;
}

export class LocalContentModelRepository implements ContentModelRepository {
  constructor(
    private readonly storageFiles: StorageFiles,
    private readonly config: LocalStorageConfig
  ) {}

  async findBySlug(
    workspaceSlug: WorkspaceSlug,
    slug: ContentModelSlug
  ): Promise<ContentModel | null> {
    const data = await readJsonFile<unknown>(
      this.storageFiles.contentModelConfigFile(workspaceSlug, slug)
    );

    if (!data) {
      return null;
    }

    const dateFields = getContentModelDateFields(data);
    return convertDates(data, dateFields) as ContentModel;
  }

  async findAll(workspaceSlug: WorkspaceSlug): Promise<ContentModel[]> {
    const contentModelsDir = this.storageFiles.contentModelsDir(workspaceSlug);

    if (this.config.autoCreateDirectories) {
      await ensureDirectory(contentModelsDir);
    }

    const files = await listFiles(contentModelsDir);
    const contentModels: ContentModel[] = [];

    for (const file of files) {
      if (file.endsWith('.json')) {
        const filePath = join(contentModelsDir, file);
        const data = await readJsonFile<unknown>(filePath);
        if (data) {
          const dateFields = getContentModelDateFields(data);
          const contentModel = convertDates(data, dateFields) as ContentModel;
          contentModels.push(contentModel);
        }
      }
    }

    return contentModels;
  }

  async findAllListModels(workspaceSlug: WorkspaceSlug): Promise<ListContentModel[]> {
    const allModels = await this.findAll(workspaceSlug);
    return allModels.filter(
      (model): model is ListContentModel => model.modelType === 'list'
    );
  }

  async findAllObjectModels(workspaceSlug: WorkspaceSlug): Promise<ObjectContentModel[]> {
    const allModels = await this.findAll(workspaceSlug);
    return allModels.filter(
      (model): model is ObjectContentModel => model.modelType === 'object'
    );
  }

  async save(workspaceSlug: WorkspaceSlug, contentModel: ContentModel): Promise<void> {
    const serialized = serialize(contentModel);
    await writeJsonFile(
      this.storageFiles.contentModelConfigFile(workspaceSlug, contentModel.slug),
      serialized,
      this.config.prettyPrint,
      this.config.autoCreateDirectories
    );
  }

  async delete(workspaceSlug: WorkspaceSlug, slug: ContentModelSlug): Promise<void> {
    await deleteFile(this.storageFiles.contentModelConfigFile(workspaceSlug, slug));
  }

  async exists(workspaceSlug: WorkspaceSlug, slug: ContentModelSlug): Promise<boolean> {
    return await fileExists(this.storageFiles.contentModelConfigFile(workspaceSlug, slug));
  }
}
