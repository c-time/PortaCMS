
import { z } from 'zod';

export const WorkspaceId = z.string().uuid().brand<'WorkspaceId'>();
export const ContentItemId = z.string().uuid().brand<'ContentItemId'>();