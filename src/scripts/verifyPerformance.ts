/**
 * Performance verification script
 * Validates that performance targets are being met
 */

import { getDetailedPerformanceMetrics } from '../utils/performance';

interface PerformanceTargets {
  avgDurationTarget: number;
  successRateTarget: number;
  fallbackRateTarget: number;
  maxDurationTarget: number;
}

const PERFORMANCE_TARGETS: PerformanceTargets = {
  avgDurationTarget: 500, // 500ms average
  successRateTarget: 95,  // 95% success rate
  fallbackRateTarget: 5,  // 5% fallback rate
  maxDurationTarget: 2000 // 2 seconds max
};

export function verifyPerformanceTargets(): {
  passed: boolean;
  results: Record<string, { target: number; actual: number; passed: boolean }>;
  summary: string;
} {
  const metrics = getDetailedPerformanceMetrics();
  
  if (!metrics) {
    return {
      passed: false,
      results: {},
      summary: 'No performance metrics available. Run some queries first.'
    };
  }

  const results = {
    avgDuration: {
      target: PERFORMANCE_TARGETS.avgDurationTarget,
      actual: metrics.averageDuration,
      passed: metrics.averageDuration <= PERFORMANCE_TARGETS.avgDurationTarget
    },
    successRate: {
      target: PERFORMANCE_TARGETS.successRateTarget,
      actual: metrics.successRate,
      passed: metrics.successRate >= PERFORMANCE_TARGETS.successRateTarget
    },
    fallbackRate: {
      target: PERFORMANCE_TARGETS.fallbackRateTarget,
      actual: metrics.fallbackRate,
      passed: metrics.fallbackRate <= PERFORMANCE_TARGETS.fallbackRateTarget
    },
    maxDuration: {
      target: PERFORMANCE_TARGETS.maxDurationTarget,
      actual: metrics.maxDuration,
      passed: metrics.maxDuration <= PERFORMANCE_TARGETS.maxDurationTarget
    }
  };

  const allPassed = Object.values(results).every(r => r.passed);
  const passedCount = Object.values(results).filter(r => r.passed).length;
  const totalCount = Object.keys(results).length;

  const summary = allPassed 
    ? `✅ All performance targets met (${passedCount}/${totalCount})`
    : `⚠️ Performance targets partially met (${passedCount}/${totalCount})`;

  return {
    passed: allPassed,
    results,
    summary
  };
}

export function logPerformanceVerification(): void {
  const verification = verifyPerformanceTargets();
  
  console.group('🎯 Performance Target Verification');
  console.log(verification.summary);
  console.log('');
  
  Object.entries(verification.results).forEach(([metric, result]) => {
    const icon = result.passed ? '✅' : '❌';
    const unit = metric.includes('Duration') ? 'ms' : '%';
    console.log(`${icon} ${metric}: ${result.actual.toFixed(1)}${unit} (target: ${result.target}${unit})`);
  });
  
  if (!verification.passed) {
    console.log('');
    console.log('💡 Tips for improvement:');
    if (!verification.results.avgDuration.passed) {
      console.log('  - Enable virtual scrolling for large datasets');
      console.log('  - Use database-level aggregations instead of client processing');
    }
    if (!verification.results.successRate.passed) {
      console.log('  - Check network connectivity and error handling');
      console.log('  - Review fallback mechanisms');
    }
    if (!verification.results.fallbackRate.passed) {
      console.log('  - Investigate materialized view performance');
      console.log('  - Check database connection stability');
    }
    if (!verification.results.maxDuration.passed) {
      console.log('  - Implement query timeout mechanisms');
      console.log('  - Optimize slow database queries');
    }
  }
  
  console.groupEnd();
}