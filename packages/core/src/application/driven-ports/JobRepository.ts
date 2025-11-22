import { Job } from '../../domain/job/entities.js';

/**
 * Repository interface for Job aggregate root
 * Manages background jobs and their lifecycle in the system
 */
export interface JobRepository {
  /**
   * Finds a job by its ID
   * @param id - The unique job identifier
   * @returns The job or null if not found
   */
  findById(id: string): Promise<Job | null>;

  /**
   * Retrieves all jobs for a specific workspace
   * @param workspaceId - The workspace identifier
   * @returns Array of jobs in the workspace
   */
  findByWorkspaceId(workspaceId: string): Promise<Job[]>;

  /**
   * Retrieves all jobs for a specific user
   * @param userId - The user identifier
   * @returns Array of jobs created by the user
   */
  findByUserId(userId: string): Promise<Job[]>;

  /**
   * Retrieves all jobs with a specific status
   * @param status - The job status to filter by
   * @returns Array of jobs with the given status
   */
  findByStatus(status: Job['status']): Promise<Job[]>;

  /**
   * Retrieves all jobs for a specific workspace and status
   * @param workspaceId - The workspace identifier
   * @param status - The job status to filter by
   * @returns Array of jobs matching the criteria
   */
  findByWorkspaceIdAndStatus(
    workspaceId: string,
    status: Job['status']
  ): Promise<Job[]>;

  /**
   * Retrieves all active jobs (in_progress status) for a workspace
   * @param workspaceId - The workspace identifier
   * @returns Array of active jobs
   */
  findActiveByWorkspaceId(workspaceId: string): Promise<Job[]>;

  /**
   * Saves a new job or updates an existing one
   * @param job - The job to save
   */
  save(job: Job): Promise<void>;

  /**
   * Deletes a job by its ID
   * @param id - The ID of the job to delete
   */
  delete(id: string): Promise<void>;

  /**
   * Checks if a job with the given ID exists
   * @param id - The job ID to check
   * @returns true if exists, false otherwise
   */
  exists(id: string): Promise<boolean>;

  /**
   * Retrieves all jobs (useful for admin/monitoring)
   * @returns Array of all jobs
   */
  findAll(): Promise<Job[]>;
}
