// Error message component for displaying hook errors in UI
import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, X } from 'lucide-react';
import { AppError } from '@/types/errors';
import { getErrorTitle, getErrorActions } from '@/utils/errorMessages';

interface ErrorMessageProps {
  error: AppError;
  onRetry?: () => void;
  onDismiss?: () => void;
  className?: string;
  compact?: boolean;
}

export function ErrorMessage({ 
  error, 
  onRetry, 
  onDismiss, 
  className = '',
  compact = false 
}: ErrorMessageProps) {
  const errorTitle = getErrorTitle(error.type);
  const suggestedActions = getErrorActions(error.type);

  if (compact) {
    return (
      <Alert variant="destructive" className={className}>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between">
          <span>{error.userMessage}</span>
          <div className="flex items-center gap-2 ml-2">
            {error.retryable && onRetry && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRetry}
                className="h-6 px-2 text-xs"
              >
                Retry
              </Button>
            )}
            {onDismiss && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onDismiss}
                className="h-6 w-6 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert variant="destructive" className={className}>
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle className="flex items-center justify-between">
        {errorTitle}
        {onDismiss && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onDismiss}
            className="h-6 w-6 p-0"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </AlertTitle>
      <AlertDescription className="space-y-3">
        <p>{error.userMessage}</p>
        
        {suggestedActions.length > 0 && (
          <div>
            <p className="text-sm font-medium mb-2">What you can do:</p>
            <ul className="text-sm space-y-1">
              {suggestedActions.map((action, index) => (
                <li key={index} className="flex items-center">
                  <span className="w-1 h-1 bg-current rounded-full mr-2" />
                  {action}
                </li>
              ))}
            </ul>
          </div>
        )}

        {(error.retryable && onRetry) && (
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onRetry}
              className="h-8"
            >
              <RefreshCw className="mr-2 h-3 w-3" />
              Try Again
            </Button>
          </div>
        )}
      </AlertDescription>
    </Alert>
  );
}

// Lightweight error display for inline use
interface InlineErrorProps {
  error: AppError;
  onRetry?: () => void;
  className?: string;
}

export function InlineError({ error, onRetry, className = '' }: InlineErrorProps) {
  return (
    <div className={`flex items-center gap-2 text-sm text-destructive ${className}`}>
      <AlertTriangle className="h-4 w-4 flex-shrink-0" />
      <span className="flex-1">{error.userMessage}</span>
      {error.retryable && onRetry && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onRetry}
          className="h-6 px-2 text-xs text-destructive hover:text-destructive"
        >
          Retry
        </Button>
      )}
    </div>
  );
}

// Error fallback for page-level errors
interface ErrorFallbackProps {
  error: AppError;
  onRetry?: () => void;
  onGoHome?: () => void;
  context?: string;
}

export function ErrorFallback({ 
  error, 
  onRetry, 
  onGoHome,
  context = 'page'
}: ErrorFallbackProps) {
  const errorTitle = getErrorTitle(error.type);
  const suggestedActions = getErrorActions(error.type);

  return (
    <div className="flex items-center justify-center min-h-[400px] p-8">
      <div className="text-center space-y-6 max-w-md">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
          <AlertTriangle className="h-8 w-8 text-destructive" />
        </div>
        
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold text-foreground">{errorTitle}</h2>
          <p className="text-muted-foreground">{error.userMessage}</p>
        </div>

        {suggestedActions.length > 0 && (
          <div className="text-left">
            <p className="text-sm font-medium text-muted-foreground mb-2">What you can do:</p>
            <ul className="text-sm text-muted-foreground space-y-1">
              {suggestedActions.map((action, index) => (
                <li key={index} className="flex items-center">
                  <span className="w-1 h-1 bg-muted-foreground rounded-full mr-2" />
                  {action}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {error.retryable && onRetry && (
            <Button onClick={onRetry} className="min-w-[120px]">
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
          )}
          {onGoHome && (
            <Button variant="outline" onClick={onGoHome} className="min-w-[120px]">
              Go Home
            </Button>
          )}
        </div>

        {process.env.NODE_ENV === 'development' && (
          <details className="text-left text-xs text-muted-foreground">
            <summary className="cursor-pointer font-medium">Debug Info</summary>
            <div className="mt-2 space-y-1">
              <p><strong>Context:</strong> {context}</p>
              <p><strong>Type:</strong> {error.type}</p>
              <p><strong>Severity:</strong> {error.severity}</p>
              <p><strong>Retryable:</strong> {error.retryable ? 'Yes' : 'No'}</p>
              <p><strong>Time:</strong> {error.timestamp.toLocaleString()}</p>
            </div>
          </details>
        )}
      </div>
    </div>
  );
}