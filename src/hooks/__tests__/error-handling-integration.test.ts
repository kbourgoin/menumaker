// Integration test for error handling enhancements
// Verifies that enhanced hooks integrate properly with error utilities

import { vi, beforeEach, afterEach, describe, test, expect } from 'vitest';
import { classifyError, logError, retryOperation } from '@/utils/errorHandling';
import { ErrorType, ErrorSeverity } from '@/types/errors';
import { getUserMessage } from '@/utils/errorMessages';

// Mock console to avoid noise
beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'info').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('Error Handling Integration', () => {
  test('error classification works for common database scenarios', () => {
    // Test Supabase auth errors
    const authError = { code: 'PGRST301', message: 'JWT expired' };
    const classifiedAuth = classifyError(authError);
    
    expect(classifiedAuth.type).toBe(ErrorType.SESSION_EXPIRED);
    expect(classifiedAuth.retryable).toBe(false);
    expect(classifiedAuth.userMessage).toContain('session has expired');

    // Test constraint errors
    const constraintError = { code: 'PGRST202', message: 'Constraint violation' };
    const classifiedConstraint = classifyError(constraintError);
    
    expect(classifiedConstraint.type).toBe(ErrorType.CONSTRAINT_ERROR);
    expect(classifiedConstraint.retryable).toBe(false);

    // Test network errors
    const networkError = new Error('Network request failed');
    const classifiedNetwork = classifyError(networkError);
    
    expect(classifiedNetwork.type).toBe(ErrorType.NETWORK_ERROR);
    expect(classifiedNetwork.retryable).toBe(true);
  });

  test('retry operation works with different error types', async () => {
    let attempts = 0;

    // Test retryable operation
    const retryableOperation = async () => {
      attempts++;
      if (attempts < 3) {
        throw new Error('Network request failed');
      }
      return 'success';
    };

    const result = await retryOperation(retryableOperation, {
      maxRetries: 3,
      initialDelay: 10
    });

    expect(result).toBe('success');
    expect(attempts).toBe(3);

    // Reset for non-retryable test
    attempts = 0;
    const nonRetryableOperation = async () => {
      attempts++;
      throw new Error('Unauthorized access');
    };

    await expect(retryOperation(nonRetryableOperation, {
      maxRetries: 3,
      initialDelay: 10
    })).rejects.toThrow('Unauthorized access');

    expect(attempts).toBe(1); // Should not retry auth errors
  });

  test('error logging provides structured output', () => {
    const testError = {
      type: ErrorType.DATABASE_ERROR,
      severity: ErrorSeverity.HIGH,
      message: 'Database connection failed',
      userMessage: 'Database error occurred',
      timestamp: new Date(),
      retryable: true
    };

    logError(testError, 'test-context');

    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining('test-context'),
      expect.objectContaining({
        type: ErrorType.DATABASE_ERROR,
        severity: ErrorSeverity.HIGH
      })
    );
  });

  test('user messages are appropriate for different error types', () => {
    const errorTypes = [
      ErrorType.NETWORK_ERROR,
      ErrorType.AUTH_ERROR,
      ErrorType.DATABASE_ERROR,
      ErrorType.VALIDATION_ERROR,
      ErrorType.NOT_FOUND
    ];

    errorTypes.forEach(errorType => {
      const message = getUserMessage(errorType);
      
      expect(message).toBeTruthy();
      expect(message.length).toBeGreaterThan(10);
      expect(message).not.toContain('undefined');
      expect(message).not.toContain('null');
    });
  });

  test('enhanced hooks pattern can be imported without circular dependencies', async () => {
    // This test verifies that our enhanced hooks can import error utilities
    // without creating circular dependencies

    try {
      // These imports should work without issues
      const { classifyError: importedClassify } = await import('@/utils/errorHandling');
      const { ErrorType: importedErrorType } = await import('@/types/errors');
      const { getUserMessage: importedGetMessage } = await import('@/utils/errorMessages');

      expect(importedClassify).toBeDefined();
      expect(importedErrorType).toBeDefined();
      expect(importedGetMessage).toBeDefined();

      // Test that they work
      const testError = new Error('Test error');
      const classified = importedClassify(testError);
      const message = importedGetMessage(classified.type);

      expect(classified.type).toBeDefined();
      expect(message).toBeTruthy();

    } catch (error) {
      throw new Error(`Circular dependency detected: ${error}`);
    }
  });

  test('error handling patterns are consistent', () => {
    // Test that all error types have consistent properties
    const testErrors = [
      new Error('Network failure'),
      { code: 'PGRST301', message: 'JWT expired' },
      { status: 404, message: 'Not found' },
      { code: '23505', message: 'Unique constraint' },
      'String error'
    ];

    testErrors.forEach(error => {
      const classified = classifyError(error);

      // All classified errors should have these properties
      expect(classified.type).toBeDefined();
      expect(classified.severity).toBeDefined();
      expect(classified.message).toBeTruthy();
      expect(classified.userMessage).toBeTruthy();
      expect(classified.timestamp).toBeInstanceOf(Date);
      expect(typeof classified.retryable).toBe('boolean');
    });
  });

  test('hook error states can be properly typed', () => {
    // This test ensures our enhanced hook return types work correctly
    type MockHookReturn = {
      data: unknown[];
      isLoading: boolean;
      error: ReturnType<typeof classifyError> | null;
      isAddingItem: boolean;
      addItemError: ReturnType<typeof classifyError> | null;
    };

    const mockHookReturn: MockHookReturn = {
      data: [],
      isLoading: false,
      error: null,
      isAddingItem: false,
      addItemError: null
    };

    // Should be able to assign classified errors
    const testError = classifyError(new Error('Test'));
    mockHookReturn.error = testError;
    mockHookReturn.addItemError = testError;

    expect(mockHookReturn.error?.type).toBeDefined();
    expect(mockHookReturn.addItemError?.type).toBeDefined();
  });

  test('error boundaries can handle classified errors', () => {
    // Test that our error classification works with React Error Boundaries
    const javascriptError = new Error('Component render error');
    const classified = classifyError(javascriptError);

    expect(classified.type).toBe(ErrorType.UNKNOWN_ERROR);
    expect(classified.severity).toBe(ErrorSeverity.MEDIUM);
    expect(classified.userMessage).toContain('unexpected error');
  });
});

// Test the error handling flow that hooks would use
describe('Hook Error Handling Flow', () => {
  test('simulates complete error handling flow', async () => {
    // Simulate what an enhanced hook would do
    const simulateHookOperation = async (shouldFail: boolean) => {
      try {
        if (shouldFail) {
          throw new Error('Network request failed');
        }
        return { data: 'success' };
      } catch (error) {
        const appError = classifyError(error);
        logError(appError, 'test-hook:operation');
        
        // Return error state instead of throwing
        return { error: appError };
      }
    };

    // Test successful operation
    const success = await simulateHookOperation(false);
    expect(success.data).toBe('success');

    // Test failed operation
    const failure = await simulateHookOperation(true);
    expect(failure.error?.type).toBe(ErrorType.NETWORK_ERROR);
    // Network errors are MEDIUM severity, so they log as warnings
    expect(console.warn).toHaveBeenCalled();
  });

  test('simulates retry flow for hooks', async () => {
    let attempts = 0;
    
    const simulateRetryableHook = async () => {
      try {
        return await retryOperation(
          async () => {
            attempts++;
            if (attempts < 2) {
              throw new Error('Network request failed');
            }
            return 'success';
          },
          { maxRetries: 2, initialDelay: 10 }
        );
      } catch (error) {
        const appError = classifyError(error);
        logError(appError, 'test-hook:retry');
        return { error: appError };
      }
    };

    const result = await simulateRetryableHook();
    expect(result).toBe('success');
    expect(attempts).toBe(2);
  });
});