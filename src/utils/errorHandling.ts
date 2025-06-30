// Standalone error handling utilities
// NO DEPENDENCIES on hooks, components, or React
// Safe for import anywhere in the application

import { 
  AppError, 
  ErrorType, 
  ErrorSeverity, 
  RetryConfig, 
  RetryFunction 
} from '@/types/errors';
import { getUserMessage } from './errorMessages';

// Default retry configuration
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2
};

// Error classification utilities
export function classifyError(error: unknown): AppError {
  const timestamp = new Date();
  
  // Handle different error types
  if (error instanceof Error) {
    return classifyJavaScriptError(error, timestamp);
  }
  
  if (typeof error === 'string') {
    return createAppError(ErrorType.UNKNOWN_ERROR, error, timestamp);
  }
  
  if (typeof error === 'object' && error !== null) {
    return classifyObjectError(error as Record<string, unknown>, timestamp);
  }
  
  return createAppError(
    ErrorType.UNKNOWN_ERROR,
    'An unexpected error occurred',
    timestamp
  );
}

// Classify JavaScript Error objects
function classifyJavaScriptError(error: Error, timestamp: Date): AppError {
  const message = error.message.toLowerCase();
  
  // Network errors
  if (message.includes('network') || message.includes('fetch')) {
    return createAppError(ErrorType.NETWORK_ERROR, error.message, timestamp, true);
  }
  
  // Timeout errors
  if (message.includes('timeout') || message.includes('aborted')) {
    return createAppError(ErrorType.TIMEOUT_ERROR, error.message, timestamp, true);
  }
  
  // Auth errors
  if (message.includes('unauthorized') || message.includes('auth')) {
    return createAppError(ErrorType.AUTH_ERROR, error.message, timestamp, false);
  }
  
  // Default to unknown error
  return createAppError(ErrorType.UNKNOWN_ERROR, error.message, timestamp, true);
}

// Classify object-based errors (like from APIs)
function classifyObjectError(error: Record<string, unknown>, timestamp: Date): AppError {
  const { code, message, status, statusCode } = error;
  
  // HTTP status code classification
  const statusNum = status || statusCode;
  if (typeof statusNum === 'number') {
    return classifyHttpError(statusNum, message || 'HTTP error', timestamp);
  }
  
  // Supabase error classification
  if (code && typeof code === 'string') {
    return classifySupabaseError(code, message || 'Database error', timestamp);
  }
  
  // Generic object error
  return createAppError(
    ErrorType.UNKNOWN_ERROR,
    message || 'Unknown error occurred',
    timestamp
  );
}

// Classify HTTP status codes
function classifyHttpError(status: number, message: string, timestamp: Date): AppError {
  if (status >= 400 && status < 500) {
    if (status === 401) {
      return createAppError(ErrorType.UNAUTHORIZED, message, timestamp, false);
    }
    if (status === 404) {
      return createAppError(ErrorType.NOT_FOUND, message, timestamp, false);
    }
    return createAppError(ErrorType.CLIENT_ERROR, message, timestamp, false);
  }
  
  if (status >= 500) {
    return createAppError(ErrorType.SERVER_ERROR, message, timestamp, true);
  }
  
  return createAppError(ErrorType.API_ERROR, message, timestamp, true);
}

// Classify Supabase error codes
function classifySupabaseError(code: string, message: string, timestamp: Date): AppError {
  switch (code) {
    case 'PGRST116': // No rows returned
      return createAppError(ErrorType.NOT_FOUND, message, timestamp, false);
    
    case 'PGRST202': // Constraint violation
      return createAppError(ErrorType.CONSTRAINT_ERROR, message, timestamp, false);
    
    case 'PGRST301': // JWT expired
      return createAppError(ErrorType.SESSION_EXPIRED, message, timestamp, false);
    
    case 'PGRST302': // JWT invalid
      return createAppError(ErrorType.AUTH_ERROR, message, timestamp, false);
    
    default:
      return createAppError(ErrorType.DATABASE_ERROR, message, timestamp, true);
  }
}

// Create standardized AppError
function createAppError(
  type: ErrorType, 
  message: string, 
  timestamp: Date,
  retryable: boolean = false,
  severity: ErrorSeverity = ErrorSeverity.MEDIUM
): AppError {
  return {
    type,
    severity,
    message,
    userMessage: getUserMessage(type),
    timestamp,
    retryable,
    maxRetries: retryable ? DEFAULT_RETRY_CONFIG.maxRetries : 0
  };
}

// Retry logic with exponential backoff
export async function retryOperation<T>(
  operation: RetryFunction,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  const finalConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
  let lastError: unknown;
  
  for (let attempt = 0; attempt <= finalConfig.maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      // Don't retry on last attempt
      if (attempt === finalConfig.maxRetries) {
        break;
      }
      
      // Don't retry non-retryable errors
      const appError = classifyError(error);
      if (!appError.retryable) {
        throw error;
      }
      
      // Calculate delay with exponential backoff
      const delay = Math.min(
        finalConfig.initialDelay * Math.pow(finalConfig.backoffMultiplier, attempt),
        finalConfig.maxDelay
      );
      
      await sleep(delay);
    }
  }
  
  throw lastError;
}

// Sleep utility for retry delays
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Error logging utility
export function logError(error: AppError, context?: string): void {
  const logLevel = getLogLevel(error.severity);
  const contextInfo = context ? ` [${context}]` : '';
  
  console[logLevel](`Error${contextInfo}:`, {
    type: error.type,
    severity: error.severity,
    message: error.message,
    timestamp: error.timestamp,
    details: error.details
  });
}

// Get appropriate console log level
function getLogLevel(severity: ErrorSeverity): 'error' | 'warn' | 'info' {
  switch (severity) {
    case ErrorSeverity.CRITICAL:
    case ErrorSeverity.HIGH:
      return 'error';
    case ErrorSeverity.MEDIUM:
      return 'warn';
    case ErrorSeverity.LOW:
      return 'info';
    default:
      return 'error';
  }
}

// Check if error should trigger user notification
export function shouldNotifyUser(error: AppError): boolean {
  return error.severity !== ErrorSeverity.LOW;
}

// Check if error should trigger retry
export function shouldRetry(error: AppError, currentRetries: number): boolean {
  return error.retryable && currentRetries < (error.maxRetries || 0);
}

// Error comparison utilities
export function isSameErrorType(error1: AppError, error2: AppError): boolean {
  return error1.type === error2.type;
}

export function isAuthError(error: AppError): boolean {
  return [
    ErrorType.AUTH_ERROR,
    ErrorType.UNAUTHORIZED,
    ErrorType.SESSION_EXPIRED
  ].includes(error.type);
}

export function isNetworkError(error: AppError): boolean {
  return [
    ErrorType.NETWORK_ERROR,
    ErrorType.TIMEOUT_ERROR,
    ErrorType.API_ERROR
  ].includes(error.type);
}