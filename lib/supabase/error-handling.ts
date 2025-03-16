import { PostgrestError } from '@supabase/supabase-js';

export enum DatabaseErrorType {
  AUTHENTICATION = 'AUTHENTICATION',
  CONNECTION = 'CONNECTION',
  QUERY_FAILED = 'QUERY_FAILED',
  OPERATION_FAILED = 'OPERATION_FAILED',
  NOT_FOUND = 'NOT_FOUND',
  VALIDATION = 'VALIDATION',
  RATE_LIMIT = 'RATE_LIMIT',
  UNKNOWN = 'UNKNOWN'
}

export class DatabaseError extends Error {
  constructor(
    public type: DatabaseErrorType,
    message: string,
    public originalError?: PostgrestError | Error | unknown
  ) {
    super(message);
    this.name = 'DatabaseError';
  }
}

export function handleDatabaseError(error: unknown, operation: string): never {
  console.error(`Database error during ${operation}:`, error);

  if (error instanceof DatabaseError) {
    throw error;
  }

  const pgError = error as PostgrestError;
  
  // Handle authentication errors
  if (pgError.message?.includes('JWT')) {
    throw new DatabaseError(
      DatabaseErrorType.AUTHENTICATION,
      'Authentication failed - please check your credentials',
      error
    );
  }

  // Handle connection errors
  if (pgError.message?.includes('connection') || pgError.message?.includes('network')) {
    throw new DatabaseError(
      DatabaseErrorType.CONNECTION,
      'Failed to connect to database - please check your network connection',
      error
    );
  }

  // Handle rate limiting
  if (pgError.message?.includes('rate limit')) {
    throw new DatabaseError(
      DatabaseErrorType.RATE_LIMIT,
      'Too many requests - please try again later',
      error
    );
  }

  // Handle not found errors
  if (pgError.code === 'PGRST116') {
    throw new DatabaseError(
      DatabaseErrorType.NOT_FOUND,
      'Resource not found',
      error
    );
  }

  // Handle validation errors
  if (pgError.code?.startsWith('23')) {
    throw new DatabaseError(
      DatabaseErrorType.VALIDATION,
      'Invalid data provided',
      error
    );
  }

  // Handle query errors
  if (pgError.code?.startsWith('42')) {
    throw new DatabaseError(
      DatabaseErrorType.QUERY_FAILED,
      'Database query failed',
      error
    );
  }

  // Default error
  throw new DatabaseError(
    DatabaseErrorType.UNKNOWN,
    'An unexpected error occurred',
    error
  );
}

export function isNotFoundError(error: unknown): boolean {
  return (
    error instanceof DatabaseError &&
    error.type === DatabaseErrorType.NOT_FOUND
  );
}

export function isAuthenticationError(error: unknown): boolean {
  return (
    error instanceof DatabaseError &&
    error.type === DatabaseErrorType.AUTHENTICATION
  );
}

export function isRateLimitError(error: unknown): boolean {
  return (
    error instanceof DatabaseError &&
    error.type === DatabaseErrorType.RATE_LIMIT
  );
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof DatabaseError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unexpected error occurred';
} 