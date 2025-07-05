/**
 * Performance monitoring utilities for database queries and other operations
 */

import { perfLog, warnLog } from './logger';

interface PerformanceTimer {
  start: number;
  end?: number;
  duration?: number;
}

const timers = new Map<string, PerformanceTimer>();

/**
 * Start timing an operation
 */
export const startTimer = (name: string): void => {
  timers.set(name, { start: performance.now() });
};

/**
 * End timing an operation and return the duration
 */
export const endTimer = (name: string): number => {
  const timer = timers.get(name);
  if (!timer) {
    warnLog(`Timer "${name}" was not started`, 'Performance');
    return 0;
  }
  
  const end = performance.now();
  const duration = end - timer.start;
  
  timer.end = end;
  timer.duration = duration;
  
  // Log slow operations - development only
  if (duration > 1000) {
    warnLog(`Slow operation "${name}": ${duration.toFixed(2)}ms`, 'Performance');
  } else if (duration > 500) {
    perfLog(`Operation "${name}"`, duration, 'Performance');
  }
  
  timers.delete(name);
  return duration;
};

/**
 * Measure the performance of an async operation
 */
export const measureAsync = async <T>(
  name: string, 
  operation: () => Promise<T>
): Promise<T> => {
  startTimer(name);
  try {
    const result = await operation();
    endTimer(name);
    return result;
  } catch (error) {
    endTimer(name);
    throw error;
  }
};

/**
 * Track query performance metrics
 */
interface QueryMetrics {
  queryType: string;
  duration: number;
  recordCount: number;
  success: boolean;
  fallbackUsed?: boolean;
}

const queryMetrics: QueryMetrics[] = [];

export const trackQuery = (metrics: QueryMetrics): void => {
  queryMetrics.push({
    ...metrics,
    timestamp: Date.now()
  } as QueryMetrics & { timestamp: number });
  
  // Keep only last 100 metrics to avoid memory leaks
  if (queryMetrics.length > 100) {
    queryMetrics.shift();
  }
  
  // Log slow queries - development only
  if (metrics.duration > 2000) {
    warnLog(`Slow query: ${metrics.queryType} took ${metrics.duration.toFixed(2)}ms for ${metrics.recordCount} records`, 'Performance');
  }
};

/**
 * Get performance statistics
 */
export const getPerformanceStats = () => {
  if (queryMetrics.length === 0) return null;
  
  const successfulQueries = queryMetrics.filter(m => m.success);
  const fallbackQueries = queryMetrics.filter(m => m.fallbackUsed);
  
  const avgDuration = successfulQueries.reduce((sum, m) => sum + m.duration, 0) / successfulQueries.length;
  const maxDuration = Math.max(...successfulQueries.map(m => m.duration));
  const fallbackRate = (fallbackQueries.length / queryMetrics.length) * 100;
  
  return {
    totalQueries: queryMetrics.length,
    successRate: (successfulQueries.length / queryMetrics.length) * 100,
    fallbackRate,
    averageDuration: avgDuration,
    maxDuration,
    slowQueries: queryMetrics.filter(m => m.duration > 1000).length
  };
};

/**
 * Development helper to log performance stats
 * Only logs in development mode
 */
export const logPerformanceStats = (): void => {
  if (!import.meta.env.DEV) return;
  
  const stats = getPerformanceStats();
  if (stats) {
    console.group('📊 Query Performance Stats');
    console.log(`Total queries: ${stats.totalQueries}`);
    console.log(`Success rate: ${stats.successRate.toFixed(1)}%`);
    console.log(`Fallback rate: ${stats.fallbackRate.toFixed(1)}%`);
    console.log(`Average duration: ${stats.averageDuration.toFixed(2)}ms`);
    console.log(`Max duration: ${stats.maxDuration.toFixed(2)}ms`);
    console.log(`Slow queries (>1s): ${stats.slowQueries}`);
    console.groupEnd();
  }
};