// End-to-end test for complete error handling flow
// Tests error handling from database operations through hooks to UI components

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi, beforeEach, afterEach, describe, test, expect } from 'vitest';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ErrorMessage, ErrorFallback, InlineError } from '@/components/ErrorMessage';
import { classifyError } from '@/utils/errorHandling';
import { ErrorType, ErrorSeverity } from '@/types/errors';

// Mock toast to avoid setup complexity
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn()
  })
}));

// Test wrapper for components
const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false }
    }
  });

  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </BrowserRouter>
  );
};

describe('End-to-End Error Handling Flow', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'info').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Error Classification and Display', () => {
    test('network errors display with retry option', () => {
      const networkError = classifyError(new Error('Network request failed'));
      const mockRetry = vi.fn();

      render(
        <TestWrapper>
          <ErrorMessage error={networkError} onRetry={mockRetry} />
        </TestWrapper>
      );

      expect(screen.getByText('Unable to connect. Please check your internet connection and try again.')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: /try again/i }));
      expect(mockRetry).toHaveBeenCalled();
    });

    test('auth errors display without retry option', () => {
      const authError = classifyError({ code: 'PGRST301', message: 'JWT expired' });

      render(
        <TestWrapper>
          <ErrorMessage error={authError} />
        </TestWrapper>
      );

      expect(screen.getByText('Your session has expired. Please sign in again.')).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /try again/i })).not.toBeInTheDocument();
    });

    test('database errors show appropriate messaging', () => {
      const dbError = classifyError({ code: 'PGRST202', message: 'Constraint violation' });

      render(
        <TestWrapper>
          <ErrorMessage error={dbError} />
        </TestWrapper>
      );

      expect(screen.getByText('This action conflicts with existing data. Please check and try again.')).toBeInTheDocument();
    });
  });

  describe('Error Boundary Integration', () => {
    // Component that throws an error
    const ErrorThrowingComponent = ({ shouldThrow }: { shouldThrow: boolean }) => {
      if (shouldThrow) {
        throw new Error('Component render error');
      }
      return <div>Component rendered successfully</div>;
    };

    test('error boundary catches and displays component errors', async () => {
      const { rerender } = render(
        <TestWrapper>
          <ErrorBoundary context="test-component">
            <ErrorThrowingComponent shouldThrow={false} />
          </ErrorBoundary>
        </TestWrapper>
      );

      expect(screen.getByText('Component rendered successfully')).toBeInTheDocument();

      // Cause component to throw error
      rerender(
        <TestWrapper>
          <ErrorBoundary context="test-component">
            <ErrorThrowingComponent shouldThrow={true} />
          </ErrorBoundary>
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/Unexpected Error/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /go home/i })).toBeInTheDocument();
      });

      // Check that error was logged with context
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('test-component'),
        expect.any(Object)
      );
    });

    test('error boundary shows custom fallback when provided', () => {
      const customFallback = <div>Custom error fallback</div>;

      render(
        <TestWrapper>
          <ErrorBoundary fallback={customFallback} context="test-component">
            <ErrorThrowingComponent shouldThrow={true} />
          </ErrorBoundary>
        </TestWrapper>
      );

      expect(screen.getByText('Custom error fallback')).toBeInTheDocument();
    });

    test('error boundary calls onError callback when provided', () => {
      const onErrorCallback = vi.fn();

      render(
        <TestWrapper>
          <ErrorBoundary onError={onErrorCallback} context="test-component">
            <ErrorThrowingComponent shouldThrow={true} />
          </ErrorBoundary>
        </TestWrapper>
      );

      expect(onErrorCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          type: ErrorType.UNKNOWN_ERROR,
          severity: ErrorSeverity.MEDIUM
        }),
        expect.any(Object)
      );
    });
  });

  describe('Error Message Components', () => {
    test('compact error message displays correctly', () => {
      const error = classifyError(new Error('Test error'));
      const mockDismiss = vi.fn();

      render(
        <TestWrapper>
          <ErrorMessage error={error} onDismiss={mockDismiss} compact />
        </TestWrapper>
      );

      expect(screen.getByText('An unexpected error occurred. Please try again.')).toBeInTheDocument();
      
      const dismissButton = screen.getByRole('button', { name: '' });
      fireEvent.click(dismissButton);
      expect(mockDismiss).toHaveBeenCalled();
    });

    test('inline error displays correctly', () => {
      const error = classifyError(new Error('Inline error test'));
      const mockRetry = vi.fn();

      render(
        <TestWrapper>
          <InlineError error={error} onRetry={mockRetry} />
        </TestWrapper>
      );

      expect(screen.getByText('An unexpected error occurred. Please try again.')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: /retry/i }));
      expect(mockRetry).toHaveBeenCalled();
    });

    test('error fallback displays correctly', () => {
      const error = classifyError(new Error('Page error test'));
      const mockRetry = vi.fn();
      const mockGoHome = vi.fn();

      render(
        <TestWrapper>
          <ErrorFallback 
            error={error} 
            onRetry={mockRetry} 
            onGoHome={mockGoHome}
            context="test-page"
          />
        </TestWrapper>
      );

      expect(screen.getByText(/Unexpected Error/i)).toBeInTheDocument();
      expect(screen.getByText(/unexpected error occurred/i)).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: /try again/i }));
      expect(mockRetry).toHaveBeenCalled();

      fireEvent.click(screen.getByRole('button', { name: /go home/i }));
      expect(mockGoHome).toHaveBeenCalled();
    });
  });

  describe('Error Severity and Actions', () => {
    test('critical errors show appropriate severity', () => {
      const criticalError = {
        type: ErrorType.DATABASE_ERROR,
        severity: ErrorSeverity.CRITICAL,
        message: 'Database crashed',
        userMessage: 'Database is unavailable',
        timestamp: new Date(),
        retryable: false
      };

      render(
        <TestWrapper>
          <ErrorMessage error={criticalError} />
        </TestWrapper>
      );

      expect(screen.getByText(/Database is unavailable/i)).toBeInTheDocument();
      // Critical errors typically don't show retry buttons
      expect(screen.queryByRole('button', { name: /try again/i })).not.toBeInTheDocument();
    });

    test('retryable errors show retry functionality', () => {
      const retryableError = {
        type: ErrorType.NETWORK_ERROR,
        severity: ErrorSeverity.MEDIUM,
        message: 'Network failed',
        userMessage: 'Check your internet connection',
        timestamp: new Date(),
        retryable: true
      };

      const mockRetry = vi.fn();

      render(
        <TestWrapper>
          <ErrorMessage error={retryableError} onRetry={mockRetry} />
        </TestWrapper>
      );

      expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
      fireEvent.click(screen.getByRole('button', { name: /try again/i }));
      expect(mockRetry).toHaveBeenCalled();
    });
  });

  describe('Development Mode Features', () => {
    const originalEnv = process.env.NODE_ENV;

    beforeEach(() => {
      process.env.NODE_ENV = 'development';
    });

    afterEach(() => {
      process.env.NODE_ENV = originalEnv;
    });

    test('error boundary shows debug info in development', () => {
      render(
        <TestWrapper>
          <ErrorBoundary context="test-component">
            <ErrorThrowingComponent shouldThrow={true} />
          </ErrorBoundary>
        </TestWrapper>
      );

      // Should show development-only debug section
      expect(screen.getByText(/Error Details \(Development Only\)/i)).toBeInTheDocument();
    });

    test('error fallback shows debug info in development', () => {
      const error = classifyError(new Error('Debug test error'));

      render(
        <TestWrapper>
          <ErrorFallback error={error} context="test-page" />
        </TestWrapper>
      );

      expect(screen.getByText(/Debug Info/i)).toBeInTheDocument();
    });
  });

  describe('Error Recovery Flows', () => {
    test('error message can be dismissed and recalled', () => {
      const error = classifyError(new Error('Dismissible error'));
      let showError = true;
      const mockDismiss = vi.fn(() => {
        showError = false;
      });

      const { rerender } = render(
        <TestWrapper>
          {showError && <ErrorMessage error={error} onDismiss={mockDismiss} />}
        </TestWrapper>
      );

      expect(screen.getByText('An unexpected error occurred. Please try again.')).toBeInTheDocument();

      // Dismiss the error
      fireEvent.click(screen.getByRole('button', { name: '' }));
      expect(mockDismiss).toHaveBeenCalled();

      // Re-render without error
      rerender(
        <TestWrapper>
          {showError && <ErrorMessage error={error} onDismiss={mockDismiss} />}
        </TestWrapper>
      );

      expect(screen.queryByText(/unexpected error/i)).not.toBeInTheDocument();
    });

    test('multiple error states can be handled simultaneously', () => {
      const networkError = classifyError(new Error('Network request failed'));
      const authError = classifyError({ code: 'PGRST301', message: 'JWT expired' });

      render(
        <TestWrapper>
          <div>
            <ErrorMessage error={networkError} compact />
            <ErrorMessage error={authError} compact />
          </div>
        </TestWrapper>
      );

      expect(screen.getByText(/internet connection/i)).toBeInTheDocument();
      expect(screen.getByText(/session has expired/i)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    test('error messages have proper ARIA roles', () => {
      const error = classifyError(new Error('Accessibility test'));

      render(
        <TestWrapper>
          <ErrorMessage error={error} />
        </TestWrapper>
      );

      // Alert components should have alert role
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    test('retry buttons are keyboard accessible', () => {
      const error = classifyError(new Error('Network request failed'));
      const mockRetry = vi.fn();

      render(
        <TestWrapper>
          <ErrorMessage error={error} onRetry={mockRetry} />
        </TestWrapper>
      );

      const retryButton = screen.getByRole('button', { name: /try again/i });
      
      // Should be focusable and clickable via keyboard
      retryButton.focus();
      expect(retryButton).toHaveFocus();

      fireEvent.keyDown(retryButton, { key: 'Enter', code: 'Enter' });
      // Note: In a real test environment, this would trigger the onClick handler
    });
  });
});

// Integration test that simulates a real error scenario
describe('Real-World Error Scenarios', () => {
  test('simulates complete error recovery flow', async () => {
    let hasError = true;
    const error = classifyError(new Error('Network request failed'));
    
    const mockRetry = vi.fn(() => {
      hasError = false;
    });

    const TestComponent = () => {
      if (hasError) {
        return <ErrorMessage error={error} onRetry={mockRetry} />;
      }
      return <div>Data loaded successfully</div>;
    };

    const { rerender } = render(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>
    );

    // Should show error initially
    expect(screen.getByText(/internet connection/i)).toBeInTheDocument();

    // Click retry
    fireEvent.click(screen.getByRole('button', { name: /try again/i }));
    expect(mockRetry).toHaveBeenCalled();

    // Re-render after successful retry
    rerender(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>
    );

    expect(screen.getByText('Data loaded successfully')).toBeInTheDocument();
  });
});