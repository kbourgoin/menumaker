// Consolidated meal history hooks with enhanced error handling
export { useMealHistoryQueries } from './useMealHistoryQueries';
export { useMealHistoryMutations } from './useMealHistoryMutations';

// Re-export for backward compatibility with consolidated interface
import { useMealHistoryQueries } from './useMealHistoryQueries';
import { useMealHistoryMutations } from './useMealHistoryMutations';

export function useMealHistory() {
  const queries = useMealHistoryQueries();
  const mutations = useMealHistoryMutations();

  return {
    // Query functions
    ...queries,
    
    // Mutation functions
    ...mutations
  };
}