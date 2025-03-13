
import { useImportMealHistory } from "../useImportMealHistory";
import { useClearData } from "../useClearData";

/**
 * Hook that provides all data import and management functionality
 */
export function useDataImport() {
  const { importMealHistory } = useImportMealHistory();
  const { clearData } = useClearData();

  return {
    importMealHistory: (
      entries: Parameters<typeof importMealHistory>[0], 
      onProgress?: Parameters<typeof importMealHistory>[1]
    ) => importMealHistory(entries, onProgress),
    clearData
  };
}
