
import { useImportMealHistory } from "../useImportMealHistory";
import { useClearData } from "../useClearData";
import { useDataExport } from "./useDataExport";
import { useJSONImport } from "./useJSONImport";

/**
 * Hook that provides all data import and management functionality
 */
export function useDataImport() {
  const { importMealHistory } = useImportMealHistory();
  const { clearData } = useClearData();
  const { isExporting, exportAllData, downloadExportFile } = useDataExport();
  const { isImporting, progress, importFromJSON, validateJSONData } = useJSONImport();

  return {
    // Legacy CSV import
    importMealHistory: (
      entries: Parameters<typeof importMealHistory>[0], 
      onProgress?: Parameters<typeof importMealHistory>[1]
    ) => importMealHistory(entries, onProgress),
    
    // JSON import/export
    exportAllData,
    downloadExportFile,
    isExporting,
    importFromJSON,
    validateJSONData,
    isImporting,
    importProgress: progress,
    
    // Data management
    clearData
  };
}
