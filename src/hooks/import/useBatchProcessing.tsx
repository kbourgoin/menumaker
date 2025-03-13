
import { useState, useCallback } from "react";

// Hook for processing items in batches with progress tracking
export function useBatchProcessing<T, R>(
  processFn: (items: T[], onProgress?: (processed: number, total: number) => void) => Promise<R>,
  batchSize: number = 5
) {
  const [isProcessing, setIsProcessing] = useState(false);
  
  const processBatches = useCallback(
    async (items: T[], onProgress?: (processed: number, total: number) => void) => {
      setIsProcessing(true);
      
      try {
        return await processFn(items, onProgress);
      } finally {
        setIsProcessing(false);
      }
    },
    [processFn, batchSize]
  );

  return {
    isProcessing,
    processBatches
  };
}
