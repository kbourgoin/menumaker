/**
 * Environment-Aware Logging Utility
 *
 * Provides structured logging that respects environment settings.
 * In production, only critical errors and warnings are logged.
 * In development, all logging levels are available.
 */

type LogLevel = "debug" | "info" | "warn" | "error";

class Logger {
  // Check environment dynamically instead of caching at instantiation
  private get isDevelopment() {
    return import.meta.env.DEV;
  }
  private get isTest() {
    return import.meta.env.MODE === "test";
  }

  /**
   * Debug logging - only in development
   * Use for detailed debugging information
   */
  debug(message: string, context?: string, data?: unknown): void {
    if (this.isDevelopment && !this.isTest) {
      this.log("debug", message, context, data);
    }
  }

  /**
   * Info logging - only in development
   * Use for general information about application flow
   */
  info(message: string, context?: string, data?: unknown): void {
    if (this.isDevelopment && !this.isTest) {
      this.log("info", message, context, data);
    }
  }

  /**
   * Warning logging - all environments
   * Use for non-critical issues that should be monitored
   */
  warn(message: string, context?: string, data?: unknown): void {
    this.log("warn", message, context, data);
  }

  /**
   * Error logging - all environments
   * Use for errors that need immediate attention
   */
  error(message: string, context?: string, data?: unknown): void {
    this.log("error", message, context, data);
  }

  /**
   * Performance logging - development only
   * Use for performance monitoring and optimization
   */
  performance(message: string, duration?: number, context?: string): void {
    if (this.isDevelopment && !this.isTest) {
      const perfMessage = duration
        ? `${message} (${duration.toFixed(2)}ms)`
        : message;
      this.log("info", `📊 ${perfMessage}`, context);
    }
  }

  /**
   * Migration logging - development only with special handling
   * Use for database migrations and data transformations
   */
  migration(message: string, context?: string, data?: unknown): void {
    if (this.isDevelopment) {
      this.log("info", `🔄 Migration: ${message}`, context, data);
    } else {
      // In production, only log migration errors/warnings
      if (message.includes("error") || message.includes("failed")) {
        this.error(message, context, data);
      }
    }
  }

  /**
   * Import/Export logging - user-facing operations
   * Provides minimal logging for user operations
   */
  operation(message: string, context?: string): void {
    if (this.isDevelopment && !this.isTest) {
      this.log("info", `⚙️ ${message}`, context);
    }
    // In production, these should be user-facing notifications, not console logs
  }

  /**
   * Authentication logging - security events
   * Logs authentication events with appropriate security considerations
   */
  auth(message: string, context?: string): void {
    if (this.isDevelopment && !this.isTest) {
      this.log("info", `🔐 Auth: ${message}`, context);
    }
    // In production, auth events should go to security monitoring, not console
  }

  private log(
    level: LogLevel,
    message: string,
    context?: string,
    data?: unknown
  ): void {
    const contextInfo = context ? ` [${context}]` : "";
    const fullMessage = `${message}${contextInfo}`;

    switch (level) {
      case "debug":
        if (data !== undefined) {
          console.log(fullMessage, data);
        } else {
          console.log(fullMessage);
        }
        break;

      case "info":
        if (data !== undefined) {
          console.info(fullMessage, data);
        } else {
          console.info(fullMessage);
        }
        break;

      case "warn":
        if (data !== undefined) {
          console.warn(fullMessage, data);
        } else {
          console.warn(fullMessage);
        }
        break;

      case "error":
        if (data !== undefined) {
          console.error(fullMessage, data);
        } else {
          console.error(fullMessage);
        }
        break;
    }
  }
}

// Export singleton instance
export const logger = new Logger();

// Export convenience functions for common patterns
export const debugLog = logger.debug.bind(logger);
export const infoLog = logger.info.bind(logger);
export const warnLog = logger.warn.bind(logger);
export const errorLog = logger.error.bind(logger);
export const perfLog = logger.performance.bind(logger);
export const migrationLog = logger.migration.bind(logger);
export const operationLog = logger.operation.bind(logger);
export const authLog = logger.auth.bind(logger);

// Development-only console replacement
export const devConsole = {
  log: logger.debug.bind(logger),
  info: logger.info.bind(logger),
  warn: logger.warn.bind(logger),
  error: logger.error.bind(logger),
  debug: logger.debug.bind(logger),
};

/**
 * Conditional logging wrapper for backward compatibility
 * Use this to wrap existing console statements during migration
 */
export const conditionalLog = {
  /**
   * Log only in development
   */
  dev: (message: string, ...args: unknown[]) => {
    if (import.meta.env.DEV && import.meta.env.MODE !== "test") {
      console.log(message, ...args);
    }
  },

  /**
   * Always log errors
   */
  error: (message: string, ...args: unknown[]) => {
    console.error(message, ...args);
  },

  /**
   * Always log warnings
   */
  warn: (message: string, ...args: unknown[]) => {
    console.warn(message, ...args);
  },
};
