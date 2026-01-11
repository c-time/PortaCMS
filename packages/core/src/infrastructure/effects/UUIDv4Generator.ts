import { v4 as uuidv4 } from 'uuid';
import { UUIDPort } from '../../application/driven-ports/UUIDPort.js';

// ========================================
// UUID v4 Generator Implementation
// ========================================

/**
 * Concrete implementation of UUIDPort using UUID v4
 *
 * This adapter implements the UUIDPort interface defined in the application layer,
 * providing actual UUID generation functionality using the 'uuid' library.
 * This keeps side effects isolated in the infrastructure layer.
 *
 * @example
 * ```typescript
 * const uuidGenerator = new UUIDv4Generator();
 * const id = uuidGenerator.generate(); // e.g., "550e8400-e29b-41d4-a716-446655440000"
 * ```
 */
export class UUIDv4Generator implements UUIDPort {
  /**
   * Generates a new UUID v4 string
   * @returns A UUID v4 string
   */
  generate(): string {
    return uuidv4();
  }
}
