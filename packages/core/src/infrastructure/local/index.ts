/**
 * Local file-based infrastructure implementation
 * Provides repositories for local development with JSON file storage
 */

export { LocalProjectRepository } from './LocalProjectRepository.js';
export { LocalWorkspaceRepository } from './LocalWorkspaceRepository.js';
export { LocalWebsiteRepository } from './LocalWebsiteRepository.js';
export { LocalContentModelRepository } from './LocalContentModelRepository.js';
export { LocalContentItemRepository } from './LocalContentItemRepository.js';

export type { LocalStorageConfig } from './types.js';
export { DEFAULT_LOCAL_STORAGE_CONFIG, LOCAL_STORAGE_PATHS } from './types.js';
