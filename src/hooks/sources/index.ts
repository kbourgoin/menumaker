
import { useSourceQueries } from './useSourceQueries';
import { useSourceMutations } from './useSourceMutations';
import { useSourceMerge } from './useSourceMerge';

export function useSources() {
  const { getSources, getSource, getDishesBySource, findSourceByName } = useSourceQueries();
  const { addSource, updateSource, deleteSource } = useSourceMutations();
  const { mergeSources } = useSourceMerge();

  return {
    // Source queries
    getSources,
    getSource,
    getDishesBySource,
    findSourceByName,
    
    // Source mutations
    addSource,
    updateSource,
    deleteSource,
    
    // Source merge
    mergeSources
  };
}

export * from './useSourceQueries';
export * from './useSourceMutations';
export * from './useSourceMerge';
