// Error type definitions for comprehensive error handling
// NO DEPENDENCIES - Safe for import anywhere

export enum ErrorType {
  // Network & API Errors
  NETWORK_ERROR = 'NETWORK_ERROR',
  API_ERROR = 'API_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  
  // Authentication Errors  
  AUTH_ERROR = 'AUTH_ERROR',
  UNAUTHORIZED = 'UNAUTHORIZED',
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  
  // Database Errors
  DATABASE_ERROR = 'DATABASE_ERROR',
  CONSTRAINT_ERROR = 'CONSTRAINT_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  
  // Validation Errors
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  MISSING_REQUIRED = 'MISSING_REQUIRED',
  
  // Application Errors
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
  CLIENT_ERROR = 'CLIENT_ERROR',
  SERVER_ERROR = 'SERVER_ERROR'
}

export enum ErrorSeverity {
  LOW = 'LOW',         // Non-blocking, can continue
  MEDIUM = 'MEDIUM',   // Some functionality affected
  HIGH = 'HIGH',       // Major functionality broken
  CRITICAL = 'CRITICAL' // App unusable
}

export interface AppError {
  type: ErrorType;
  severity: ErrorSeverity;
  message: string;
  userMessage: string;
  code?: string | number;
  details?: Record<string, unknown>;
  timestamp: Date;
  retryable: boolean;
  maxRetries?: number;
}

export interface ErrorState {
  hasError: boolean;
  error: AppError | null;
  isRetrying: boolean;
  retryCount: number;
}

export interface RetryConfig {
  maxRetries: number;
  initialDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

// Utility types for error handling
export type ErrorHandler = (error: AppError) => void;
export type RetryFunction = () => Promise<unknown>;
export type ErrorRecovery = () => void;