import { Source } from "@/types";
import { useSources } from "@/hooks/useSources";

export interface SourceFormData {
  name: string;
  type: "book" | "website";
  description: string;
}

export function useSourceValidation() {
  const { findSourceByName, getDishesBySource } = useSources();

  const validateSourceName = async (
    formData: SourceFormData,
    currentSource: Source | null,
    onDuplicateFound: (duplicate: Source, dishCount: number) => void
  ): Promise<boolean> => {
    if (!currentSource) return true;

    // Check if the name has changed and if there's a duplicate
    if (formData.name.trim() !== currentSource.name) {
      const existingSource = await findSourceByName(
        formData.name.trim(),
        currentSource.id
      );

      if (existingSource && existingSource.type === formData.type) {
        // Only suggest merge if both name AND type match
        // Get the number of dishes affected by the merge
        const dishes = await getDishesBySource(currentSource.id);
        onDuplicateFound(existingSource, dishes.length);
        return false;
      }
    }

    return true;
  };

  return {
    validateSourceName,
  };
}
