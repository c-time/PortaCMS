
import { z } from 'zod';

export const WorkspaceId = z.uuid().brand<'WorkspaceId'>();
export const ContentItemId = z.uuid().brand<'ContentItemId'>();
export const JobId = z.uuid().brand<'JobId'>();
export const UserId = z.uuid().brand<'UserId'>();
export const FieldGroupId = z.uuid().brand<'FieldGroupId'>();