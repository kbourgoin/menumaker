import React, { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertTriangle, RefreshCw, Home, Bug } from "lucide-react";
import { classifyError, logError } from "@/utils/errorHandling";
import { getErrorTitle, getErrorActions } from "@/utils/errorMessages";
import { AppError } from "@/types/errors";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: AppError, errorInfo: ErrorInfo) => void;
  context?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  classifiedError: AppError | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    classifiedError: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    const classifiedError = classifyError(error);
    return {
      hasError: true,
      error,
      errorInfo: null,
      classifiedError,
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const classifiedError = classifyError(error);
    const context = this.props.context || "ErrorBoundary";

    // Use our enhanced error logging
    logError(classifiedError, context);

    this.setState({
      error,
      errorInfo,
      classifiedError,
    });

    // Call optional error callback
    if (this.props.onError) {
      this.props.onError(classifiedError, errorInfo);
    }
  }

  private handleRefresh = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = "/";
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { classifiedError } = this.state;
      const errorTitle = classifiedError
        ? getErrorTitle(classifiedError.type)
        : "Something went wrong";
      const errorMessage =
        classifiedError?.userMessage ||
        "An unexpected error occurred. This has been logged and we'll look into it.";
      const suggestedActions = classifiedError
        ? getErrorActions(classifiedError.type)
        : ["Refresh the page", "Go home"];

      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                <AlertTriangle className="h-6 w-6 text-destructive" />
              </div>
              <CardTitle>{errorTitle}</CardTitle>
              <CardDescription>{errorMessage}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Suggested actions */}
              {suggestedActions.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">
                    Suggested actions:
                  </p>
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

              <div className="flex flex-col gap-2">
                <Button onClick={this.handleRefresh} className="w-full">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Try Again
                </Button>
                <Button
                  variant="outline"
                  onClick={this.handleGoHome}
                  className="w-full"
                >
                  <Home className="mr-2 h-4 w-4" />
                  Go Home
                </Button>
              </div>

              {process.env.NODE_ENV === "development" && this.state.error && (
                <details className="mt-4">
                  <summary className="cursor-pointer text-sm font-medium flex items-center">
                    <Bug className="mr-2 h-4 w-4" />
                    Error Details (Development Only)
                  </summary>
                  <div className="mt-2 space-y-2">
                    {classifiedError && (
                      <div className="text-xs space-y-1">
                        <p>
                          <strong>Type:</strong> {classifiedError.type}
                        </p>
                        <p>
                          <strong>Severity:</strong> {classifiedError.severity}
                        </p>
                        <p>
                          <strong>Retryable:</strong>{" "}
                          {classifiedError.retryable ? "Yes" : "No"}
                        </p>
                        <p>
                          <strong>Timestamp:</strong>{" "}
                          {classifiedError.timestamp.toISOString()}
                        </p>
                      </div>
                    )}
                    <pre className="text-xs text-muted-foreground whitespace-pre-wrap break-words bg-muted p-2 rounded">
                      {this.state.error.toString()}
                      {this.state.errorInfo?.componentStack}
                    </pre>
                  </div>
                </details>
              )}
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook version for functional components
export const useErrorHandler = (context?: string) => {
  return (error: Error, errorInfo?: ErrorInfo) => {
    const classifiedError = classifyError(error);
    const errorContext = context || "useErrorHandler";

    logError(classifiedError, errorContext);

    return classifiedError;
  };
};
