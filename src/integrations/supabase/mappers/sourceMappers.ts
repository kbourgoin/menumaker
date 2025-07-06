/**
 * DEPRECATED: This file is deprecated in favor of centralized type mapping.
 * Use @/utils/typeMapping instead for all new code.
 * This file is kept for backward compatibility during migration.
 */

import { Database } from "../types";
import { Source } from "@/types";

// Re-export the new standardized mappers
export { mapSourceFromDB, mapSourceToDB } from "@/utils/typeMapping";

// DEPRECATED: Legacy types and mapping functions below
// These are kept for backward compatibility only
// Use imports above for all new code

/**
 * @deprecated Use DBSourceExtended from @/types/database instead
 */
export type DBSource = Database["public"]["Tables"]["sources"]["Row"] & {
  url?: string;
};

/**
 * @deprecated Use mapSourceFromDB from @/utils/typeMapping instead
 */
export const mapSourceFromDB_LEGACY = (source: DBSource): Source => ({
  id: source.id,
  name: source.name,
  type:
    source.type === "book" || source.type === "website" ? source.type : "book", // Convert any old 'document' type to 'book'
  description: source.description || undefined,
  url: source.url || undefined,
  createdAt: source.created_at,
  userId: source.user_id,
});

/**
 * @deprecated Use mapSourceToDB from @/utils/typeMapping instead
 */
export const mapSourceToDB_LEGACY = (
  source: Partial<Source>
): Partial<Database["public"]["Tables"]["sources"]["Insert"]> & {
  url?: string;
} => {
  // Ensure required fields are present when inserting a new source
  if (source.name === undefined && !source.id) {
    throw new Error("Name is required when creating a new source");
  }

  if (source.type === undefined && !source.id) {
    throw new Error("Type is required when creating a new source");
  }

  return {
    id: source.id,
    name: source.name,
    type: source.type,
    description: source.description,
    url: source.url,
    created_at: source.createdAt,
    user_id: source.userId,
  };
};
