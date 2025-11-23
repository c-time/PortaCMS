/**
 * Local file-based infrastructure implementation
 * Provides repositories for local development with JSON file storage
 */

export { LocalProjectRepository } from './LocalProjectRepository.js';
export { LocalWorkspaceRepository } from './LocalWorkspaceRepository.js';
export { LocalArtifactStructureRepository } from './LocalArtifactStructureRepository.js';
export { LocalContentModelRepository } from './LocalContentModelRepository.js';
export { LocalContentItemRepository } from './LocalContentItemRepository.js';

export type { LocalStorageConfig, StorageFiles } from './types.js';
