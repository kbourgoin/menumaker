import { useSources } from "@/hooks/sources";
import { Source } from "@/types";

export const useSourceInfo = () => {
  const { sources } = useSources();

  // Create a lookup map for source info to avoid individual requests
  const sourceInfoMap =
    sources && Array.isArray(sources)
      ? sources.reduce(
          (map, source) => {
            map[source.id] = {
              name: source.name,
              type: source.type,
              url: source.url,
            };
            return map;
          },
          {} as Record<string, { name: string; type: string; url?: string }>
        )
      : {};

  return { sourceInfoMap };
};
