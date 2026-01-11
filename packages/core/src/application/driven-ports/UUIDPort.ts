// ========================================
// UUID Generator Port (Driven Port / Secondary Port)
// ========================================

/**
 * Port for UUID generation
 *
 * This is a driven port (secondary port) in hexagonal architecture that
 * defines the contract for UUID generation. The actual implementation
 * will be provided by the infrastructure layer, keeping the application
 * layer free from side effects.
 *
 * @example
 * ```typescript
 * class UUIDv4Generator implements UUIDPort {
 *   generate(): string {
 *     return uuidv4();
 *   }
 * }
 * ```
 */
export interface UUIDPort {
  /**
   * Generates a new UUID string
   * @returns A UUID string (typically v4)
   */
  generate(): string;
}
