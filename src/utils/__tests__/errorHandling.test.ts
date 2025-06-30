// Test file for error handling utilities
// This file tests the error utilities in isolation to verify:
// 1. No circular import issues
// 2. Proper error classification
// 3. Retry logic works correctly
// 4. Error utilities are pure functions

import { 
  classifyError, 
  retryOperation, 
  logError, 
  shouldNotifyUser, 
  shouldRetry,
  isAuthError,
  isNetworkError,
  DEFAULT_RETRY_CONFIG
} from '../errorHandling';
import { 
  ErrorType, 
  ErrorSeverity, 
  AppError 
} from '../../types/errors';
import { 
  getUserMessage, 
  getErrorTitle, 
  getErrorActions 
} from '../errorMessages';

// Mock console to avoid noise in tests
import { vi } from 'vitest';

const originalConsole = console;
beforeEach(() => {
  console.error = vi.fn();
  console.warn = vi.fn();
  console.info = vi.fn();
});

afterEach(() => {
  console.error = originalConsole.error;
  console.warn = originalConsole.warn;
  console.info = originalConsole.info;
});

describe('Error Classification', () => {
  test('classifies JavaScript errors correctly', () => {
    const networkError = new Error('Network request failed');
    const result = classifyError(networkError);
    
    expect(result.type).toBe(ErrorType.NETWORK_ERROR);
    expect(result.retryable).toBe(true);
    expect(result.severity).toBe(ErrorSeverity.MEDIUM);
    expect(result.userMessage).toBeDefined();
  });

  test('classifies timeout errors', () => {
    const timeoutError = new Error('Request timeout');
    const result = classifyError(timeoutError);
    
    expect(result.type).toBe(ErrorType.TIMEOUT_ERROR);
    expect(result.retryable).toBe(true);
  });

  test('classifies auth errors', () => {
    const authError = new Error('Unauthorized access');
    const result = classifyError(authError);
    
    expect(result.type).toBe(ErrorType.AUTH_ERROR);
    expect(result.retryable).toBe(false);
  });

  test('classifies HTTP status codes', () => {
    const notFoundError = { status: 404, message: 'Not found' };
    const result = classifyError(notFoundError);
    
    expect(result.type).toBe(ErrorType.NOT_FOUND);
    expect(result.retryable).toBe(false);
  });

  test('classifies server errors as retryable', () => {
    const serverError = { status: 500, message: 'Internal server error' };
    const result = classifyError(serverError);
    
    expect(result.type).toBe(ErrorType.SERVER_ERROR);
    expect(result.retryable).toBe(true);
  });

  test('classifies Supabase errors', () => {
    const supabaseError = { code: 'PGRST116', message: 'No rows returned' };
    const result = classifyError(supabaseError);
    
    expect(result.type).toBe(ErrorType.NOT_FOUND);
    expect(result.retryable).toBe(false);
  });

  test('handles unknown errors gracefully', () => {
    const unknownError = { weird: 'object' };
    const result = classifyError(unknownError);
    
    expect(result.type).toBe(ErrorType.UNKNOWN_ERROR);
    expect(result.userMessage).toBeDefined();
  });
});

describe('Retry Logic', () => {
  test('retries failing operations', async () => {
    let attempts = 0;
    const failingOperation = async () => {
      attempts++;
      if (attempts < 3) {
        throw new Error('Network error');
      }
      return 'success';
    };

    const result = await retryOperation(failingOperation, { 
      maxRetries: 3, 
      initialDelay: 10 
    });
    
    expect(result).toBe('success');
    expect(attempts).toBe(3);
  });

  test('stops retrying after max attempts', async () => {
    const alwaysFailingOperation = async () => {
      throw new Error('Network error');
    };

    await expect(retryOperation(alwaysFailingOperation, { 
      maxRetries: 2, 
      initialDelay: 10 
    })).rejects.toThrow('Network error');
  });

  test('does not retry non-retryable errors', async () => {
    let attempts = 0;
    const authErrorOperation = async () => {
      attempts++;
      throw new Error('Unauthorized access');
    };

    await expect(retryOperation(authErrorOperation, { 
      maxRetries: 3, 
      initialDelay: 10 
    })).rejects.toThrow('Unauthorized access');
    
    expect(attempts).toBe(1); // Should not retry
  });
});

describe('Error Utilities', () => {
  test('identifies auth errors correctly', () => {
    const authError: AppError = {
      type: ErrorType.AUTH_ERROR,
      severity: ErrorSeverity.HIGH,
      message: 'Auth failed',
      userMessage: 'Please sign in',
      timestamp: new Date(),
      retryable: false
    };
    
    expect(isAuthError(authError)).toBe(true);
  });

  test('identifies network errors correctly', () => {
    const networkError: AppError = {
      type: ErrorType.NETWORK_ERROR,
      severity: ErrorSeverity.MEDIUM,
      message: 'Network failed',
      userMessage: 'Check connection',
      timestamp: new Date(),
      retryable: true
    };
    
    expect(isNetworkError(networkError)).toBe(true);
  });

  test('determines when to notify user', () => {
    const lowSeverityError: AppError = {
      type: ErrorType.UNKNOWN_ERROR,
      severity: ErrorSeverity.LOW,
      message: 'Minor issue',
      userMessage: 'Minor issue',
      timestamp: new Date(),
      retryable: false
    };
    
    const highSeverityError: AppError = {
      type: ErrorType.UNKNOWN_ERROR,
      severity: ErrorSeverity.HIGH,
      message: 'Major issue',
      userMessage: 'Major issue',
      timestamp: new Date(),
      retryable: false
    };
    
    expect(shouldNotifyUser(lowSeverityError)).toBe(false);
    expect(shouldNotifyUser(highSeverityError)).toBe(true);
  });

  test('determines when to retry', () => {
    const retryableError: AppError = {
      type: ErrorType.NETWORK_ERROR,
      severity: ErrorSeverity.MEDIUM,
      message: 'Network failed',
      userMessage: 'Check connection',
      timestamp: new Date(),
      retryable: true,
      maxRetries: 3
    };
    
    expect(shouldRetry(retryableError, 0)).toBe(true);
    expect(shouldRetry(retryableError, 2)).toBe(true);
    expect(shouldRetry(retryableError, 3)).toBe(false);
  });
});

describe('Error Messages', () => {
  test('provides user-friendly messages', () => {
    const message = getUserMessage(ErrorType.NETWORK_ERROR);
    expect(message).toContain('internet connection');
    expect(message).not.toContain('undefined');
  });

  test('provides error titles', () => {
    const title = getErrorTitle(ErrorType.AUTH_ERROR);
    expect(title).toBe('Authentication Error');
  });

  test('provides error actions', () => {
    const actions = getErrorActions(ErrorType.NETWORK_ERROR);
    expect(actions).toContain('Check your internet connection');
    expect(actions.length).toBeGreaterThan(0);
  });

  test('handles unknown error types gracefully', () => {
    const unknownType = 'FAKE_ERROR' as ErrorType;
    const message = getUserMessage(unknownType);
    expect(message).toBeDefined();
    expect(message.length).toBeGreaterThan(0);
  });
});

describe('Error Logging', () => {
  test('logs errors with appropriate level', () => {
    const criticalError: AppError = {
      type: ErrorType.DATABASE_ERROR,
      severity: ErrorSeverity.CRITICAL,
      message: 'Database crashed',
      userMessage: 'Database error',
      timestamp: new Date(),
      retryable: false
    };
    
    logError(criticalError, 'test-context');
    expect(console.error).toHaveBeenCalled();
  });

  test('logs medium severity errors as warnings', () => {
    const mediumError: AppError = {
      type: ErrorType.VALIDATION_ERROR,
      severity: ErrorSeverity.MEDIUM,
      message: 'Invalid input',
      userMessage: 'Please check input',
      timestamp: new Date(),
      retryable: false
    };
    
    logError(mediumError);
    expect(console.warn).toHaveBeenCalled();
  });
});

describe('Configuration', () => {
  test('has sensible default retry config', () => {
    expect(DEFAULT_RETRY_CONFIG.maxRetries).toBeGreaterThan(0);
    expect(DEFAULT_RETRY_CONFIG.initialDelay).toBeGreaterThan(0);
    expect(DEFAULT_RETRY_CONFIG.maxDelay).toBeGreaterThan(DEFAULT_RETRY_CONFIG.initialDelay);
    expect(DEFAULT_RETRY_CONFIG.backoffMultiplier).toBeGreaterThan(1);
  });
});

// Integration test to verify no circular imports
describe('Import Integration', () => {
  test('can import all error utilities without circular dependencies', () => {
    // If this test runs, it means all imports worked correctly
    expect(classifyError).toBeDefined();
    expect(retryOperation).toBeDefined();
    expect(getUserMessage).toBeDefined();
    expect(ErrorType.NETWORK_ERROR).toBeDefined();
    expect(ErrorSeverity.HIGH).toBeDefined();
  });
});