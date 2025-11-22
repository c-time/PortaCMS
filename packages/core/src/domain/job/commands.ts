import { Job } from './entities.js';

// ========================================
// Error definitions
// ========================================
export class JobAlreadyCompletedError extends Error {
  constructor() {
    super('Job is already completed.');
    this.name = 'JobAlreadyCompletedError';
  }
}

export class JobAlreadyFailedError extends Error {
  constructor() {
    super('Job has already failed.');
    this.name = 'JobAlreadyFailedError';
  }
}

export class JobAlreadyTimedOutError extends Error {
  constructor() {
    super('Job has already timed out.');
    this.name = 'JobAlreadyTimedOutError';
  }
}

export class InvalidProgressError extends Error {
  constructor(current: number, max: number) {
    super(`Invalid progress: ${current} exceeds maximum steps: ${max}`);
    this.name = 'InvalidProgressError';
  }
}

export class JobNotInProgressError extends Error {
  constructor(currentStatus: string) {
    super(`Job must be in 'in_progress' status to update progress. Current status: ${currentStatus}`);
    this.name = 'JobNotInProgressError';
  }
}

// ========================================
// Start Job Command
// ========================================
export interface StartJobParams {
  startedAt: Date;
}

export interface StartJobResult {
  nextState: Job;
  patch: Partial<Job>;
}

/**
 * Pure function: Starts a job by transitioning it to 'in_progress' status
 */
export function startJob(
  prevState: Job,
  params: StartJobParams
): StartJobResult {
  if (prevState.status === 'completed') {
    throw new JobAlreadyCompletedError();
  }
  if (prevState.status === 'failed') {
    throw new JobAlreadyFailedError();
  }
  if (prevState.status === 'timed_out') {
    throw new JobAlreadyTimedOutError();
  }

  const patch: Partial<Job> = {
    status: 'in_progress',
    updatedAt: params.startedAt,
  };

  const nextState: Job = {
    ...prevState,
    ...patch,
  };

  return { nextState, patch };
}

// ========================================
// Update Job Progress Command
// ========================================
export interface UpdateJobProgressParams {
  progress: number;
  updatedAt: Date;
}

export interface UpdateJobProgressResult {
  nextState: Job;
  patch: Partial<Job>;
}

/**
 * Pure function: Updates the progress of a job
 */
export function updateJobProgress(
  prevState: Job,
  params: UpdateJobProgressParams
): UpdateJobProgressResult {
  if (prevState.status !== 'in_progress') {
    throw new JobNotInProgressError(prevState.status);
  }

  if (params.progress > prevState.steps) {
    throw new InvalidProgressError(params.progress, prevState.steps);
  }

  if (params.progress < 0) {
    throw new Error('Progress cannot be negative');
  }

  const patch: Partial<Job> = {
    progress: params.progress,
    updatedAt: params.updatedAt,
  };

  const nextState: Job = {
    ...prevState,
    ...patch,
  };

  return { nextState, patch };
}

// ========================================
// Complete Job Command
// ========================================
export interface CompleteJobParams {
  completedAt: Date;
}

export interface CompleteJobResult {
  nextState: Job;
  patch: Partial<Job>;
}

/**
 * Pure function: Completes a job successfully
 */
export function completeJob(
  prevState: Job,
  params: CompleteJobParams
): CompleteJobResult {
  if (prevState.status === 'completed') {
    throw new JobAlreadyCompletedError();
  }

  const patch: Partial<Job> = {
    status: 'completed',
    progress: prevState.steps, // Set progress to maximum
    updatedAt: params.completedAt,
    completedAt: params.completedAt,
  };

  const nextState: Job = {
    ...prevState,
    ...patch,
  };

  return { nextState, patch };
}

// ========================================
// Fail Job Command
// ========================================
export interface FailJobParams {
  failedAt: Date;
}

export interface FailJobResult {
  nextState: Job;
  patch: Partial<Job>;
}

/**
 * Pure function: Marks a job as failed
 */
export function failJob(
  prevState: Job,
  params: FailJobParams
): FailJobResult {
  if (prevState.status === 'completed') {
    throw new JobAlreadyCompletedError();
  }
  if (prevState.status === 'failed') {
    throw new JobAlreadyFailedError();
  }

  const patch: Partial<Job> = {
    status: 'failed',
    updatedAt: params.failedAt,
    completedAt: params.failedAt,
  };

  const nextState: Job = {
    ...prevState,
    ...patch,
  };

  return { nextState, patch };
}

// ========================================
// Timeout Job Command
// ========================================
export interface TimeoutJobParams {
  timedOutAt: Date;
}

export interface TimeoutJobResult {
  nextState: Job;
  patch: Partial<Job>;
}

/**
 * Pure function: Marks a job as timed out
 */
export function timeoutJob(
  prevState: Job,
  params: TimeoutJobParams
): TimeoutJobResult {
  if (prevState.status === 'completed') {
    throw new JobAlreadyCompletedError();
  }
  if (prevState.status === 'timed_out') {
    throw new JobAlreadyTimedOutError();
  }

  const patch: Partial<Job> = {
    status: 'timed_out',
    updatedAt: params.timedOutAt,
    completedAt: params.timedOutAt,
  };

  const nextState: Job = {
    ...prevState,
    ...patch,
  };

  return { nextState, patch };
}

// ========================================
// Rename Job Command
// ========================================
export interface RenameJobParams {
  newName: string;
  updatedAt: Date;
}

export interface RenameJobResult {
  nextState: Job;
  patch: Partial<Job>;
}

/**
 * Pure function: Renames a job
 */
export function renameJob(
  prevState: Job,
  params: RenameJobParams
): RenameJobResult {
  if (!params.newName.trim()) {
    throw new Error('Job name cannot be empty');
  }

  const patch: Partial<Job> = {
    name: params.newName,
    updatedAt: params.updatedAt,
  };

  const nextState: Job = {
    ...prevState,
    ...patch,
  };

  return { nextState, patch };
}
