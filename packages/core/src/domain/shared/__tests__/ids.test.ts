import { describe, it, expect } from 'vitest';
import { WorkspaceId, ContentItemId } from '../ids.js';

describe('WorkspaceId', () => {
  it('should accept valid UUID', () => {
    const validUuid = '550e8400-e29b-41d4-a716-446655440000';
    const result = WorkspaceId.safeParse(validUuid);
    expect(result.success).toBe(true);
  });

  it('should reject invalid UUID', () => {
    const invalidUuid = 'not-a-uuid';
    const result = WorkspaceId.safeParse(invalidUuid);
    expect(result.success).toBe(false);
  });

  it('should reject non-string values', () => {
    const result = WorkspaceId.safeParse(12345);
    expect(result.success).toBe(false);
  });
});

describe('ContentItemId', () => {
  it('should accept valid UUID', () => {
    const validUuid = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';
    const result = ContentItemId.safeParse(validUuid);
    expect(result.success).toBe(true);
  });

  it('should reject invalid UUID', () => {
    const invalidUuid = 'invalid-id';
    const result = ContentItemId.safeParse(invalidUuid);
    expect(result.success).toBe(false);
  });

  it('should reject empty string', () => {
    const result = ContentItemId.safeParse('');
    expect(result.success).toBe(false);
  });
});
