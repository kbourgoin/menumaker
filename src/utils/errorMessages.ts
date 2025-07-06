// User-friendly error message mapping
// NO DEPENDENCIES - Safe for import anywhere

import { ErrorType } from "@/types/errors";

export const ERROR_MESSAGES: Record<ErrorType, string> = {
  // Network & API Errors
  [ErrorType.NETWORK_ERROR]:
    "Unable to connect. Please check your internet connection and try again.",
  [ErrorType.API_ERROR]:
    "Server error occurred. Please try again in a few moments.",
  [ErrorType.TIMEOUT_ERROR]: "Request timed out. Please try again.",

  // Authentication Errors
  [ErrorType.AUTH_ERROR]: "Authentication failed. Please sign in again.",
  [ErrorType.UNAUTHORIZED]: "You don't have permission to perform this action.",
  [ErrorType.SESSION_EXPIRED]:
    "Your session has expired. Please sign in again.",

  // Database Errors
  [ErrorType.DATABASE_ERROR]: "Database error occurred. Please try again.",
  [ErrorType.CONSTRAINT_ERROR]:
    "This action conflicts with existing data. Please check and try again.",
  [ErrorType.NOT_FOUND]: "The requested item could not be found.",

  // Validation Errors
  [ErrorType.VALIDATION_ERROR]: "Please check your input and try again.",
  [ErrorType.INVALID_INPUT]:
    "Some information is invalid. Please correct and try again.",
  [ErrorType.MISSING_REQUIRED]: "Please fill in all required fields.",

  // Application Errors
  [ErrorType.UNKNOWN_ERROR]: "An unexpected error occurred. Please try again.",
  [ErrorType.CLIENT_ERROR]:
    "Something went wrong on your device. Please refresh and try again.",
  [ErrorType.SERVER_ERROR]:
    "Server is temporarily unavailable. Please try again later.",
};

export const ERROR_TITLES: Record<ErrorType, string> = {
  // Network & API Errors
  [ErrorType.NETWORK_ERROR]: "Connection Problem",
  [ErrorType.API_ERROR]: "Server Error",
  [ErrorType.TIMEOUT_ERROR]: "Request Timeout",

  // Authentication Errors
  [ErrorType.AUTH_ERROR]: "Authentication Error",
  [ErrorType.UNAUTHORIZED]: "Access Denied",
  [ErrorType.SESSION_EXPIRED]: "Session Expired",

  // Database Errors
  [ErrorType.DATABASE_ERROR]: "Database Error",
  [ErrorType.CONSTRAINT_ERROR]: "Data Conflict",
  [ErrorType.NOT_FOUND]: "Not Found",

  // Validation Errors
  [ErrorType.VALIDATION_ERROR]: "Invalid Input",
  [ErrorType.INVALID_INPUT]: "Invalid Data",
  [ErrorType.MISSING_REQUIRED]: "Missing Information",

  // Application Errors
  [ErrorType.UNKNOWN_ERROR]: "Unexpected Error",
  [ErrorType.CLIENT_ERROR]: "Client Error",
  [ErrorType.SERVER_ERROR]: "Server Unavailable",
};

export const ERROR_ACTIONS: Record<ErrorType, string[]> = {
  // Network & API Errors
  [ErrorType.NETWORK_ERROR]: ["Check your internet connection", "Try again"],
  [ErrorType.API_ERROR]: ["Wait a moment", "Try again"],
  [ErrorType.TIMEOUT_ERROR]: ["Try again"],

  // Authentication Errors
  [ErrorType.AUTH_ERROR]: ["Sign in again"],
  [ErrorType.UNAUTHORIZED]: ["Contact support if this seems wrong"],
  [ErrorType.SESSION_EXPIRED]: ["Sign in again"],

  // Database Errors
  [ErrorType.DATABASE_ERROR]: [
    "Try again",
    "Contact support if this continues",
  ],
  [ErrorType.CONSTRAINT_ERROR]: ["Review your changes", "Try again"],
  [ErrorType.NOT_FOUND]: ["Go back", "Check if the item still exists"],

  // Validation Errors
  [ErrorType.VALIDATION_ERROR]: ["Review your input", "Try again"],
  [ErrorType.INVALID_INPUT]: ["Fix the highlighted fields", "Try again"],
  [ErrorType.MISSING_REQUIRED]: ["Fill in required fields", "Try again"],

  // Application Errors
  [ErrorType.UNKNOWN_ERROR]: ["Refresh the page", "Try again"],
  [ErrorType.CLIENT_ERROR]: ["Refresh the page", "Clear your browser cache"],
  [ErrorType.SERVER_ERROR]: ["Try again later", "Contact support if urgent"],
};

// Get user-friendly error message
export function getUserMessage(errorType: ErrorType): string {
  return ERROR_MESSAGES[errorType] || ERROR_MESSAGES[ErrorType.UNKNOWN_ERROR];
}

// Get error title for display
export function getErrorTitle(errorType: ErrorType): string {
  return ERROR_TITLES[errorType] || ERROR_TITLES[ErrorType.UNKNOWN_ERROR];
}

// Get suggested actions for error
export function getErrorActions(errorType: ErrorType): string[] {
  return ERROR_ACTIONS[errorType] || ERROR_ACTIONS[ErrorType.UNKNOWN_ERROR];
}
