
import { useImportMealHistory } from "./useImportMealHistory";
import { useClearData } from "./useClearData";

export function useDataImport() {
  const { importMealHistory } = useImportMealHistory();
  const { clearData } = useClearData();

  return {
    importMealHistory,
    clearData
  };
}
