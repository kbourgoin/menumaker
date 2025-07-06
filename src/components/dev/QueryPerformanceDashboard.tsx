/**
 * Enhanced query performance dashboard with detailed analytics
 * Shows comprehensive performance metrics and trends
 */

import { useEffect, useState } from "react";
import { getDetailedPerformanceMetrics } from "@/utils/performance";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface DetailedPerformanceMetrics {
  totalQueries: number;
  successRate: number;
  fallbackRate: number;
  averageDuration: number;
  maxDuration: number;
  slowQueries: number;
  queryTypes: Record<
    string,
    {
      count: number;
      avgDuration: number;
      successRate: number;
      fallbackRate: number;
    }
  >;
  trends: {
    last5min: number[];
    last30min: number[];
  };
  targets: {
    avgDurationTarget: number;
    fallbackRateTarget: number;
    successRateTarget: number;
  };
}

export const QueryPerformanceDashboard = () => {
  const [metrics, setMetrics] = useState<DetailedPerformanceMetrics | null>(
    null
  );
  const [isVisible, setIsVisible] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    // Only show in development mode
    if (process.env.NODE_ENV !== "development") {
      return;
    }

    const interval = setInterval(() => {
      const currentMetrics = getDetailedPerformanceMetrics();
      if (currentMetrics) {
        setMetrics(currentMetrics);
        setIsVisible(true);
      }
    }, 3000); // Update every 3 seconds

    return () => clearInterval(interval);
  }, []);

  // Don't render in production
  if (process.env.NODE_ENV !== "development" || !isVisible || !metrics) {
    return null;
  }

  const getStatusColor = (
    value: number,
    target: number,
    inverse: boolean = false
  ) => {
    const threshold = inverse ? target * 0.8 : target * 1.2;
    if (inverse) {
      return value <= threshold
        ? "text-green-400"
        : value <= target
          ? "text-yellow-400"
          : "text-red-400";
    }
    return value >= threshold
      ? "text-green-400"
      : value >= target
        ? "text-yellow-400"
        : "text-red-400";
  };

  const getBadgeVariant = (
    value: number,
    target: number,
    inverse: boolean = false
  ) => {
    const threshold = inverse ? target * 0.8 : target * 1.2;
    if (inverse) {
      return value <= threshold
        ? "default"
        : value <= target
          ? "secondary"
          : "destructive";
    }
    return value >= threshold
      ? "default"
      : value >= target
        ? "secondary"
        : "destructive";
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Card className="bg-black/95 text-white border-gray-700 min-w-80">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle className="text-sm font-semibold text-green-400">
              📊 Query Performance Dashboard
            </CardTitle>
            <div className="flex gap-2">
              <button
                onClick={() => setExpanded(!expanded)}
                className="text-gray-400 hover:text-white text-xs"
              >
                {expanded ? "▼" : "▶"}
              </button>
              <button
                onClick={() => setIsVisible(false)}
                className="text-gray-400 hover:text-white"
              >
                ×
              </button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-0 space-y-3">
          {/* Core Metrics */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="space-y-1">
              <div className="flex justify-between">
                <span>Total Queries:</span>
                <span className="text-blue-400">{metrics.totalQueries}</span>
              </div>

              <div className="flex justify-between">
                <span>Success Rate:</span>
                <Badge
                  variant={getBadgeVariant(
                    metrics.successRate,
                    metrics.targets.successRateTarget
                  )}
                >
                  {metrics.successRate.toFixed(1)}%
                </Badge>
              </div>

              <div className="flex justify-between">
                <span>Fallback Rate:</span>
                <Badge
                  variant={getBadgeVariant(
                    metrics.fallbackRate,
                    metrics.targets.fallbackRateTarget,
                    true
                  )}
                >
                  {metrics.fallbackRate.toFixed(1)}%
                </Badge>
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between">
                <span>Avg Duration:</span>
                <Badge
                  variant={getBadgeVariant(
                    metrics.averageDuration,
                    metrics.targets.avgDurationTarget,
                    true
                  )}
                >
                  {metrics.averageDuration.toFixed(0)}ms
                </Badge>
              </div>

              <div className="flex justify-between">
                <span>Max Duration:</span>
                <span
                  className={getStatusColor(metrics.maxDuration, 2000, true)}
                >
                  {metrics.maxDuration.toFixed(0)}ms
                </span>
              </div>

              <div className="flex justify-between">
                <span>Slow Queries:</span>
                <Badge
                  variant={
                    metrics.slowQueries === 0 ? "default" : "destructive"
                  }
                >
                  {metrics.slowQueries}
                </Badge>
              </div>
            </div>
          </div>

          {/* Query Type Breakdown */}
          {expanded && (
            <div className="space-y-2">
              <div className="border-t border-gray-600 pt-2">
                <h4 className="text-xs font-semibold text-green-400 mb-1">
                  Query Types
                </h4>
                <div className="space-y-1 text-xs">
                  {Object.entries(metrics.queryTypes).map(([type, stats]) => (
                    <div
                      key={type}
                      className="flex justify-between items-center"
                    >
                      <span className="truncate flex-1">{type}:</span>
                      <div className="flex gap-1">
                        <span className="text-blue-400">{stats.count}</span>
                        <span className="text-gray-400">|</span>
                        <span
                          className={getStatusColor(
                            stats.avgDuration,
                            500,
                            true
                          )}
                        >
                          {stats.avgDuration.toFixed(0)}ms
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Performance Targets */}
              <div className="border-t border-gray-600 pt-2">
                <h4 className="text-xs font-semibold text-green-400 mb-1">
                  Targets
                </h4>
                <div className="text-xs text-gray-400 space-y-1">
                  <div>
                    • Avg Duration: &lt;{metrics.targets.avgDurationTarget}ms
                  </div>
                  <div>
                    • Success Rate: &gt;{metrics.targets.successRateTarget}%
                  </div>
                  <div>
                    • Fallback Rate: &lt;{metrics.targets.fallbackRateTarget}%
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Overall Performance Status */}
          <div className="border-t border-gray-600 pt-2">
            <div className="flex justify-between items-center text-xs">
              <span>Overall Status:</span>
              <Badge
                variant={
                  metrics.successRate >= metrics.targets.successRateTarget &&
                  metrics.fallbackRate <= metrics.targets.fallbackRateTarget &&
                  metrics.averageDuration <= metrics.targets.avgDurationTarget
                    ? "default"
                    : "secondary"
                }
              >
                {metrics.successRate >= metrics.targets.successRateTarget &&
                metrics.fallbackRate <= metrics.targets.fallbackRateTarget &&
                metrics.averageDuration <= metrics.targets.avgDurationTarget
                  ? "✅ Good"
                  : "⚠️ Needs Attention"}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default QueryPerformanceDashboard;
