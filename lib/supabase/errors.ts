export enum DatabaseErrorType {
  AUTHENTICATION = 'AUTHENTICATION',
  CONNECTION = 'CONNECTION',
  VALIDATION = 'VALIDATION',
  NOT_FOUND = 'NOT_FOUND',
  OPERATION_FAILED = 'OPERATION_FAILED',
  QUERY_FAILED = 'QUERY_FAILED',
  UNKNOWN = 'UNKNOWN'
}

export class DatabaseError extends Error {
  constructor(
    public type: DatabaseErrorType,
    message: string,
    public originalError?: any
  ) {
    super(message);
    this.name = 'DatabaseError';
  }
} 