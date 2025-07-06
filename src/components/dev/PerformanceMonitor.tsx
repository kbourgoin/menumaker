/**
 * Development component to display real-time performance metrics
 * Only shown in development mode
 */

import { useEffect, useState } from "react";
import { getPerformanceStats } from "@/utils/performance";

interface PerformanceStats {
  totalQueries: number;
  successRate: number;
  fallbackRate: number;
  averageDuration: number;
  maxDuration: number;
  slowQueries: number;
}

export const PerformanceMonitor = () => {
  const [stats, setStats] = useState<PerformanceStats | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Only show in development mode
    if (process.env.NODE_ENV !== "development") {
      return;
    }

    const interval = setInterval(() => {
      const currentStats = getPerformanceStats();
      if (currentStats) {
        setStats(currentStats);
        setIsVisible(true);
      }
    }, 2000); // Update every 2 seconds

    return () => clearInterval(interval);
  }, []);

  // Don't render in production
  if (process.env.NODE_ENV !== "development" || !isVisible || !stats) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black/90 text-white p-3 rounded-lg text-xs font-mono z-50 min-w-64">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-semibold text-green-400">📊 Query Performance</h3>
        <button
          onClick={() => setIsVisible(false)}
          className="text-gray-400 hover:text-white"
        >
          ×
        </button>
      </div>

      <div className="space-y-1">
        <div className="flex justify-between">
          <span>Total Queries:</span>
          <span className="text-blue-400">{stats.totalQueries}</span>
        </div>

        <div className="flex justify-between">
          <span>Success Rate:</span>
          <span
            className={
              stats.successRate >= 95 ? "text-green-400" : "text-yellow-400"
            }
          >
            {stats.successRate.toFixed(1)}%
          </span>
        </div>

        <div className="flex justify-between">
          <span>Fallback Rate:</span>
          <span
            className={
              stats.fallbackRate <= 5 ? "text-green-400" : "text-red-400"
            }
          >
            {stats.fallbackRate.toFixed(1)}%
          </span>
        </div>

        <div className="flex justify-between">
          <span>Avg Duration:</span>
          <span
            className={
              stats.averageDuration <= 500
                ? "text-green-400"
                : stats.averageDuration <= 1000
                  ? "text-yellow-400"
                  : "text-red-400"
            }
          >
            {stats.averageDuration.toFixed(0)}ms
          </span>
        </div>

        <div className="flex justify-between">
          <span>Max Duration:</span>
          <span
            className={
              stats.maxDuration <= 1000
                ? "text-green-400"
                : stats.maxDuration <= 2000
                  ? "text-yellow-400"
                  : "text-red-400"
            }
          >
            {stats.maxDuration.toFixed(0)}ms
          </span>
        </div>

        <div className="flex justify-between">
          <span>Slow Queries (&gt;1s):</span>
          <span
            className={
              stats.slowQueries === 0 ? "text-green-400" : "text-red-400"
            }
          >
            {stats.slowQueries}
          </span>
        </div>
      </div>

      <div className="mt-2 pt-2 border-t border-gray-600 text-gray-400">
        Target: &lt;500ms avg, &lt;5% fallback
      </div>
    </div>
  );
};

export default PerformanceMonitor;
