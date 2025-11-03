/**
 * Local file-based implementation of ContentModelRepository
 * Stores content models per workspace in the content-models directory
 * File structure: content-models/{workspaceSlug}/{contentModelSlug}.json
 */

import type { ContentModelRepository } from '../../application/ports/ContentModelRepository.js';
import type {
  ContentModel,
  ListContentModel,
  ObjectContentModel,
} from '../../domain/content-model/entities.js';
import type { ContentModelSlug, WorkspaceSlug } from '../../domain/shared/entities.js';
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
  private readonly config: LocalStorageConfig;
  private readonly contentModelsDir: string;

  constructor(config: Partial<LocalStorageConfig> = {}) {
    this.config = { ...DEFAULT_LOCAL_STORAGE_CONFIG, ...config };
    this.contentModelsDir = buildPath(this.config.baseDir, LOCAL_STORAGE_PATHS.CONTENT_MODELS);
  }

  private getWorkspaceDir(workspaceSlug: WorkspaceSlug): string {
    return buildPath(this.contentModelsDir, workspaceSlug);
  }

  private getContentModelFilePath(workspaceSlug: WorkspaceSlug, slug: ContentModelSlug): string {
    return buildPath(this.getWorkspaceDir(workspaceSlug), `${slug}.json`);
  }

  async findBySlug(
    workspaceSlug: WorkspaceSlug,
    slug: ContentModelSlug
  ): Promise<ContentModel | null> {
    const filePath = this.getContentModelFilePath(workspaceSlug, slug);
    const data = await readJsonFile<unknown>(filePath);

    if (!data) {
      return null;
    }

    const dateFields = getContentModelDateFields(data);
    return convertDates(data, dateFields) as ContentModel;
  }

  async findAll(workspaceSlug: WorkspaceSlug): Promise<ContentModel[]> {
    const workspaceDir = this.getWorkspaceDir(workspaceSlug);

    if (this.config.autoCreateDirectories) {
      await ensureDirectory(workspaceDir);
    }

    const files = await listFiles(workspaceDir);
    const contentModels: ContentModel[] = [];

    for (const file of files) {
      if (file.endsWith('.json')) {
        const filePath = buildPath(workspaceDir, file);
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
    const filePath = this.getContentModelFilePath(workspaceSlug, contentModel.slug);
    const serialized = serialize(contentModel);
    await writeJsonFile(filePath, serialized, this.config);
  }

  async delete(workspaceSlug: WorkspaceSlug, slug: ContentModelSlug): Promise<void> {
    const filePath = this.getContentModelFilePath(workspaceSlug, slug);
    await deleteFile(filePath);
  }

  async exists(workspaceSlug: WorkspaceSlug, slug: ContentModelSlug): Promise<boolean> {
    const filePath = this.getContentModelFilePath(workspaceSlug, slug);
    return await fileExists(filePath);
  }
}
