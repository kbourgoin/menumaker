import { useSourceQueries } from "./useSourceQueries";
import { useSourceMutations } from "./useSourceMutations";
import { useSourceMerge } from "./useSourceMerge";

export function useSources() {
  const {
    sources,
    isLoadingSources,
    sourcesError,
    isSourcesError,
    refetchSources,
    getSources,
    getSource,
    getDishesBySource,
    findSourceByName,
    createSourceError,
  } = useSourceQueries();

  const {
    addSource,
    updateSource,
    deleteSource,
    isAddingSource,
    isUpdatingSource,
    isDeletingSource,
    createSourceMutationError,
  } = useSourceMutations();

  const { mergeSources, isMergingSources, createSourceMergeError } =
    useSourceMerge();

  return {
    // Source queries
    sources,
    isLoadingSources,
    sourcesError,
    isSourcesError,
    refetchSources,
    getSources,
    getSource,
    getDishesBySource,
    findSourceByName,

    // Source mutations
    addSource,
    updateSource,
    deleteSource,
    isAddingSource,
    isUpdatingSource,
    isDeletingSource,

    // Source merge
    mergeSources,
    isMergingSources,

    // Error utilities
    createSourceError,
    createSourceMutationError,
    createSourceMergeError,
  };
}

export * from "./useSourceQueries";
export * from "./useSourceMutations";
export * from "./useSourceMerge";
