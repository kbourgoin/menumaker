import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { mapHouseholdFromDB } from "@/integrations/supabase/mappers/householdMappers";
import { Household, Profile } from "@/types";
import { classifyError, logError } from "@/utils/errorHandling";
import { ErrorType } from "@/types/errors";

export function useHouseholdQueries() {
  const {
    data: household,
    isLoading: isLoadingHousehold,
    error: householdError,
  } = useQuery({
    queryKey: ["household"],
    queryFn: async (): Promise<Household | null> => {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();
      if (authError || !user?.id) return null;

      // Get user's household_id from profile
      // @ts-expect-error - household_id not in auto-generated types yet
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("household_id")
        .eq("id", user.id)
        .single();

      if (profileError || !profile?.household_id) {
        if (profileError)
          logError(classifyError(profileError), "useHouseholdQueries:profile");
        return null;
      }

      // Fetch household
      // @ts-expect-error - households table not in auto-generated types yet
      const { data, error } = await supabase
        .from("households")
        .select("*")
        .eq("id", profile.household_id)
        .single();

      if (error) {
        logError(classifyError(error), "useHouseholdQueries:household");
        return null;
      }

      return mapHouseholdFromDB(data);
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: (failureCount, error) => {
      const appError = classifyError(error);
      return appError.type === ErrorType.NETWORK_ERROR && failureCount < 2;
    },
  });

  const { data: members = [], isLoading: isLoadingMembers } = useQuery({
    queryKey: ["householdMembers"],
    queryFn: async (): Promise<Profile[]> => {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();
      if (authError || !user?.id) return [];

      // RLS scopes profiles to household members
      const { data, error } = await supabase
        .from("profiles")
        .select("id, username, avatar_url, updated_at");

      if (error) {
        logError(classifyError(error), "useHouseholdQueries:members");
        return [];
      }

      return (data || []).map(p => ({
        id: p.id,
        username: p.username ?? undefined,
        avatarUrl: p.avatar_url ?? undefined,
        updatedAt: p.updated_at ?? undefined,
        householdId: "", // populated by RLS scope; not returned in select
      }));
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    enabled: !!household,
  });

  return {
    household,
    members,
    isLoading: isLoadingHousehold || isLoadingMembers,
    error: householdError ? classifyError(householdError) : null,
  };
}
